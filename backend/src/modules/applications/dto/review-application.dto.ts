import { IsIn, IsNotEmpty } from 'class-validator'
import { ApplicationStatus } from '../entities/applications.entity'

export class ReviewApplicationDto {
  @IsNotEmpty()
  @IsIn([ApplicationStatus.INFO_REQUESTED, ApplicationStatus.REVIEWED])
  applicationStatus: ApplicationStatus
}
