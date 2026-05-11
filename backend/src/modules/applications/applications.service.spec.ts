import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { ApplicationsService } from './applications.service'
import { Application, ApplicationStatus } from './entities/applications.entity'
import { Role, User } from '../users/entities/user.entity'
import { applicationStatusCanTransition } from './utils/application-state-machine'
import { AuditService } from '../audit/audit.service'

type MockRepo = {
  create: jest.Mock
  save: jest.Mock
  findOne: jest.Mock
  createQueryBuilder: jest.Mock
}

type ManagerMock = {
  findOne: jest.Mock
  save: jest.Mock
}

describe('ApplicationsService', () => {
  let service: ApplicationsService
  let applicationRepository: MockRepo
  let userRepository: MockRepo
  let dataSource: { transaction: jest.Mock }
  let auditService: { logTransaction: jest.Mock }
  let manager: ManagerMock
  let request: { user: { id: string; role: Role } }

  const buildQueryBuilder = () => {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    }
    return queryBuilder
  }

  const primeStatusChangeMocks = ({
    currentStatus,
    actorExists = true,
  }: {
    currentStatus: ApplicationStatus
    actorExists?: boolean
  }) => {
    const application: Application = {
      id: 'app-1',
      applicationStatus: currentStatus,
    } as Application
    const actor: User | null = actorExists
      ? ({ id: 'user-1', role: request.user.role } as User)
      : null

    manager.findOne.mockImplementation(async (entity: any) => {
      if (entity === Application) return application
      if (entity === User) return actor
      return null
    })
    manager.save.mockImplementation(async (entity: any) => entity)
    auditService.logTransaction.mockResolvedValue({ id: 'audit-1' })
  }

  beforeEach(() => {
    request = { user: { id: 'user-1', role: Role.REVIEWER } }
    manager = {
      findOne: jest.fn(),
      save: jest.fn(),
    }

    applicationRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    }

    userRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    }

    dataSource = {
      transaction: jest.fn(async (cb: any) => cb(manager)),
    }

    auditService = {
      logTransaction: jest.fn(),
    }

    service = new ApplicationsService(
      applicationRepository as any,
      request as any,
      userRepository as any,
      dataSource as any,
      auditService as unknown as AuditService,
    )
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('state machine transitions', () => {
    it('accepts valid transitions', () => {
      expect(
        applicationStatusCanTransition(
          ApplicationStatus.DRAFT,
          ApplicationStatus.SUBMITTED,
        ),
      ).toBe(true)
      expect(
        applicationStatusCanTransition(
          ApplicationStatus.SUBMITTED,
          ApplicationStatus.REVIEWED,
        ),
      ).toBe(true)
      expect(
        applicationStatusCanTransition(
          ApplicationStatus.REVIEWED,
          ApplicationStatus.APPROVED,
        ),
      ).toBe(true)
    })

    it('rejects invalid transitions', () => {
      expect(
        applicationStatusCanTransition(
          ApplicationStatus.DRAFT,
          ApplicationStatus.APPROVED,
        ),
      ).toBe(false)
      expect(
        applicationStatusCanTransition(
          ApplicationStatus.SUBMITTED,
          ApplicationStatus.APPROVED,
        ),
      ).toBe(false)
    })

    it('handles edge cases: same-state and terminal states', () => {
      expect(
        applicationStatusCanTransition(
          ApplicationStatus.REVIEWED,
          ApplicationStatus.REVIEWED,
        ),
      ).toBe(false)
      expect(
        applicationStatusCanTransition(
          ApplicationStatus.APPROVED,
          ApplicationStatus.REJECTED,
        ),
      ).toBe(false)
      expect(
        applicationStatusCanTransition(
          ApplicationStatus.REJECTED,
          ApplicationStatus.APPROVED,
        ),
      ).toBe(false)
    })
  })

  describe('authorization logic', () => {
    it('limits APPLICANT scope in findAll (cannot view all records)', async () => {
      request.user.role = Role.APPLICANT
      const queryBuilder = buildQueryBuilder()
      applicationRepository.createQueryBuilder.mockReturnValue(queryBuilder)

      await service.findAll()

      expect(queryBuilder.where).toHaveBeenCalledWith('applicant.id = :userId', {
        userId: request.user.id,
      })
    })

    it.each([
      Role.REVIEWER,
      Role.APPROVER,
      Role.ADMIN,
    ])(
      '%s can query without applicant-only filter in findAll',
      async (role) => {
        request.user.role = role
        const queryBuilder = buildQueryBuilder()
        applicationRepository.createQueryBuilder.mockReturnValue(queryBuilder)

        await service.findAll()

        expect(queryBuilder.where).not.toHaveBeenCalled()
      },
    )

    it.each([
      { role: Role.APPLICANT, targetStatus: ApplicationStatus.REVIEWED },
      { role: Role.REVIEWER, targetStatus: ApplicationStatus.APPROVED },
      { role: Role.APPROVER, targetStatus: ApplicationStatus.REVIEWED },
    ])(
      'forbids unauthorized status changes for $role to $targetStatus',
      async ({ role, targetStatus }) => {
        request.user.role = role

        await expect(
          service.changeApplicationStatus('app-1' as any, targetStatus),
        ).rejects.toBeInstanceOf(ForbiddenException)
        expect(dataSource.transaction).not.toHaveBeenCalled()
      },
    )
  })

  describe('changeApplicationStatus', () => {
    it('updates status and writes an audit log for a valid transition', async () => {
      request.user.role = Role.REVIEWER
      primeStatusChangeMocks({ currentStatus: ApplicationStatus.SUBMITTED })

      const result = await service.changeApplicationStatus(
        'app-1' as any,
        ApplicationStatus.REVIEWED,
      )

      expect(dataSource.transaction).toHaveBeenCalledTimes(1)
      expect(manager.findOne).toHaveBeenCalledWith(Application, {
        where: { id: 'app-1' },
        lock: { mode: 'pessimistic_write' },
      })
      expect(manager.save).toHaveBeenCalled()
      expect(auditService.logTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'APPLICATION_STATUS_CHANGED',
          beforeState: ApplicationStatus.SUBMITTED,
          afterState: ApplicationStatus.REVIEWED,
          manager,
        }),
      )
      expect((result as Application).applicationStatus).toBe(
        ApplicationStatus.REVIEWED,
      )
    })

    it('throws BadRequestException on invalid state transition', async () => {
      request.user.role = Role.APPROVER
      primeStatusChangeMocks({ currentStatus: ApplicationStatus.DRAFT })

      await expect(
        service.changeApplicationStatus('app-1' as any, ApplicationStatus.APPROVED),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(manager.save).not.toHaveBeenCalled()
      expect(auditService.logTransaction).not.toHaveBeenCalled()
    })

    it('throws NotFoundException when application does not exist', async () => {
      request.user.role = Role.REVIEWER
      manager.findOne.mockResolvedValueOnce(null)

      await expect(
        service.changeApplicationStatus('missing' as any, ApplicationStatus.REVIEWED),
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('throws NotFoundException when actor does not exist', async () => {
      request.user.role = Role.REVIEWER
      primeStatusChangeMocks({
        currentStatus: ApplicationStatus.SUBMITTED,
        actorExists: false,
      })

      await expect(
        service.changeApplicationStatus('app-1' as any, ApplicationStatus.REVIEWED),
      ).rejects.toBeInstanceOf(NotFoundException)
      expect(auditService.logTransaction).not.toHaveBeenCalled()
    })

    it('handles concurrent access by locking row and re-validating transition inside transaction', async () => {
      request.user.role = Role.APPROVER
      // Simulates another transaction updating state before this lock is acquired.
      primeStatusChangeMocks({ currentStatus: ApplicationStatus.REJECTED })

      await expect(
        service.changeApplicationStatus('app-1' as any, ApplicationStatus.APPROVED),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(manager.findOne).toHaveBeenCalledWith(Application, {
        where: { id: 'app-1' },
        lock: { mode: 'pessimistic_write' },
      })
      expect(manager.save).not.toHaveBeenCalled()
      expect(auditService.logTransaction).not.toHaveBeenCalled()
    })
  })
})
