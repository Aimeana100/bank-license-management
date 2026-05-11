import { Module } from '@nestjs/common'
import { ApplicationsController } from './applications.controller'
import { ApplicationsService } from './applications.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Application } from './entities/applications.entity'
import { User } from '../users/entities/user.entity'
import { JwtService } from '@nestjs/jwt'
import { DocumentUpload } from './entities/documents-upload.entity'
import { AuditModule } from '../audit/audit.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, User, DocumentUpload]),
    AuditModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, JwtService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
