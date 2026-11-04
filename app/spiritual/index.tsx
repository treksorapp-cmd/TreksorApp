import ArticleCard from "@/components/ArticleCard";
import Button from "@/components/ui/Button";
import { useArticleStore } from "@/store/article-store";
import { useMediationStore } from "@/store/mediation-store";
import { Article } from "@/types/article";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SpiritualHome = () => {
  const insets = useSafeAreaInsets();
  const { fetchArticles, loading, articles } = useArticleStore();
  const {fetchMediationLockedStatus} = useMediationStore();
  const [currentThoughtIndex, setCurrentThoughtIndex] = useState(0);

  useEffect(()=>{
    fetchArticles(`category=Spiritual`);
  },[])

  const handleArticlePress = (article: Article) => {
    router.push(`/spiritual/articles/${article._id}`);
  };

  const renderArticleCard = ({ item }: { item: Article }) => {
    return <ArticleCard item={item} handleArticlePress={handleArticlePress} />;
  };

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={64} color="#FFFFFF" />
        <Text style={styles.emptyStateText}>No articles found</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
        <View style={[styles.content, { paddingBottom: insets.bottom + 30 }]}>
          <Text style={{fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginVertical: 20}}>Meditation</Text>
          <Button onPress={()=>router.push("/spiritual/mediation/beginner")} icon={require("@/assets/images/beginner.png")} iconImage iconImageIcon={"progress-one"} disabled={fetchMediationLockedStatus('beginner')} iconStyle={{width: 40, height: 13}} buttonStyle={{width: width - 20}}>Beginner</Button>
          <Button onPress={()=>router.push("/spiritual/mediation/intermediate")} icon={require("@/assets/images/intermediate.png")} iconImage iconImageIcon={"progress-two"} disabled={fetchMediationLockedStatus('intermediate')} iconStyle={{width: 40, height: 13}} buttonStyle={{width: width - 20}}>Intermediate</Button>
          <Button onPress={()=>router.push("/spiritual/mediation/advanced")} icon={require("@/assets/images/advanced.png")} iconImage iconImageIcon={"progress-full"} disabled={fetchMediationLockedStatus('advanced')} iconStyle={{width: 40, height: 13}} buttonStyle={{width: width - 20}}>Advanced</Button>

          <Text style={{fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginVertical: 20}}>Articles</Text>
            <FlatList
            data={articles["Spiritual"]?.slice(0, 3)}
            renderItem={renderArticleCard}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            showsHorizontalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            horizontal
            pagingEnabled
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / width
              );
              setCurrentThoughtIndex(index);
            }}
          />
          <View style={styles.paginationContainer}>
            {articles["Spiritual"]?.slice(0, 3).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentThoughtIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.viewAll} onPress={() => router.push("/spiritual/articles")}>
            <Text style={styles.viewAllText}>See All Articles</Text>
          </TouchableOpacity>
        </View>
    </View>
  );
};

export default SpiritualHome;

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    width,
    height,
  },
  imageStyle: {
    opacity: 1,
  },
  scrollView: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    // flex: 1,
    paddingHorizontal: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSpacer: {
    width: 34,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
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
  listContainer: {
    // paddingHorizontal: 10,
    flexGrow: 1,
    justifyContent:'center',
    paddingVertical: 5,
    gap: 20
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#EFB33F",
  },
  viewAll: {
    height: 60,
    width: width - 20,
    backgroundColor: "#EFB33F",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 50,
  },
  viewAllText: {
    fontWeight: "600",
    fontSize: 18,
  },
});
