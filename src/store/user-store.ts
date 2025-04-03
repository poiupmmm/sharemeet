import { create } from 'zustand';
import { User, getCurrentUser } from '@/lib/auth';

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  fetchUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await getCurrentUser();
      set({ user, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));