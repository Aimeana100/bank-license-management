import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/roles/roles.guard'
import { Role } from '../users/entities/user.entity'
import { Roles } from '../auth/roles/roles.decorator'
import { CreateApplicationDto } from './dto/create-application.dto'
import { ApplicationsService } from './applications.service'
import { AuthenticatedRequest } from '../auth/interfaces/auth.interfaces'

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @ApiResponse({
    status: 201,
    description: 'The application has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post('/')
  @Roles(Role.APPLICANT)
  create(
    @Body() createApplicationDto: CreateApplicationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.applicationsService.create(createApplicationDto)
  }
}
