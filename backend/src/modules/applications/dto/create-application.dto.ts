import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator'
import {
  ApplicationStatus,
  InstitutionType,
} from '../entities/applications.entity'

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  institutionName: string

  @IsEnum(InstitutionType)
  @IsNotEmpty()
  institutionType: InstitutionType

  @IsString()
  @IsNotEmpty()
  contactEmail: string

  @IsString()
  businessAddress?: string

  @IsString()
  @IsNotEmpty()
  registrationNumber: string

  @IsNumber()
  @IsNotEmpty()
  proposedCapitalAmount: number

  @IsEnum(ApplicationStatus)
  @IsNotEmpty()
  applicationStatus: ApplicationStatus
}
