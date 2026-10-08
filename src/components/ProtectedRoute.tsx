import { Navigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import type { UserRole } from '../@types/User'

interface ProtectedRouteProps {
  children?: React.ReactNode
  allowedRoles?: UserRole[]
  ignorePasswordChange?: boolean
}

export const ProtectedRoute = ({ children, allowedRoles, ignorePasswordChange = false }: ProtectedRouteProps) => {
  const accessToken = useUserStore((state) => state.accessToken)
  const user = useUserStore((state) => state.user)

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  // Force password change if required, unless we are already on the change password page
  if (user?.mustChangePassword && !ignorePasswordChange) {
    return <Navigate to="/change-password" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to the user's appropriate dashboard if they don't have access
    switch (user.role) {
      case 'ADMIN':
        return <Navigate to="/dashboard/admin" replace />
      case 'INSPECTOR':
        return <Navigate to="/dashboard/fiscal" replace />
      case 'RT':
        return <Navigate to="/dashboard/rt" replace />
      case 'LEGAL_REPRESENTATIVE':
        return <Navigate to="/rt/history" replace />
      default:
        return <Navigate to="/login" replace />
    }
  }

  return <>{children}</>
}
