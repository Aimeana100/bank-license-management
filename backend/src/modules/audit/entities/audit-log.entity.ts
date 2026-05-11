import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Application } from '../../applications/entities/applications.entity'

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Application, { nullable: false })
  application: Application

  @ManyToOne(() => User, { eager: true, nullable: false })
  actor: User

  @Column()
  action: string

  @Column()
  beforeState: string

  @Column()
  afterState: string

  @CreateDateColumn()
  createdAt: Date
}
