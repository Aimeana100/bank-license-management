import { formatDate, formatInstitutionType } from '../../utils/application.util'
import type { ApplicationDocument } from '../../types/application'
import { useDocumentUpload } from './hooks/useDocumentUpload'
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

function DocumentFile({ file }: { file: ApplicationDocument }) {
  return (
    <div className="rounded-md border border-amber-100 bg-amber-50/40 px-3 py-2">
      <p className="text-sm font-medium text-amber-950">{file.filename}</p>
      <p className="text-xs text-amber-900/60">
        Version {file.version} · Uploaded {formatDate(file.createdAt)}
      </p>
      <a
        className="text-xs font-semibold text-amber-700 underline hover:text-amber-900"
        href={`${import.meta.env.VITE_API_BASE_URL}/${file.filepath}`}
        rel="noreferrer"
        target="_blank"
      >
        View file
      </a>
    </div>
  )
}

function DocumentGroup({ category, files }: { category: string; files: ApplicationDocument[] }) {
  return (
    <div className="rounded-lg border border-amber-200 p-3">
      <p className="mb-2 text-sm font-semibold text-amber-950">
        {formatInstitutionType(category)}
      </p>
      <div className="space-y-2">
        {files.map((file) => (
          <DocumentFile key={file.id} file={file} />
        ))}
      </div>
    </div>
  )
}

function UploadForm({
  applicationId,
  onUploaded,
}: {
  applicationId: string
  onUploaded: (doc: ApplicationDocument) => void
}) {
  const { category, setCategory, uploading, uploadError, uploadSuccess, fileRef, handleUpload } =
    useDocumentUpload(applicationId, onUploaded)

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
      <h3 className="mb-3 text-sm font-semibold text-amber-950">Upload Document</h3>
      <form className="space-y-3" onSubmit={handleUpload}>
        <div>
          <label className="mb-1 block text-xs font-medium text-amber-900" htmlFor="doc-category">
            Document category
          </label>
          <select
            className="w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-300"
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
  )
}

export function ApplicationDocuments({ documents, applicationId, canUpload, onUploaded }: Props) {
  const grouped = documents.reduce<Map<string, ApplicationDocument[]>>((map, doc) => {
    map.set(doc.documentCategory, [...(map.get(doc.documentCategory) ?? []), doc])
    return map
  }, new Map())

  return (
    <div className="space-y-4">
      {canUpload && <UploadForm applicationId={applicationId} onUploaded={onUploaded} />}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-amber-950">Attached Documents</h3>
        {grouped.size === 0 ? (
          <p className="text-sm text-amber-900/60">No files attached yet.</p>
        ) : (
          Array.from(grouped.entries()).map(([cat, files]) => (
            <DocumentGroup category={cat} files={files} key={cat} />
          ))
        )}
      </div>
    </div>
  )
}
