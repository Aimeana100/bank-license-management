import { useRef, useState } from 'react'
import { formatDate, formatInstitutionType } from '../../utils/application.util'
import type { ApplicationDocument } from '../../types/application'
import { uploadDocument } from '../../api/applications.api'
import { Button } from '../../components/ui/button'
import { Alert, AlertDescription } from '../../components/ui/alert'

const DOCUMENT_CATEGORIES = [
  { code: 'ARTICLES_OF_INCORPORATION', label: 'Articles of Incorporation' },
  { code: 'CERTIFICATE_OF_REGISTRATION', label: 'Certificate of Registration' },
  { code: 'FINANCIAL_STATEMENTS', label: 'Financial Statements' },
  { code: 'PROOF_OF_CAPITAL', label: 'Proof of Capital' },
] as const

type CategoryCode = (typeof DOCUMENT_CATEGORIES)[number]['code']

interface Props {
  documents: ApplicationDocument[]
  applicationId: string
  canUpload: boolean
  onUploaded: (doc: ApplicationDocument) => void
}

export function ApplicationDocuments({ documents, applicationId, canUpload, onUploaded }: Props) {
  const [category, setCategory] = useState<CategoryCode>('ARTICLES_OF_INCORPORATION')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const byCategory = new Map<string, ApplicationDocument[]>()
  for (const doc of documents) {
    const group = byCategory.get(doc.documentCategory) ?? []
    group.push(doc)
    byCategory.set(doc.documentCategory, group)
  }
  const grouped = Array.from(byCategory.entries()).map(([cat, files]) => ({ cat, files }))

  const handleUpload = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setUploadError(err?.response?.data?.message ?? err?.message ?? 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload form — applicant only, allowed states */}
      {canUpload && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
          <h3 className="mb-3 text-sm font-semibold text-amber-950">Upload Document</h3>
          <form className="space-y-3" onSubmit={handleUpload}>
            <div>
              <label className="mb-1 block text-xs font-medium text-amber-900" htmlFor="doc-category">
                Document category
              </label>
              <select
                className="w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-400"
                id="doc-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryCode)}
              >
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-amber-900" htmlFor="doc-file">
                File
              </label>
              <input
                className="w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm text-amber-950 file:mr-3 file:rounded file:border-0 file:bg-amber-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-amber-950"
                id="doc-file"
                ref={fileRef}
                required
                type="file"
              />
            </div>

            {uploadError && (
              <Alert variant="destructive">
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
            {uploadSuccess && (
              <Alert variant="success">
                <AlertDescription>{uploadSuccess}</AlertDescription>
              </Alert>
            )}

            <Button disabled={uploading} size="sm" type="submit">
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </form>
        </div>
      )}

      {/* Uploaded files list */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-amber-950">Files by category</h3>
        {grouped.length === 0 ? (
          <p className="text-sm text-amber-900/70">No files attached.</p>
        ) : (
          grouped.map(({ cat, files }) => (
            <div className="rounded-lg border border-amber-200 p-3" key={cat}>
              <p className="mb-2 text-sm font-semibold text-amber-950">
                {formatInstitutionType(cat)}
              </p>
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    className="rounded-md border border-amber-100 bg-amber-50/40 px-3 py-2"
                    key={file.id}
                  >
                    <p className="text-sm text-amber-950">{file.filename}</p>
                    <p className="text-xs text-amber-900/70">
                      Version {file.version} | Uploaded {formatDate(file.createdAt)}
                    </p>
                    <a
                      className="text-xs font-semibold text-amber-950 underline"
                      href={`${import.meta.env.VITE_API_BASE_URL}/${file.filepath}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View file
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
