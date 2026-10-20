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
import { SafeAreaView } from "react-native-safe-area-context";

interface ArticlesScreenProps {
  mode?: "tab" | "stack";
  category?: string
}
type TabType = "newest" | "popular";

const { width } = Dimensions.get("window");
const cardWidth = (width - 60) / 2; // Account for padding and gap

export default function ArticlesScreen({ mode = "tab", category = "All Articles" }: ArticlesScreenProps) {
  const { fetchArticles, loading, articles } = useArticleStore();
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
      fetchArticles(`category=${categoryParam}&page=${pageNum}`);
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

  // useEffect(() => {
  //   fetchArticlesMethod(1);
  // }, []);

  useEffect(() => {
    fetchArticlesMethod(1, false, activeCategory === "All Articles" ? undefined : activeCategory)
  }, [activeCategory])

  const handleRefresh = useCallback(() => {
    // fetchArticlesMethod(1, true);
    fetchArticlesMethod(1, true, activeCategory === "All Articles" ? undefined : activeCategory)
  }, []);

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
    const path = activeCategory === 'All Articles' 
      ? `/(tabs)/articles/${article._id}?category=${activeCategory}` 
      : `/${activeCategory.toLowerCase()}/articles/${article._id}?category=${activeCategory}`;
    router.push(path);
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#F39C12" />
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

      {/* Articles List */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F39C12" />
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
                tintColor="#F39C12"
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
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  tabContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tabInnerContainer: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#1F2127",
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
    backgroundColor: "#EFB33F",
    borderRadius: 12,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  activeTabText: {
    color: "#000000",
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
    paddingHorizontal: 10,
    paddingVertical: 5,
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
