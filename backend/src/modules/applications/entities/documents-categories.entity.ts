import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity({ name: 'document-categories' })
export class DocumentUploadCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  code: string

  @Column()
  name: string

  @Column({ default: true })
  required: boolean

  @CreateDateColumn()
  createdAt: Date
}
