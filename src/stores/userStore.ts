import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../@types/User'

interface UserStore {
  accessToken: string | null
  user: User | null
  setUser: (data: Partial<UserStore>) => void
  updateUser: (partialUser: Partial<User>) => void
  logout: () => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setUser: (data: Partial<UserStore>) =>
        set((state) => ({
          ...state,
          ...data,
        })),
      updateUser: (partialUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partialUser } : null,
        })),
      logout: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'integracoren-user',
    }
  )
)
