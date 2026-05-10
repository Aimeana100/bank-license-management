import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm'
import { Application } from './applications.entity'
import { User } from '../../users/entities/user.entity'
import { DocumentUploadCategory } from './documents-categories.entity'

@Entity()
export class DocumentUpload {
  @PrimaryColumn('uuid')
  id: string

  @Column()
  filename: string

  @Column()
  version: number

  @Column()
  filepath: string

  @Column()
  mimetype: string

  @Column()
  size: number

  @ManyToOne(() => Application, (application) => application.id)
  application: Application

  @ManyToOne(() => User, (user) => user.id)
  uploadedBy: User

  @ManyToOne(() => DocumentUploadCategory, (category) => category.id)
  documentCategory: DocumentUploadCategory

  createdAt: Date
}
