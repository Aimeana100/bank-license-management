import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { CreateApplicationDto } from './dto/create-application.dto'
import { Application, ApplicationStatus } from './entities/applications.entity'
import { REQUEST } from '@nestjs/core/router/request/request-constants'
import { AuthenticatedRequest } from '../auth/interfaces/auth.interfaces'
import { Role, User } from '../users/entities/user.entity'
import {
  DocumentCategory,
  DocumentUpload,
} from './entities/documents-upload.entity'
import { randomUUID, UUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import * as path from 'path'
import { applicationStatusCanTransition } from './utils/application-state-machine'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @Inject(REQUEST) private readonly request: AuthenticatedRequest,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Creates a new application
   * @param createApplicationDto
   * @returns The created application
   */
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

  /**
   * Retrieves all applications
   * For applicants, only their own applications are returned. For reviewers and approvers, all applications are returned.
   * @returns
   */
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

  /**
   * Changes the status of an application, ensuring that the transition is valid according to the defined state machine
   * @param applicationId - ID of the application to update
   * @param newStatus - The new status to set for the application
   * @returns The updated application with the new status
   * @throws NotFoundException if the application does not exist
   * @throws ForbiddenException if the status transition is not allowed
   */
  async changeApplicationStatus(
    applicationId: UUID,
    newStatus: ApplicationStatus,
  ) {
    return this.dataSource.transaction(async (manager) => {
      // Lock the row to prevent concurrent modifications
      const application = await manager.findOne(Application, {
        where: { id: applicationId },
        lock: { mode: 'pessimistic_write' },
      })

      if (!application) {
        throw new NotFoundException('Application not found')
      }

      // Validate transition AFTER locking
      if (
        !applicationStatusCanTransition(
          application.applicationStatus,
          newStatus,
        )
      ) {
        throw new BadRequestException(
          `Cannot change status from ${application.applicationStatus} to ${newStatus}`,
        )
      }

      const actor = await manager.findOne(User, {
        where: { id: this.request.user.id },
      })
      if (!actor) {
        throw new NotFoundException('User not found')
      }

      const previousStatus = application.applicationStatus

      application.applicationStatus = newStatus

      const updatedApplication = await manager.save(application)

       await this.auditService.logTransaction({
        application: updatedApplication,
        actor,
        action: 'APPLICATION_STATUS_CHANGED',
        beforeState: previousStatus,
        afterState: newStatus,
        manager,
      })
  
      return updatedApplication
    })
  }

  /**
   * Uploads and versions a document for an application under a specific category.
   *
   * Rules:
   * - Applicant may only upload documents to their own application
   * - Uploads are only allowed in permitted workflow states
   * - New uploads create a new version for the same document category
   *
   * @param applicationId Application identifier
   * @param categoryCode Document category enum
   * @param file Uploaded multipart file
   * @returns Persisted document metadata
   */
  async uploadDocument(
    applicationId: string,
    categoryCode: DocumentCategory,
    file: any,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(Application, {
        where: { id: applicationId },
        relations: ['applicant'],
        lock: {
          mode: 'pessimistic_write',
        },
      })

      if (!application) {
        throw new NotFoundException('Application not found')
      }

      if (application.applicant.id !== this.request.user.id) {
        throw new ForbiddenException(
          'You can only upload documents for your own application',
        )
      }

      const allowedStates = [
        ApplicationStatus.DRAFT,
        ApplicationStatus.INFO_REQUESTED,
      ]

      if (!allowedStates.includes(application.applicationStatus)) {
        throw new BadRequestException(
          `Document uploads are not allowed when application is in ${application.applicationStatus} state`,
        )
      }

      const latestDocument = await manager.findOne(DocumentUpload, {
        where: {
          application: { id: applicationId },
          documentCategory: categoryCode,
        },
        order: {
          version: 'DESC',
        },
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

      const document = manager.create(DocumentUpload, {
        id: randomUUID(),
        filename: file.originalname,
        version: nextVersion,
        filepath: relativePath,
        mimetype: file.mimetype,
        size: file.size,
        documentCategory: categoryCode,
        application,
      })

      const savedDocument = await manager.save(document)

      return {
        data: savedDocument,
      }
    })
  }
}
