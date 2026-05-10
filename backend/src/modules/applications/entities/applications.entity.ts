import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'

export enum InstitutionType {
  COMMERCIAL_BANK = 'COMMERCIAL_BANK',
  MICROFINANCE = 'MICROFINANCE',
  INVESTMENT_BANK = 'INVESTMENT_BANK',
  INSURANCE = 'INSURANCE',
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  INFO_REQUESTED = 'INFO_REQUESTED',
  RESUBMITTED = 'RESUBMITTED',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  institutionName: string

  @Column({
    type: 'enum',
    enum: InstitutionType,
  })
  institutionType: InstitutionType

  @Column({ unique: false })
  @Index()
  contactEmail: string

  @Column({ nullable: true, type: 'text' })
  businessAddress?: string

  @Column()
  registrationNumber: string

  @Column({
    type: 'decimal',
  })
  proposedCapitalAmount: number

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  applicationStatus: ApplicationStatus

  //    User who created the application
  @ManyToOne(() => User, (user) => user.submittedApplications, {
    nullable: false,
  })
  @JoinColumn()
  applicant: User

  // responsible reviewer
  @ManyToOne(() => User, (user) => user.reviewApplications, {
    nullable: true,
  })
  @JoinColumn()
  reviewer?: User

  // final approver
  @ManyToOne(() => User, (user) => user.approvedApplications, {
    nullable: true,
  })
  @JoinColumn()
  approver?: User

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
