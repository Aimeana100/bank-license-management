import { useMemo } from 'react'
import { formatDate, formatInstitutionType } from '../../utils/application.util'
import type { ApplicationDocument } from '../../types/application'

interface Props {
  documents: ApplicationDocument[]
}

export function ApplicationDocuments({ documents }: Props) {
  const byCategory = useMemo(() => {
    const map = new Map<string, ApplicationDocument[]>()
    for (const doc of documents) {
      const group = map.get(doc.documentCategory) ?? []
      group.push(doc)
      map.set(doc.documentCategory, group)
    }
    return Array.from(map.entries()).map(([category, files]) => ({ category, files }))
  }, [documents])

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-amber-950">Files by category</h3>
      {byCategory.length === 0 ? (
        <p className="text-sm text-amber-900/70">No files attached.</p>
      ) : (
        byCategory.map(({ category, files }) => (
          <div className="rounded-lg border border-amber-200 p-3" key={category}>
            <p className="mb-2 text-sm font-semibold text-amber-950">
              {formatInstitutionType(category)}
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
                    href={`/${file.filepath}`}
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
  )
}
