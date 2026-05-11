import type { User } from './user'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  names: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginData {
  token: string
  user: User
}

export interface ApiMessageResponse<T> {
  data: T
  message: string
}

export interface RegisterResponse {
  user: User
}
