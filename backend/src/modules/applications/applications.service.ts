import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateApplicationDto } from './dto/create-application.dto'
import { Application } from './entities/applications.entity'
import { REQUEST } from '@nestjs/core/router/request/request-constants'
import { AuthenticatedRequest } from '../auth/interfaces/auth.interfaces'
import { User } from '../users/entities/user.entity'

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @Inject(REQUEST) private readonly request: AuthenticatedRequest,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async create(
    createApplicationDto: CreateApplicationDto,
  ): Promise<Application> {
    const applicant = await this.userRepository.findOne({
      where: { id: this.request.user.id },
    })
    const application = this.applicationRepository.create({
      ...createApplicationDto,
      applicant,
    })
    return this.applicationRepository.save(application)
  }
}
