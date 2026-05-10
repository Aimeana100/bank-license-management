import {
  ApplicationStatus,
  InstitutionType,
} from '../../modules/applications/entities/applications.entity'
import { CreateApplicationDto } from '../../modules/applications/dto/create-application.dto'

export const applicationSeeds: CreateApplicationDto[] = [
  {
    registrationNumber: 'NBR-DRAFT-001',
    institutionName: 'Default Draft Institution',
    institutionType: InstitutionType.COMMERCIAL_BANK,
    contactEmail: 'draft@license.test',
    businessAddress: 'KG 11 Ave, Kigali',
    proposedCapitalAmount: 2500000,
    applicationStatus: ApplicationStatus.DRAFT,
  },
  {
    registrationNumber: 'NBR-SUBMITTED-001',
    institutionName: 'Default Submitted Institution',
    institutionType: InstitutionType.MICROFINANCE,
    contactEmail: 'submitted@license.test',
    businessAddress: 'KN 4 Ave, Kigali',
    proposedCapitalAmount: 1500000,
    applicationStatus: ApplicationStatus.SUBMITTED,
  },
]
