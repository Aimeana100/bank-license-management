import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateApplicationDto } from './dto/create-application.dto'
import { Application } from './entities/applications.entity'
import { REQUEST } from '@nestjs/core/router/request/request-constants'
import { AuthenticatedRequest } from '../auth/interfaces/auth.interfaces'
import { Role, User } from '../users/entities/user.entity'
import {
  DocumentCategory,
  DocumentUpload,
} from './entities/documents-upload.entity'
import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import * as path from 'path'

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @Inject(REQUEST) private readonly request: AuthenticatedRequest,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(DocumentUpload)
    private readonly documentUploadRepository: Repository<DocumentUpload>,
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

  async findAll() {
    const queryBuilder = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.applicant', 'applicant')
      .leftJoinAndSelect('application.reviewer', 'reviewer')
      .leftJoinAndSelect('application.approver', 'approver')
      .leftJoinAndSelect('application.documents', 'documents')
      .orderBy('application.createdAt', 'DESC')
      .addOrderBy('documents.createdAt', 'DESC')

    // for applicants, only show their own applications
    if (this.request.user.role === Role.APPLICANT) {
      queryBuilder.where('applicant.id = :userId', {
        userId: this.request.user.id,
      })
    }

    const [data, total] = await queryBuilder.getManyAndCount()

    return {
      data,
      meta: {
        total,
      },
    }
  }

  async uploadDocument(
    applicationId: string,
    categoryCode: DocumentCategory,
    file: any,
  ) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['applicant'],
    })

    if (!application) {
      throw new NotFoundException('Application not found')
    }

    if (application.applicant.id !== this.request.user.id) {
      throw new ForbiddenException(
        'You can only upload documents for your own application',
      )
    }

    const latestDocument = await this.documentUploadRepository.findOne({
      where: {
        application: { id: applicationId },
        documentCategory: categoryCode,
      },
      relations: ['application'],
      order: { version: 'DESC' },
    })

    const nextVersion = (latestDocument?.version ?? 0) + 1
    const safeFilename = file.originalname.replace(/[^\w.-]/g, '_')
    const relativePath = path
      .join(
        'uploads',
        'applications',
        application.institutionName.replace(/[^\w.-]/g, '_'),
        categoryCode,
        `v${nextVersion}`,
        safeFilename,
      )
      .replace(/\\/g, '/')
    const fullPath = path.join(process.cwd(), relativePath)

    await mkdir(path.dirname(fullPath), { recursive: true })
    await writeFile(fullPath, file.buffer)

    const document = this.documentUploadRepository.create({
      id: randomUUID(),
      filename: file.originalname,
      version: nextVersion,
      filepath: relativePath,
      mimetype: file.mimetype,
      size: file.size,
      documentCategory: categoryCode,
      application,
    })

    return {data: await this.documentUploadRepository.save(document)} 
  }
}
