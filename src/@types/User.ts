export type UserRole = 'ADMIN' | 'INSPECTOR' | 'RT' | 'LEGAL_REPRESENTATIVE'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  inspectorPublicId?: string
  region?: string
  phone?: string
  mustChangePassword?: boolean
  created_at: string
  updated_at: string
}
