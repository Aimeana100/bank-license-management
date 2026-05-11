import { IsIn, IsNotEmpty } from 'class-validator'
import { ApplicationStatus } from '../entities/applications.entity'

export class SubmitApplicationDto {
  @IsNotEmpty()
  @IsIn([ApplicationStatus.SUBMITTED, ApplicationStatus.RESUBMITTED])
  applicationStatus: ApplicationStatus
}
