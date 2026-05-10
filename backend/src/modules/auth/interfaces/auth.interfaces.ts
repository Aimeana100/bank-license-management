import { Request } from 'express'
import { Role } from '../../users/entities/user.entity'

// a custom request interface that extends the Express.Request interface
export interface AuthenticatedRequest extends Request {
  user: AuthPayload
}

export interface AuthPayload {
  id: string
  role: Role
}
