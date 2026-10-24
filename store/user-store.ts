import { api } from "@/api/axios";
import { errorHandler } from "@/lib/utils";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface savePushTokenRequest {
  pushToken: string;
}

export interface SavePushTokenResonse {
  message: string;
  success: boolean;
}

export interface DeactivateAccountResponse {
  message: string;
  success: boolean;
}

export interface PurchasePlanResponse {
  message: string;
  success: boolean;
}

export interface CancelSubscriptionResponse {
  message: string;
  success: boolean;
}



interface UserState {
  // user: {
  //   id: string;
  //   name: string;
  //   email: string;
  //   role: string;
  //   avatar?: string;
  // };
  pushToken: string | null;
  savePushToken: (data: savePushTokenRequest) => Promise<void>;
  deactivateAccount: () => Promise<void>;
  purchasePlan: (data: {planType: string}) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  // token: string | null;
  loading: boolean;
  error: string | null;
  clearData: () => void;
  showPackages: boolean;
  setShowPackages: (data: boolean) => void;
  // getCurrentUser: () => Promise<boolean | undefined>;
  // updateProfile: (data: updateProfileRequest) => Promise<void>;
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

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      // user: {
      //   id: "",
      //   name: "",
      //   email: "",
      //   role: "",
      // },
      pushToken: null,
      loading: false,
      error: null,
      showPackages: false,

      savePushToken: async (data: savePushTokenRequest) => {
        try {
          set({ loading: true, error: null });          
          await api.post<SavePushTokenResonse>("user/save-push-token", data);
          set({ loading: false });
        } catch (error: any) {
          console.error("savePushToken error:", { error:error?.response?.data ?? error?.message });
          set({ error: error?.response?.data?.message || error?.message || "Service unavailable", loading: false });
          errorHandler(error);
        }
      },

      setShowPackages: (data: boolean) => {
        set({ showPackages: data });
      },

      deactivateAccount: async () => {
        try {
          set({ loading: true, error: null });
          await api.delete<DeactivateAccountResponse>("user/deactivate");
          set({ loading: false });
        } catch (error: any) {
          console.error("deactivateAccount error:", { error:error?.response?.data ?? error?.message });
          set({ error: error?.response?.data?.message || error?.message || "Service unavailable", loading: false });
          errorHandler(error);
        }
      },

      purchasePlan: async (data: {planType: string}) => {
        try {
          set({ loading: true, error: null });
          await api.post<PurchasePlanResponse>("user/purchase-plan", data);
          set({ loading: false });
        } catch (error: any) {
          console.error("purchasePlanError error:", { error:error?.response?.data ?? error?.message });
          set({ error: error?.response?.data?.message || error?.message || "Service unavailable", loading: false });
          errorHandler(error);
        }
      },

      cancelSubscription: async () => {
        try {
          set({ loading: true, error: null });
          await api.post<CancelSubscriptionResponse>("user/cancel-subscription");
          set({ loading: false });
        } catch (error: any) {
          console.error("cancelSubscription error:", { error:error?.response?.data ?? error?.message });
          set({ error: error?.response?.data?.message || error?.message || "Service unavailable", loading: false });
          errorHandler(error);
        }
      },
      

      clearData: () => {
        set({
          pushToken: null,
          loading: false,
          error: null,
        })
      },

      // getCurrentUser: async () => {
      //   try {
      //     set({ loading: true, error: null });
      //     const {data:response} = await api.get<AuthResponse>("user/me");
      //     set({ loading: false, user: response.data.user, isVerified: response.data.user?.isVerified });
      //     return response.data.user?.isVerified;
      //   } catch (error: any) {
      //     console.error("getCurrentUser error:", {error:error?.response?.data ?? error?.message });
      //     set({ error: error?.response?.data?.message || error?.message || "Service unavailable", loading: false });
      //     errorHandler(error);
      //   }
      // },

      // updateProfile: async (data: updateProfileRequest) => {
      //   try {
      //     set({ loading: true, error: null });
      //     const formData = new FormData();
      //     if (data.avatar) {
      //       if (data.avatar.uri) {
      //         formData.append("avatar",  {
      //           uri: data.avatar.uri,
      //           name: data.avatar.fileName || 'photo.jpg',
      //           type: data.avatar.type,
      //         } as any);
      //       }
      //     }
      //     if (data.name) {
      //       formData.append("name", data.name);
      //     }
      //     const config = {
      //       headers: {
      //         "Content-Type": "multipart/form-data",
      //       },
      //     };
      //     await api.patch<AuthResponse>("user/profile", formData, config);
      //     set({ loading: false });
      //   } catch (error: any) {
      //     console.error("updateProfile error:", {error:error?.response?.data ?? error?.message });
      //     set({ error: error?.response?.data?.message || error?.message || "Service unavailable", loading: false });
      //     errorHandler(error);
      //   }
      // },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        pushToken: state.pushToken,
      }),
    }
  )
);
