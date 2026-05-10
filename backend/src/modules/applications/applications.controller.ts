import { FileInterceptor } from '@nestjs/platform-express'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/roles/roles.guard'
import { Role } from '../users/entities/user.entity'
import { Roles } from '../auth/roles/roles.decorator'
import { CreateApplicationDto } from './dto/create-application.dto'
import { ApplicationsService } from './applications.service'
import { DocumentCategory } from './entities/documents-upload.entity'
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger'
import { FileUploadDto } from './dto/file-upload.dto'


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

  @ApiOperation({ summary: 'Upload a document for an application' })
  @ApiResponse({ status: 201, description: 'Document uploaded.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post('/:id/documents/:categoryCode')
  @Roles(Role.APPLICANT)
  @UseInterceptors(FileInterceptor('document'))
  async uploadDocument(
    @Param('id') applicationId: string,
    @Param('categoryCode') categoryCode: DocumentCategory,
    @UploadedFile() document: any,
    @Body() documentDto: FileUploadDto,
  ) {
    if (!document) {
      throw new BadRequestException('File is required')
    }

    return  await this.applicationsService.uploadDocument(
      applicationId,
      categoryCode,
      document,
    )
  }
}
