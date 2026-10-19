import { api } from "@/api/axios";
import { supabaseAuth } from "@/api/supabase-auth";
import { errorHandler } from "@/lib/utils";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { ImagePickerAsset } from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useArticleStore } from "./article-store";
import { useMediationStore } from "./mediation-store";
import { useMySpaceStore } from "./myspace-store";
import { usePowerThoughtStore } from "./thought-store";
import { useTrackingStore } from "./tracking-store";
import { useUserStore } from "./user-store";
import { useWorkoutStore } from "./workout-store";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface ThirdPartyAuthRequest {
  name: string;
  email: string;
  photo?: string | null;
  provider: string
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
  type: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface RequestResetPasswordRequest {
  email: string;
  isChangePassword?: boolean;
}

export interface RequestOtpRequest {
  email: string;
}

export interface updateProfileRequest {
  name: string | null;
  avatar: ImagePickerAsset | null;
}

export interface AuthResponse {
  data: {
    user?: {
      id: string;
      name: string;
      email: string;
      role: string;
      isVerified: boolean;
      avatar?: string;
    };
    token?: string;
    resetToken?: string;
  }
}

interface AuthState {
  isAuthenticated: boolean;
  isVerified: boolean;
  isChangePassword: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    authProvider?: string;
    createdAt: string;
    daysLeft: string;
    plan: string;
  };
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  register: (data: RegisterRequest) => Promise<void>;
  signInWithThirdParty: (data: ThirdPartyAuthRequest) => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;
  requestResetPassword: (data: RequestResetPasswordRequest) => Promise<void>;
  verifyOtp: (data: VerifyOtpRequest) => Promise<string | undefined>;
  requestOtp: (data: RequestOtpRequest) => Promise<void>;
  getCurrentUser: () => Promise<boolean | undefined>;
  updateProfile: (data: updateProfileRequest) => Promise<void>;
  clearError: () => void
}

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isVerified: false,
      isChangePassword: false,
      user: {
        id: "",
        name: "",
        email: "",
        role: "",
      },
      token: null,
      refreshToken: null,
      loading: false,
      error: null,

      login: async ({ email, password }) => {
        set({ loading: true, error: null });
        try {
          const response = await supabaseAuth.signIn(email, password);
          if (!response.access_token) throw new Error("Confirmá tu correo electrónico para iniciar sesión.");
          const u = response.user;
          set({
            token: response.access_token,
            refreshToken: response.refresh_token ?? null,
            isAuthenticated: true,
            isVerified: !!u?.email_confirmed_at,
            user: { id: u?.id ?? "", email: u?.email ?? email, name: u?.user_metadata?.name ?? "", role: "user", createdAt: "", daysLeft: "1", plan: "" },
          });
        } catch (error) {
          set({ error: (error instanceof Error ? error.message : "No se pudo conectar al servidor de autenticación."), isAuthenticated: false });
        } finally { set({ loading: false }); }
      },

      register: async ({ name, email, password }) => {
        set({ loading: true, error: null });
        try {
          const response = await supabaseAuth.signUp(name, email, password);
          if (response.access_token) {
            set({
              token: response.access_token,
              refreshToken: response.refresh_token ?? null,
              isAuthenticated: true,
              isVerified: !!response.user?.email_confirmed_at,
              user: { id: response.user?.id ?? "", name, email, role: "user", createdAt: "", daysLeft: "1", plan: "" },
            });
          }
        } catch (error) { set({ error: (error instanceof Error ? error.message : "No se pudo conectar al servidor de autenticación.") }); }
        finally { set({ loading: false }); }
      },

      signInWithThirdParty: async (data: ThirdPartyAuthRequest) => {
        try {
          set({ loading: true, error: null });
          const {data:response} = await api.post<AuthResponse>("auth/third-party", data);
          set({
            token: response.data.token,
            isAuthenticated: true,
            loading: false,
          });
        } catch (error: any) {
          console.error("register error:", {error:error?.response?.data ?? error?.message });
          set({ error: (error?.response?.data?.message || (error?.code === "ECONNABORTED" ? "El servidor no respondió a tiempo." : "No se pudo conectar al servidor de Treksor.")), loading: false });
          errorHandler(error);
        }
      },

      logout: async () => {
        if (get().user.authProvider === 'google') {
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
        }
        set({
          isAuthenticated: false,
          isVerified: false,
          user: { id: "", name: "", email: "", role: "" },
          token: null,
          refreshToken: null,
        });
        useArticleStore.getState().clearData();
        // useChatStore.getState().clearData();
        useMediationStore.getState().clearData();
        useMySpaceStore.getState().clearData();
        usePowerThoughtStore.getState().clearData();
        useTrackingStore.getState().clearData();
        useUserStore.getState().clearData();
        useWorkoutStore.getState().clearData();
      },

      requestResetPassword: async ({ email, isChangePassword }) => {
        set({ loading: true, error: null });
        try {
          await supabaseAuth.resetPassword(email);
          set({ isChangePassword: !!isChangePassword });
        } catch (error) { set({ error: (error instanceof Error ? error.message : "No se pudo conectar al servidor de autenticación.") }); }
        finally { set({ loading: false }); }
      },

      resetPassword: async ({ token, password }) => {
        set({ loading: true, error: null });
        try { await supabaseAuth.updatePassword(token, password); }
        catch (error) { set({ error: (error instanceof Error ? error.message : "No se pudo conectar al servidor de autenticación.") }); }
        finally { set({ loading: false }); }
      },

      requestOtp: async ({ email }) => {
        set({ loading: true, error: null });
        try { await supabaseAuth.resetPassword(email); }
        catch (error) { set({ error: (error instanceof Error ? error.message : "No se pudo conectar al servidor de autenticación.") }); }
        finally { set({ loading: false }); }
      },

      verifyOtp: async ({ email, otp, type }) => {
        set({ loading: true, error: null });
        try {
          const response = type === "reset-password"
            ? await supabaseAuth.verifyRecovery(email, otp)
            : await supabaseAuth.verifySignup(email, otp);
          if (type === "reset-password") return response.access_token;
          if (response.access_token) set({ token: response.access_token, refreshToken: response.refresh_token ?? null, isAuthenticated: true, isVerified: true });
        } catch (error) { set({ error: (error instanceof Error ? error.message : "No se pudo conectar al servidor de autenticación.") }); }
        finally { set({ loading: false }); }
      },

      getCurrentUser: async () => {
        set({ loading: true, error: null });
        try {
          let token = get().token;
          if (!token) return false;
          let response;
          try { response = await supabaseAuth.currentUser(token); }
          catch (error) {
            const refreshToken = get().refreshToken;
            if (!refreshToken) throw error;
            const refreshed = await supabaseAuth.refresh(refreshToken);
            if (!refreshed.access_token) throw error;
            token = refreshed.access_token;
            set({ token, refreshToken: refreshed.refresh_token ?? refreshToken });
            response = await supabaseAuth.currentUser(token);
          }
          const u = response.user ?? (response as any);
          const verified = !!u?.email_confirmed_at;
          set({
            isAuthenticated: true, isVerified: verified,
            user: { ...get().user, id: u.id, email: u.email ?? "", name: u.user_metadata?.name ?? get().user.name, role: "user", daysLeft: "1" },
          });
          return verified;
        } catch (error) {
          set({ error: (error instanceof Error ? error.message : "No se pudo conectar al servidor de autenticación."), isAuthenticated: false, isVerified: false, token: null, refreshToken: null });
          return false;
        } finally { set({ loading: false }); }
      },

      updateProfile: async (data: updateProfileRequest) => {
        try {
          set({ loading: true, error: null });
          const formData = new FormData();
          if (data.avatar) {
            if (data.avatar.uri) {
              formData.append("avatar",  {
                uri: data.avatar.uri,
                name: data.avatar.fileName || 'photo.jpg',
                type: data.avatar.type,
              } as any);
            }
          }
          if (data.name) {
            formData.append("name", data.name);
          }
          const config = {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          };
          await api.patch<AuthResponse>("user/profile", formData, config);
          set({ loading: false });
        } catch (error: any) {
          console.error("updateProfile error:", {error:error?.response?.data ?? error?.message });
          set({ error: (error?.response?.data?.message || (error?.code === "ECONNABORTED" ? "El servidor no respondió a tiempo." : "No se pudo conectar al servidor de Treksor.")), loading: false });
          errorHandler(error);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isVerified: state.isVerified,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
