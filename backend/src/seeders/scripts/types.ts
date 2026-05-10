import { Repository } from 'typeorm'
import { User } from '../../modules/users/entities/user.entity'
import { Application } from '../../modules/applications/entities/applications.entity'
import { DocumentUploadCategory } from '../../modules/applications/entities/documents-categories.entity'

export type SeedLogger = {
  log: (message: string) => void
}

export type UserSeedContext = {
  userRepository: Repository<User>
  logger: SeedLogger
}

export type DocumentCategorySeedContext = {
  categoryRepository: Repository<DocumentUploadCategory>
  logger: SeedLogger
}

export type ApplicationSeedContext = {
  applicationRepository: Repository<Application>
  applicant: User
  logger: SeedLogger
}
