import { matchesCategory } from "@/lib/content-publication";
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
            api.get<ArticleResponse>(`article?${query}&date=${new Date().toISOString().split("T")[0]}`, { timeout: 12000 }),
            axios.get<ArticleResponse>(`${CONTENT_FEED}?type=articles`, { timeout: 12000 }),
          ]);
          const legacy = results[0].status === "fulfilled" ? results[0].value.data.data : [];
          const editorial = results[1].status === "fulfilled" ? results[1].value.data.data : [];
          if (results.every(result => result.status === "rejected")) throw new Error("Unable to load articles");
          if (results[1].status === "rejected") throw new Error("Dashboard content unavailable");
          if (!Array.isArray(editorial) || !Array.isArray(legacy)) throw new Error("Invalid article feed");
          const merged = [...legacy, ...editorial.filter(article => matchesCategory(article.category, category))];
          const unique = Array.from(new Map(merged.map(article => [article._id, article])).values());
          set(state => ({
            loading: false,
            articles: { ...state.articles, [key]: unique.map(article => ({ ...article, isRead: Object.values(state.articles).flat().some(old => old._id === article._id && old.isRead) })) }
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
        set(state => {
          const articles = Object.fromEntries(Object.entries(state.articles).map(([key, list]) => [key, list.map(article => article._id === id ? { ...article, isRead: true } : article)]));
          const all = articles["All Articles"] || [];
          return { articles, unreadArticlesCount: all.length - countRead(all) };
        });
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
