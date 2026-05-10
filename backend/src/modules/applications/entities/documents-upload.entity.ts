import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm'
import { Application } from './applications.entity'

export enum DocumentCategory {
  ARTICLES_OF_INCORPORATION = 'ARTICLES_OF_INCORPORATION',
  CERTIFICATE_OF_REGISTRATION = 'CERTIFICATE_OF_REGISTRATION',
  FINANCIAL_STATEMENTS = 'FINANCIAL_STATEMENTS',
  PROOF_OF_CAPITAL = 'PROOF_OF_CAPITAL',
}

export type SeedDocumentCategory = {
  code: DocumentCategory
  name: string
}

// This entity represents a document uploaded for an application.
// Each document belongs to a specific category (type of document required ) and is associated with one application.
export const seedDocumentCategories: SeedDocumentCategory[] = [
  {
    code: DocumentCategory.ARTICLES_OF_INCORPORATION,
    name: 'Articles of Incorporation',
  },
  {
    code: DocumentCategory.CERTIFICATE_OF_REGISTRATION,
    name: 'Certificate of Registration',
  },
  {
    code: DocumentCategory.FINANCIAL_STATEMENTS,
    name: 'Financial Statements',
  },
  {
    code: DocumentCategory.PROOF_OF_CAPITAL,
    name: 'Proof of Capital',
  },
]

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

  @Column({
    type: 'enum',
    enum: DocumentCategory,
  })
  documentCategory: DocumentCategory

  @ManyToOne(() => Application, (application) => application.documents)
  @JoinColumn()
  application: Application

  @CreateDateColumn()
  createdAt: Date
}
