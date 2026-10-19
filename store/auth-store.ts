import { api } from "@/api/axios";
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
      loading: false,
      error: null,

      login: async (data: LoginRequest) => {
        try {
          set({ loading: true, error: null });
          const {data:response} = await api.post<AuthResponse>("auth/login", data);
          set({
            token: response.data.token,
            isAuthenticated: true,
            loading: false,
          });
        } catch (error: any) {
          console.error("login error:", { error:error?.response?.data ?? error?.message });
          set({ error: (error?.response?.data?.message || (error?.code === "ECONNABORTED" ? "El servidor no respondió a tiempo." : "No se pudo conectar al servidor de Treksor.")), loading: false });
          errorHandler(error);
        }
      },

      register: async (data: RegisterRequest) => {
        try {
          set({ loading: true, error: null });
          await api.post<void>("auth/register", data);
          set({
            loading: false,
          });
        } catch (error: any) {
          console.error("register error:", {error:error?.response?.data ?? error?.message });
          set({ error: (error?.response?.data?.message || (error?.code === "ECONNABORTED" ? "El servidor no respondió a tiempo." : "No se pudo conectar al servidor de Treksor.")), loading: false });
          errorHandler(error);
        }
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

      requestResetPassword: async (data: RequestResetPasswordRequest) => {
        try {
          set({ loading: true, error: null });
          await api.post<void>("auth/request-reset-password", data);
          set({ loading: false, isChangePassword: data.isChangePassword });
        } catch (error: any) {
          console.error("requestResetPassword error:", {error:error?.response?.data ?? error?.message });
          set({ error: (error?.response?.data?.message || (error?.code === "ECONNABORTED" ? "El servidor no respondió a tiempo." : "No se pudo conectar al servidor de Treksor.")), loading: false });
          errorHandler(error);
        }
      },

      resetPassword: async (data: ResetPasswordRequest) => {
        try {
          set({ loading: true, error: null });
          await api.post<void>("auth/reset-password", data);
          set({ loading: false });
        } catch (error: any) {
          console.error("resetPassword error:", {error:error?.response?.data ?? error?.message });
          set({ error: (error?.response?.data?.message || (error?.code === "ECONNABORTED" ? "El servidor no respondió a tiempo." : "No se pudo conectar al servidor de Treksor.")), loading: false });
          errorHandler(error);
        }
      },

      requestOtp: async (data: RequestOtpRequest) => {
        try {
          set({ loading: true, error: null });
          await api.post<void>("auth/request-otp", data);
          set({ loading: false });
        } catch (error: any) {
          console.error("requestOtp error:", {error:error?.response?.data ?? error?.message });
          set({ error: (error?.response?.data?.message || (error?.code === "ECONNABORTED" ? "El servidor no respondió a tiempo." : "No se pudo conectar al servidor de Treksor.")), loading: false });
          errorHandler(error);
        }
      },

      verifyOtp: async (data: VerifyOtpRequest) => {
        try {
          set({ loading: true, error: null });
          const {data:response} = await api.post<AuthResponse>("auth/verify-otp", data);
          if(response.data.resetToken)
          {
            set({ loading: false, isChangePassword: false, isVerified: false, isAuthenticated:false });
            return response.data.resetToken;
          }      
          set({ loading: false, token: response.data.token, isAuthenticated: true });
        } catch (error: any) {
          console.error("verifyOtp error:", {error:error?.response?.data ?? error?.message });
          set({ error: (error?.response?.data?.message || (error?.code === "ECONNABORTED" ? "El servidor no respondió a tiempo." : "No se pudo conectar al servidor de Treksor.")), loading: false });
          errorHandler(error);
        }
      },

      getCurrentUser: async () => {
        try {
          set({ loading: true, error: null });
          const {data:response} = await api.get<AuthResponse>("user/me");
          console.log("getCurrentUser", response?.data);
          set({ loading: false, user: response.data.user, isVerified: response.data.user?.isVerified });
          return response.data.user?.isVerified;
        } catch (error: any) {
          console.error("getCurrentUser error:", {error:error?.response?.data ?? error?.message });
          set({ error: (error?.response?.data?.message || (error?.code === "ECONNABORTED" ? "El servidor no respondió a tiempo." : "No se pudo conectar al servidor de Treksor.")), loading: false });
          errorHandler(error);
        }
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
      }),
    }
  )
);
