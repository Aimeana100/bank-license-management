import { createContext } from 'react'
import type { LoginRequest, RegisterRequest } from '../types/auth'
import type { User } from '../types/user'

export type AuthContextType = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
