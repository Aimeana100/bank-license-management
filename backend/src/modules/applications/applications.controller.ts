import { FileInterceptor } from '@nestjs/platform-express'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/roles/roles.guard'
import { Role } from '../users/entities/user.entity'
import { Roles } from '../auth/roles/roles.decorator'
import { CreateApplicationDto } from './dto/create-application.dto'
import { ApplicationsService } from './applications.service'
import { DocumentCategory } from './entities/documents-upload.entity'
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger'
import { FileUploadDto } from './dto/applciation-file-upload.dto'
import { UUID } from 'crypto'
import { ReviewApplicationDto } from './dto/review-application.dto'
import { ApproveApplicationDto } from './dto/approve-application.dto'
import { UploadedRequiredFile } from '../../common/decorator/upload-required-file'
import { SubmitApplicationDto } from './dto/resubmit-application.dto'

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @ApiOperation({ summary: 'Create a new application' })
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
  create(@Body() createApplicationDto: CreateApplicationDto) {
    return this.applicationsService.create(createApplicationDto)
  }

  @ApiResponse({ status: 200, description: 'Applications retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiOperation({ summary: 'Retrieve all applications' })
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('/')
  @Roles(Role.APPLICANT, Role.REVIEWER, Role.APPROVER, Role.ADMIN)
  findAll() {
    return this.applicationsService.findAll()
  }

  @ApiResponse({ status: 200, description: 'Application details retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Application not found.' })
  @ApiOperation({ summary: 'Retrieve one application by ID' })
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('/:applicationId')
  @Roles(Role.APPLICANT, Role.REVIEWER, Role.APPROVER, Role.ADMIN)
  findOne(@Param('applicationId', ParseUUIDPipe) applicationId: string) {
    return this.applicationsService.findOne(applicationId)
  }

  @ApiOperation({ summary: 'Upload a document for an application' })
  @ApiResponse({ status: 201, description: 'Document uploaded.' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Patch('/:applicationId/documents/:categoryCode')
  @Roles(Role.APPLICANT)
  @UseInterceptors(FileInterceptor('document'))
  async attachDocument(
    @Param('applicationId') applicationId: string,
    @Param('categoryCode') categoryCode: DocumentCategory,
    @UploadedRequiredFile() document: string,
    @Body() documentDto: FileUploadDto,
  ) {
    return await this.applicationsService.uploadDocument(
      applicationId,
      categoryCode,
      document,
    )
  }

  @ApiResponse({ status: 200, description: 'Application status updated.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiOperation({ summary: 'Submit or resubmit an application' })
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Patch('/:applicationId/submit')
  @Roles(Role.APPLICANT)
  submit(
    @Param('applicationId') applicationId: UUID,
    @Body() dto: SubmitApplicationDto,
  ) {
    return this.applicationsService.changeApplicationStatus(
      applicationId,
      dto.applicationStatus,
    )
  }

  @ApiResponse({ status: 200, description: 'Application status updated.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiOperation({ summary: 'Review an application' })
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Patch('/:applicationId/review')
  @Roles(Role.REVIEWER)
  review(
    @Param('applicationId') applicationId: UUID,
    @Body() reviewApplicationDto: ReviewApplicationDto,
  ) {
    return this.applicationsService.changeApplicationStatus(
      applicationId,
      reviewApplicationDto.applicationStatus,
    )
  }

  @ApiResponse({ status: 200, description: 'Application status updated.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiOperation({ summary: 'Approve or reject an application' })
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Patch('/:applicationId/approve')
  @Roles(Role.APPROVER)
  approve(
    @Param('applicationId', ParseUUIDPipe) applicationId: UUID,
    @Body() approveApplicationDto: ApproveApplicationDto,
  ) {
    return this.applicationsService.changeApplicationStatus(
      applicationId,
      approveApplicationDto.applicationStatus,
    )
  }
}
