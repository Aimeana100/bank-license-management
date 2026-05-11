import { Injectable } from '@nestjs/common'
import { DataSource, EntityManager } from 'typeorm'
import { AuditLog } from './entities/audit-log.entity'
import { Application } from '../applications/entities/applications.entity'
import { User } from '../users/entities/user.entity'

@Injectable()
export class AuditService {
  constructor(private readonly dataSource: DataSource) {}

  async logTransaction({
    application,
    actor,
    action,
    beforeState,
    afterState,
    manager,
  }: {
    application: Application
    actor: User
    action: string
    beforeState: string
    afterState: string
    manager?: EntityManager
  }): Promise<AuditLog> {
    const auditLogRepository = manager
      ? manager.getRepository(AuditLog)
      : this.dataSource.getRepository(AuditLog)
    const auditLog = auditLogRepository.create({
      application,
      actor,
      action,
      beforeState,
      afterState,
    })
    return auditLogRepository.save(auditLog)
  }

  async findAll(): Promise<AuditLog[]> {
    return this.dataSource.getRepository(AuditLog).find({
      relations: { application: true, actor: true },
      order: { createdAt: 'DESC' },
    })
  }

  async findByApplication(applicationId: string): Promise<AuditLog[]> {
    return this.dataSource.getRepository(AuditLog).find({
      where: { application: { id: applicationId } },
      relations: { actor: true },
      order: { createdAt: 'DESC' },
    })
  }
}
