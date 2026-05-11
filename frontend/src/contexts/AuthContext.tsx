import { type ReactNode, useMemo, useState } from 'react'
import { AUTH_TOKEN_STORAGE_KEY } from '../api/axios'
import { login as loginApi, register as registerApi } from '../api/auth.api'
import type { LoginRequest, RegisterRequest } from '../types/auth'
import type { User } from '../types/user'
import { AuthContext } from './auth.context'

const AUTH_USER_STORAGE_KEY = 'nbr_auth_user'

function readInitialAuthState(): { user: User | null; token: string | null } {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  const savedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY)
  const user = savedUser ? (JSON.parse(savedUser) as User) : null

  if (!token || !user) {
    return { user: null, token: null }
  }

  return { user, token }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = readInitialAuthState()
  const [user, setUser] = useState<User | null>(initial.user)
  const [token, setToken] = useState<string | null>(initial.token)

  const login = async (payload: LoginRequest) => {
    const result = await loginApi(payload)
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, result.token)
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(result.user))
    setToken(result.token)
    setUser(result.user)
  }

  const register = async (payload: RegisterRequest) => {
    await registerApi(payload)
  }

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
