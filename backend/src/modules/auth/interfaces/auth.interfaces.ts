// a custom request interface that extends the Express.Request interface
export interface AuthenticatedRequest extends Request {
  user: AuthPayload
}

export interface AuthPayload {
  id: number
  email: string
  role: string
}
