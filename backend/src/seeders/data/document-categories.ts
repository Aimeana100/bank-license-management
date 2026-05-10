export type SeedDocumentCategory = {
  code: string
  name: string
  required: boolean
}

export const seedDocumentCategories: SeedDocumentCategory[] = [
  {
    code: 'ARTICLES_OF_INCORPORATION',
    name: 'Articles of Incorporation',
    required: true,
  },
  {
    code: 'CERTIFICATE_OF_REGISTRATION',
    name: 'Certificate of Registration',
    required: true,
  },
  {
    code: 'FINANCIAL_STATEMENTS',
    name: 'Financial Statements',
    required: true,
  },
  {
    code: 'PROOF_OF_CAPITAL',
    name: 'Proof of Capital',
    required: true,
  },
]
