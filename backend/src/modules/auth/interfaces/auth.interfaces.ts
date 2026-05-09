// a custom request interface that extends the Express.Request interface
export interface AuthenticatedRequest extends Request {
  user: AuthPayload
}

export interface AuthPayload {
  id: string
  email: string
  role: string
}
