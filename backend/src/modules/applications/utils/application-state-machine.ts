import { ApplicationStatus } from '../entities/applications.entity'

const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  DRAFT: [ApplicationStatus.SUBMITTED],

  SUBMITTED: [ApplicationStatus.INFO_REQUESTED, ApplicationStatus.REVIEWED],

  INFO_REQUESTED: [ApplicationStatus.RESUBMITTED],

  RESUBMITTED: [ApplicationStatus.INFO_REQUESTED, ApplicationStatus.REVIEWED],

  REVIEWED: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED],

  APPROVED: [],
  REJECTED: [],
}

export function applicationStatusCanTransition(
  current: ApplicationStatus,
  next: ApplicationStatus,
): boolean {
  return allowedTransitions[current].includes(next)
}
