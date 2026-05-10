import { Application } from '../../applications/entities/applications.entity'
import { Exclude } from 'class-transformer'
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum Role {
  APPLICANT = 'APPLICANT',
  REVIEWER = 'REVIEWER',
  APPROVER = 'APPROVER',
  ADMIN = 'ADMIN',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  names: string

  @Column({
    default: Role.APPLICANT,
  })
  role: Role

  @Column({
    default: true,
  })
  isActive: boolean

  @Column({ unique: true })
  email: string

  @Column()
  @Exclude()
  password: string

  // Applications created by applicant
  @OneToMany(() => Application, (application) => application.applicant)
  submittedApplications: Application[]

  // Applications assigned for review
  @OneToMany(() => Application, (application) => application.reviewer)
  reviewApplications: Application[]

  // Applications approved/rejected
  @OneToMany(() => Application, (application) => application.approver)
  approvedApplications: Application[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updateAt: Date
}
