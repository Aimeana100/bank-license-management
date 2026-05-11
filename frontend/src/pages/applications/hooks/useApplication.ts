import { useEffect, useState } from 'react'
import { getApplicationById, transitionApplication } from '../../../api/applications.api'
import { getApiError } from '../../../api/axios'
import type { Application, ApplicationDocument, ApplicationStatus } from '../../../types/application'

interface UseApplicationResult {
  application: Application | null
  loading: boolean
  acting: boolean
  error: string
  success: string
  onAction: (action: ApplicationStatus) => Promise<void>
  onUploaded: (doc: ApplicationDocument) => void
}

export function useApplication(id: string | undefined, userRole: string | undefined): UseApplicationResult {
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!id) return
    let mounted = true
    setLoading(true)
    getApplicationById(id)
      .then((data) => { if (mounted) setApplication(data) })
      .catch(() => { if (mounted) setError('Failed to load application details.') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  async function onAction(action: ApplicationStatus) {
    if (!application || !userRole) return
    setError('')
    setSuccess('')
    setActing(true)
    try {
      const updated = await transitionApplication(application.id, userRole, { applicationStatus: action })
      setApplication(updated)
      setSuccess(`Status updated to ${action.replace(/_/g, ' ')}.`)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setActing(false)
    }
  }

  function onUploaded(doc: ApplicationDocument) {
    setApplication((prev) =>
      prev ? { ...prev, documents: [...(prev.documents ?? []), doc] } : prev,
    )
  }

  return { application, loading, acting, error, success, onAction, onUploaded }
}
