import { create } from 'zustand';

interface UserState {
  userId: string;
  email: string;
  profilePath: string;
  nickname: string;
  isLoggedIn: boolean;
  isLoaded: boolean;
}

interface UserAction {
  setUser: (state: Partial<UserState>) => void;
  setIsLoaded: () => void;
}

export const useUserStore = create<UserState & UserAction>((set) => ({
  userId: '',
  email: '',
  profilePath: '',
  nickname: '',
  isLoggedIn: false,
  isLoaded: false,

  setUser: (state) => set({ ...state, isLoggedIn: true, isLoaded: true }),
  setIsLoaded: () => set({ isLoaded: true }),
}));
