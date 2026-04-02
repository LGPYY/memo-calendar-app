import { create } from 'zustand';
import type { ViewMode } from '../types';

interface AppStore {
  currentView: ViewMode;
  selectedDate: Date;
  sidebarOpen: boolean;
  googleAccessToken: string | null;
  isOnline: boolean;
  setCurrentView: (view: ViewMode) => void;
  setSelectedDate: (date: Date) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setGoogleAccessToken: (token: string | null) => void;
  setIsOnline: (online: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentView: 'month',
  selectedDate: new Date(),
  sidebarOpen: true,
  googleAccessToken: null,
  isOnline: navigator.onLine,
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setGoogleAccessToken: (token) => set({ googleAccessToken: token }),
  setIsOnline: (online) => set({ isOnline: online }),
}));
