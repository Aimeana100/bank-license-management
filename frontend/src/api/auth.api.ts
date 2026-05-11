import api from './axios'
import type {
  ApiMessageResponse,
  LoginData,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
} from '../types/auth'

export async function login(payload: LoginRequest): Promise<LoginData> {
  const response = await api.post<ApiMessageResponse<LoginData>>(
    '/auth/login',
    payload,
  )
  return response.data.data
}

export async function register(
  payload: RegisterRequest,
): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>('/auth/register', payload)
  return response.data
}
