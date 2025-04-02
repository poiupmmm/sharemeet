import { create } from 'zustand';
import { 
  Activity, 
  getActivities, 
  getActivity, 
  getUserActivities, 
  getUserFavorites 
} from '@/lib/activities';

interface ActivityState {
  activities: Activity[];
  currentActivity: Activity | null;
  userActivities: Activity[];
  userFavorites: Activity[];
  isLoading: boolean;
  error: Error | null;
  fetchActivities: (options?: { sort?: 'time' | 'distance' | 'popularity'; search?: string }) => Promise<void>;
  fetchActivity: (id: string) => Promise<void>;
  fetchUserActivities: (userId: string) => Promise<void>;
  fetchUserFavorites: (userId: string) => Promise<void>;
  setCurrentActivity: (activity: Activity | null) => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  currentActivity: null,
  userActivities: [],
  userFavorites: [],
  isLoading: false,
  error: null,
  fetchActivities: async (options) => {
    set({ isLoading: true, error: null });
    try {
      const activities = await getActivities(options);
      set({ activities, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },
  fetchActivity: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const activity = await getActivity(id);
      set({ currentActivity: activity, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },
  fetchUserActivities: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const activities = await getUserActivities(userId);
      set({ userActivities: activities, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },
  fetchUserFavorites: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const activities = await getUserFavorites(userId);
      set({ userFavorites: activities, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },
  setCurrentActivity: (activity) => set({ currentActivity: activity }),
}));