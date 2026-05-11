import api from './axios'
import type {
  Application,
  CreateApplicationRequest,
  TransitionApplicationRequest,
} from '../types/application'

type ApiResponse<T> = {
  data: T
  message?: string
}

function unwrap<T>(payload: T | ApiResponse<T>): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as ApiResponse<T>).data
  }
  return payload as T
}

export async function listApplications(): Promise<Application[]> {
  const response = await api.get<Application[] | ApiResponse<Application[]>>(
    '/applications',
  )
  return unwrap(response.data)
}

export async function getApplicationById(id: string): Promise<Application> {
  const response = await api.get<Application | ApiResponse<Application>>(
    `/applications/${id}`,
  )
  return unwrap(response.data)
}

export async function createApplication(
  payload: CreateApplicationRequest,
): Promise<Application> {
  const response = await api.post<Application | ApiResponse<Application>>(
    '/applications',
    payload,
  )
  return unwrap(response.data)
}

export async function transitionApplication(
  id: string,
  payload: TransitionApplicationRequest,
): Promise<Application> {
  const response = await api.patch<Application | ApiResponse<Application>>(
    `/applications/${id}/submit`,
    payload,
  )
  return unwrap(response.data)
}
