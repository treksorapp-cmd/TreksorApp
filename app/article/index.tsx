import { useContentRefresh } from "@/hooks/useContentRefresh";
import BodyPageHeading from "@/components/BodyPageHeading";
"use client";

import ArticleCard from "@/components/ArticleCard";
import CategoryFilter from "@/components/ui/CategoryFilter";
import { useArticleStore } from "@/store/article-store";
import { Article } from "@/types/article";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface ArticlesScreenProps {
  mode?: "tab" | "stack";
  category?: string
}
type TabType = "newest" | "popular";

const { width } = Dimensions.get("window");
const cardWidth = (width - 60) / 2; // Account for padding and gap

export default function ArticlesScreen({ mode = "tab", category = "All Articles" }: ArticlesScreenProps) {
  const { fetchArticles, loading, articles, error } = useArticleStore();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState(category)
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("newest");
  const categories = ["All Articles", "Body", "Mental", "Spiritual", "Purpose"]

  const fetchArticlesMethod = async (pageNum = 1, refresh = false, category?: string) => {
    if (pageNum === 1) {
      refresh && setRefreshing(true); // : setLoading(true)
    } else {
      setLoadingMore(true);
    }
    const categoryParam = category && category !== "All Articles" ? `${category}` : "all"
    try {
      await fetchArticles(`category=${categoryParam}&page=${pageNum}`);
      //   const response = await fetch(`https://app.treksor.app/api/v1/article?category=Body&page=${pageNum}`)
      //   const data: ApiResponse = await response.json()

      //   if (data.success) {
      // if (pageNum === 1) {
      //   setArticles(data.data)
      // } else {
      //   setArticles((prev) => [...prev, ...data.data])
      // }
      // setTotalPages(data.totalPages)
      // setPage(pageNum)
      //   }
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      //   setLoading(false)
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const refreshContent = useCallback(() => fetchArticles(`category=${encodeURIComponent(activeCategory === "All Articles" ? "all" : activeCategory)}&page=1`), [activeCategory, fetchArticles]);
  useContentRefresh(refreshContent);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refreshContent(); } finally { setRefreshing(false); }
  }, [refreshContent]);

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      // fetchArticlesMethod(page + 1);
      fetchArticlesMethod(page + 1, false, activeCategory === "All Articles" ? undefined : activeCategory)
    }
  };

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
  }

  const renderArticleCard = ({ item }: { item: Article }) => {
    return <ArticleCard item={item} handleArticlePress={handleArticlePress} />;
  };

  const handleArticlePress = (article: Article) => {
    const path = mode === "stack" ? `/${category === "Body" ? "body" : category === "Spiritual" ? "spiritual" : "mental"}/articles/${article._id}?category=${activeCategory}` : `/(tabs)/articles/${article._id}?category=${activeCategory}`;
    router.push(path);
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#D7B877" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={64} color="#666666" />
        <Text style={styles.emptyStateText}>No articles found</Text>
        <Text style={styles.emptyStateSubtext}>Pull down to refresh</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar style="light" />

      {mode === "stack" && <BodyPageHeading trail={category === "Body" ? "BODY / READING" : category === "Spiritual" ? "BALANCE / READING" : "MIND / READING"} title="Articles" style={{paddingTop:insets.top+12,paddingBottom:20}} />}
      {mode === "stack" && (
        <View style={styles.tabContainer}>
          <View style={styles.tabInnerContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "newest" && styles.activeTab]}
              onPress={() => handleTabPress("newest")}
              activeOpacity={0.8}
            >
              {activeTab === "newest" ? (
                <Text style={[styles.tabText, styles.activeTabText]}>
                  Newest
                </Text>
              ) : (
                <Text style={styles.tabText}>Newest</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "popular" && styles.activeTab]}
              onPress={() => handleTabPress("popular")}
              activeOpacity={0.8}
            >
              {activeTab === "popular" ? (
                <Text style={[styles.tabText, styles.activeTabText]}>
                  Popular
                </Text>
              ) : (
                <Text style={styles.tabText}>Popular</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {(mode === 'tab' || mode === 'stack') && (
        <CategoryFilter categories={categories} activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
      )}

      {error && <TouchableOpacity onPress={handleRefresh} accessibilityRole="button"><Text style={{ color: "#D7B877", padding: 16 }}>{error}. Tap to retry.</Text></TouchableOpacity>}
      {/* Articles List */}
      <View style={styles.content}>
        {loading && !(articles[activeCategory]?.length) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D7B877" />
            <Text style={styles.loadingText}>Loading articles...</Text>
          </View>
        ) : (
          <FlatList
            data={articles[activeCategory]}
            renderItem={renderArticleCard}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#D7B877"
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pageHeading:{paddingHorizontal:22,paddingBottom:14},
  eyebrow:{color:"#D7B877",fontSize:11,fontWeight:"700",letterSpacing:1.6},
  pageTitle: {color: "#F5F4F1",fontSize: 34,fontWeight: "600",letterSpacing: -0.6,marginTop:7, lineHeight: 42, includeFontPadding: false, },
  container: {
    flex: 1,
    backgroundColor: "#02050C",
  },
  tabContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tabInnerContainer: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(183,221,240,0.075)",
    borderWidth:1,
    borderColor:"rgba(205,235,248,0.20)",
    height: 56,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "rgba(183,221,240,0.17)",
    borderRadius: 12,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#AAAAAA",
    fontSize: 16,
    marginTop: 10,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    paddingBottom: 100,
    gap: 20,
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#AAAAAA",
    marginTop: 8,
  },
});
