import { api } from '@/api/axios';
import { generateRandomId } from '@/lib/utils';
import { Message } from '@/types/message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import axios from 'axios';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ChatState {
  chats: Record<string, Message[]>;
  currentUserId: string | null;
  loading: boolean;
  error: string | null;

  setUserId: (userId: string) => void;
  sendMessage: (message: string) => Promise<boolean>;
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

      setUserId: (userId: string) => {
        set({ currentUserId: userId });
      },

      getMessages: () => {
        const { currentUserId, chats } = get();
        return currentUserId && chats[currentUserId] ? chats[currentUserId] : [];
      },

      sendMessage: async (message: string) => {
        const { currentUserId, chats } = get();
        if (!currentUserId) { set({error:'Sign in to start a conversation.'}); return false; }

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
            messages: updatedUserMessages.map(({role,content})=>({role,content})),
          });
          if (!response?.success || !response?.data?.content) throw new Error('Invalid response from the chat service.');

          set({
            loading: false,
            chats: {
              ...get().chats,
              [currentUserId]: [...get().chats[currentUserId], response.data],
            },
          });
          return true;
        } catch (error: any) {
          console.error('sendMessage error:', error);
          const detail = axios.isAxiosError(error)
            ? !error.response ? 'Unable to reach the chat service. Please check your connection and try again.'
              : error.response.status === 401 || error.response.status === 403 ? 'Your chat session is not authorized. Please sign in again.'
              : error.response.status === 404 ? 'The chat service is not configured yet.'
              : error.response.status >= 500 ? 'The chat service is temporarily unavailable.'
              : 'The chat service could not process your message.'
            : 'Unable to get a response. Please try again.';
          set({ loading: false, error: detail });
          return false;
        }
      },

      clearData: () => {
        set({
          chats: {},
          loading: false,
          error: null,
        });
      },
    }),
    {
      name: 'chat-storage-by-user',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({chats:state.chats,currentUserId:state.currentUserId}),
    }
  )
);
