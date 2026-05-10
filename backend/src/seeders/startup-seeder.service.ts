import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User, Role } from '../modules/users/entities/user.entity'
import { Application } from '../modules/applications/entities/applications.entity'
import { seedDefaultUsers } from './scripts/seed-users.script'
import { seedDefaultApplicationsForApplicant } from './scripts/seed-applications.script'

@Injectable()
export class StartupSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupSeederService.name)

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
  ) {}

  /** Runs once at app startup and triggers the seed workflow. */
  async onApplicationBootstrap(): Promise<void> {
    await this.seed()
  }

  /** Seeds all default: users, categories, then license applications. */
  private async seed(): Promise<void> {
    this.logger.log('Running startup seeds...')

    const usersByRole = await seedDefaultUsers({
      userRepository: this.userRepository,
      logger: this.logger,
    })

    const applicant = usersByRole.get(Role.APPLICANT)
    if (!applicant) {
      this.logger.warn(
        'Applicant user not found after user seeding; skipping application seeds',
      )
      return
    }

    await seedDefaultApplicationsForApplicant({
      applicationRepository: this.applicationRepository,
      applicant,
      logger: this.logger,
    })
    this.logger.log('Startup seeds completed')
  }
}
