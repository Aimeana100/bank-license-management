import { CreateUserDto } from '../../modules/users/dto/create-user.dto'
import { Role } from '../../modules/users/entities/user.entity'

export const seedUsers: CreateUserDto[] = [
  {
    names: 'Default Applicant',
    email: 'applicant@license.test',
    password: 'Password@123',
    role: Role.APPLICANT,
  },
  {
    names: 'Default Reviewer',
    email: 'reviewer@license.test',
    password: 'Password@123',
    role: Role.REVIEWER,
  },
  {
    names: 'Default Approver',
    email: 'approver@license.test',
    password: 'Password@123',
    role: Role.APPROVER,
  },
  {
    names: 'Default Admin',
    email: 'admin@license.test',
    password: 'Password@123',
    role: Role.ADMIN,
  },
]
