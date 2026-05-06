import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { axiosPrivate } from '../api/api'
import type { User, UserRole } from '../@types/User'

interface AuthData {
  email: string
  password: string
}

interface AuthResponse {
  accessToken: string
  user: User
}

// Mock users for development (remove when backend is ready)
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'fiscal@integracoren.com': {
    password: 'fiscal123',
    user: {
      id: '1',
      name: 'João Silva',
      email: 'fiscal@integracoren.com',
      role: 'FISCAL',
      region: 'Norte',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'rt@integracoren.com': {
    password: 'rt123',
    user: {
      id: '2',
      name: 'Maria Santos',
      email: 'rt@integracoren.com',
      role: 'RT',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'admin@integracoren.com': {
    password: 'admin123',
    user: {
      id: '3',
      name: 'Ana Santos',
      email: 'admin@integracoren.com',
      role: 'ADMIN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
}

// Flag to use mock authentication (set to false when backend is ready)
const USE_MOCK_AUTH = false

export function useAuth() {
  const setUser = useUserStore((state) => state.setUser)
  const logoutUser = useUserStore.getState().logout
  const navigate = useNavigate()

  const getRouteByRole = (role: UserRole): string => {
    switch (role) {
      case 'ADMIN':
        return '/dashboard/admin'
      case 'INSPECTOR':
        return '/dashboard/fiscal'
      case 'RT':
        return '/dashboard/rt'
      default:
        return '/'
    }
  }

  const loginMutation = useMutation({
    mutationFn: async (data: AuthData): Promise<AuthResponse> => {
      if (USE_MOCK_AUTH) {
        // Mock authentication for development
        const mockUser = MOCK_USERS[data.email]
        if (mockUser && mockUser.password === data.password) {
          return {
            accessToken: 'mock-jwt-token-' + Date.now(),
            user: mockUser.user,
          }
        }
        throw { response: { status: 400 } }
      }

      const response = await axiosPrivate.post<AuthResponse>('/sessions', data)
      return response.data
    },
    onSuccess: ({ accessToken, user }) => {
      setUser({ accessToken, user })
      navigate(getRouteByRole(user.role))
    },
  })

  const authenticate = async (
    data: AuthData,
    setError: (name: string, error: { message: string }) => void,
    reset: () => void
  ) => {
    try {
      await loginMutation.mutateAsync(data)
      reset()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (!err.response) {
        setError('root', {
          message: 'Erro ao tentar se conectar com o servidor',
        })
      } else if (err.response.status === 400) {
        setError('root', {
          message: 'E-mail ou senha incorretos',
        })
      } else {
        setError('root', {
          message: 'Erro desconhecido, tente novamente.',
        })
      }
    }
  }

  const logout = async () => {
    try {
      if (!USE_MOCK_AUTH) {
        await axiosPrivate.delete('/sessions')
      }
    } finally {
      logoutUser()
      navigate('/login', { replace: true })
    }
  }

  return {
    authenticate,
    logout,
    isPending: loginMutation.isPending,
    error: loginMutation.error,
    getRouteByRole,
  }
}
