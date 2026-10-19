import { api } from "@/api/axios";
import axios from "axios";
const CONTENT_FEED = "https://treksor-admin-production.up.railway.app/api/public/content";
import { countRead, errorHandler } from "@/lib/utils";
import { Article } from "@/types/article";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface fetchArticleRequest {
  id: string;
  category: string;
}

export interface ArticleResponse {
  data: Article[],
  total: Number,
  page: Number,
  totalPages: Number,
}

interface ArticleState {
  articles: Record<string, Article[]>
  unreadArticlesCount: number;
  loading: boolean;
  error: string | null;
  fetchArticles: (query: string) => Promise<void>;
  fetchArticleById: (data: fetchArticleRequest) => Promise<Article | undefined>;
  getUnreadArticlesCount: () => void;
  markArticleAsRead: (type: string, id: string) => void;
  clearData: () => void;
}

export const useArticleStore = create<ArticleState>()(
  persist(
    (set, get) => ({
      articles: {},
      unreadArticlesCount: 0,
      loading: false,
      error: null,

      fetchArticles: async (query) => {
        set({ loading: true, error: null });
        const params = new URLSearchParams(query);
        const category = params.get("category") || "default";
        const key = category === "all" ? "All Articles" : category;
        try {
          const results = await Promise.allSettled([
            api.get<ArticleResponse>(`article?${query}&date=${new Date().toISOString().split("T")[0]}`),
            axios.get<ArticleResponse>(`${CONTENT_FEED}?type=articles`, { timeout: 12000 }),
          ]);
          const legacy = results[0].status === "fulfilled" ? results[0].value.data.data : [];
          const editorial = results[1].status === "fulfilled" ? results[1].value.data.data : [];
          if (results.every(result => result.status === "rejected")) throw new Error("Unable to load articles");
          const merged = [...editorial.filter(article => category === "all" || category === "default" || article.category === category), ...legacy];
          const unique = Array.from(new Map(merged.map(article => [article._id, article])).values());
          set(state => ({
            loading: false,
            articles: { ...state.articles, [key]: unique.map(article => ({ ...article, isRead: state.articles[key]?.find(old => old._id === article._id)?.isRead ?? false })) }
          }));
        } catch (error) {
          set({ loading: false, error: "Unable to load articles" });
          console.error("Article sync failed", error);
        }
      },

      fetchArticleById: async (data) => {
        try {
          set({ loading: true, error: null });
          const articles = get().articles[data.category] = get().articles[`${data.category}`] || [];
          const article = articles.find(article => article._id === data.id);
          set({ loading: false });
          return article;
        } catch (error: any) {
          console.error("fetchArticleById error:", { error: error.response.data });
          set({ error: error.response.data.message, loading: false });
          errorHandler(error);
        }
      },

      clearData: () => {
        set({ articles: {}, loading: false, error: null });
      },

      getUnreadArticlesCount: () => { 

        const { articles } = useArticleStore.getState();
      
        const allArticles = articles['All Articles'] || [];
        const allArticlesRead = allArticles ? countRead(allArticles) : 0;
      
        set({ unreadArticlesCount: allArticles.length - allArticlesRead });
      },

      markArticleAsRead: (type: string, id: string) => {
        const allArticles = get().articles;

        if (type === 'All Articles') {
          const existingArticles = allArticles[type] || [];
          const articleIndex = existingArticles.findIndex(article => article._id === id);
          if (articleIndex !== -1) {
            existingArticles[articleIndex].isRead = true;
            const existingCategoryArticles = allArticles[existingArticles[articleIndex].category] || [];
            const categoryArticleIndex = existingCategoryArticles.findIndex(article => article._id === id);
            if (categoryArticleIndex !== -1) {
              existingCategoryArticles[categoryArticleIndex].isRead = true;
            }
            allArticles[existingArticles[articleIndex].category] = existingCategoryArticles;
          }
        } else {
          const existingArticles = allArticles[type] || [];
          const articleIndex = existingArticles.findIndex(article => article._id === id);
          if (articleIndex !== -1) {
            existingArticles[articleIndex].isRead = true;
          }
          const existingCategoryArticles = allArticles['All Articles'] || [];
          const categoryArticleIndex = existingCategoryArticles.findIndex(article => article._id === id);
          if (categoryArticleIndex !== -1) {
            existingCategoryArticles[categoryArticleIndex].isRead = true;
          }
          allArticles['All Articles'] = existingCategoryArticles;
        }
        const totalArticles = allArticles['All Articles'] || [];
        const allArticlesRead = totalArticles ? countRead(totalArticles) : 0;
      
        set({ articles: allArticles, unreadArticlesCount: totalArticles.length - allArticlesRead });
      },

    }),
    {
      name: "article-storage-1.0",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        articles: state.articles,
        unreadArticlesCount: state.unreadArticlesCount,
      }),
    }
  )
);
