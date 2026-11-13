import { api } from '@/api/axios';
import { errorHandler, generateRandomId } from '@/lib/utils';
import { Message } from '@/types/message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ChatState {
  chats: Record<string, Message[]>;
  currentUserId: string | null;
  loading: boolean;
  error: string | null;

  setUserId: (userId: string | null) => void;
  sendMessage: (message: string) => Promise<void>;
  clearData: () => void;
  getMessages: () => Message[];
}

interface MessageResponse {
  data: Message;
  success: boolean;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: {},
      currentUserId: null,
      loading: false,
      error: null,

      setUserId: (userId: string | null) => {
        set({ currentUserId: userId });
      },

      getMessages: () => {
        const { currentUserId, chats } = get();
        return currentUserId && chats[currentUserId] ? chats[currentUserId] : [];
      },

      sendMessage: async (message: string) => {
        const { currentUserId, chats } = get();
        if (!currentUserId) {
          set({ error: "Sign in to use Mentor.", loading: false });
          return;
        }

        const chatMessage: Message = {
          id: generateRandomId(),
          role: 'user',
          content: message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const currentMessages = chats[currentUserId] || [];
        const updatedUserMessages = [...currentMessages, chatMessage];

        set({
          loading: true,
          error: null,
          chats: {
            ...chats,
            [currentUserId]: updatedUserMessages,
          },
        });

        try {
          const { data: response } = await api.post<MessageResponse>('/chat', {
            messages: updatedUserMessages,
          });

          set({
            loading: false,
            chats: {
              ...get().chats,
              [currentUserId]: [...get().chats[currentUserId], response.data],
            },
          });
        } catch (error: any) {
          console.error('sendMessage error:', error);
          const errorMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Sorry, there was an error processing your request. Please try again.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          set({
            loading: false,
            error: error instanceof Error ? error.message : "Unable to reach Mentor. Please try again.",
            chats: {
              ...get().chats,
              [currentUserId]: [...get().chats[currentUserId], errorMessage],
            },
          });

          errorHandler(error);
        }
      },

      clearData: () => {
        set({
          chats: {},
          currentUserId: null,
          loading: false,
          error: null,
        });
      },
    }),
    {
      name: 'chat-storage-by-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
