import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface UIState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  activeTab: string;
  isLoading: boolean;
  loadingMessage: string;
  notifications: Notification[];

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveTab: (tab: string) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
}

export const useUIStore = create<UIState>()(
  immer((set, get) => ({
    // Initial state
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
    sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
    activeTab: 'extract',
    isLoading: false,
    loadingMessage: '',
    notifications: [],

    // Actions
    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
        localStorage.setItem('theme', theme);
      }),

    toggleTheme: () =>
      set((state) => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', state.theme);
      }),

    toggleSidebar: () =>
      set((state) => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        localStorage.setItem('sidebarCollapsed', String(state.sidebarCollapsed));
      }),

    setSidebarCollapsed: (collapsed) =>
      set((state) => {
        state.sidebarCollapsed = collapsed;
        localStorage.setItem('sidebarCollapsed', String(collapsed));
      }),

    setActiveTab: (tab) =>
      set((state) => {
        state.activeTab = tab;
      }),

    setLoading: (isLoading, message = '') =>
      set((state) => {
        state.isLoading = isLoading;
        state.loadingMessage = message;
      }),

    addNotification: (notification) =>
      set((state) => {
        const id = Math.random().toString(36).substring(2, 9);
        state.notifications.push({ ...notification, id });

        // Auto remove after duration
        if (notification.duration !== 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration || 3000);
        }
      }),

    removeNotification: (id) =>
      set((state) => {
        state.notifications = state.notifications.filter((n) => n.id !== id);
      }),

    clearNotifications: () =>
      set((state) => {
        state.notifications = [];
      }),
  }))
);
