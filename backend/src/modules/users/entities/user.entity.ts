import { Exclude } from 'class-transformer'
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum Role {
  APPLICANT = 'APPLICANT',
  REVIEWER = 'REVIEWER',
  APPROVER = 'APPROVER',
  ADMIN = 'ADMIN',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number

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

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updateAt: Date
}
