import { useRef, useState } from 'react'
import { uploadDocument } from '../../../api/applications.api'
import { getApiError } from '../../../api/axios'
import type { ApplicationDocument } from '../../../types/application'

type CategoryCode =
  | 'ARTICLES_OF_INCORPORATION'
  | 'CERTIFICATE_OF_REGISTRATION'
  | 'FINANCIAL_STATEMENTS'
  | 'PROOF_OF_CAPITAL'

interface UseDocumentUploadResult {
  category: CategoryCode
  setCategory: (c: CategoryCode) => void
  uploading: boolean
  uploadError: string
  uploadSuccess: string
  fileRef: React.RefObject<HTMLInputElement | null>
  handleUpload: (e: React.FormEvent) => Promise<void>
}

export function useDocumentUpload(
  applicationId: string,
  onUploaded: (doc: ApplicationDocument) => void,
): UseDocumentUploadResult {
  const [category, setCategory] = useState<CategoryCode>('ARTICLES_OF_INCORPORATION')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploadError('')
    setUploadSuccess('')
    setUploading(true)
    try {
      const doc = await uploadDocument(applicationId, category, file)
      onUploaded(doc)
      setUploadSuccess(`"${file.name}" uploaded successfully.`)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setUploadError(getApiError(err))
    } finally {
      setUploading(false)
    }
  }

  return { category, setCategory, uploading, uploadError, uploadSuccess, fileRef, handleUpload }
}
