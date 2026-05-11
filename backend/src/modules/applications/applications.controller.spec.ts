import { Test, TestingModule } from '@nestjs/testing'
import { ApplicationsController } from './applications.controller'
import { ApplicationsService } from './applications.service'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/roles/roles.guard'

describe('ApplicationsController', () => {
  let controller: ApplicationsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        {
          provide: ApplicationsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            submit: jest.fn(),
            uploadDocument: jest.fn(),
            changeApplicationStatus: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile()

    controller = module.get<ApplicationsController>(ApplicationsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
