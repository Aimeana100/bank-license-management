import { IsIn, IsNotEmpty } from 'class-validator'
import { ApplicationStatus } from '../entities/applications.entity'

export class ApproveApplicationDto {
  @IsNotEmpty()
  @IsIn([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED])
  applicationStatus: ApplicationStatus
}
