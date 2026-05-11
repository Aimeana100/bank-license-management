import { IsIn, IsNotEmpty } from 'class-validator'
import { ApplicationStatus } from '../entities/applications.entity'

export class ResubmitApplicationDto {
  @IsNotEmpty()
  @IsIn([ApplicationStatus.RESUBMITTED])
  applicationStatus: ApplicationStatus
}
