import { applicationSeeds } from '../data/license-applications'
import { ApplicationSeedContext } from './types'

/** Creates sample applicant applications in DRAFT and SUBMITTED states if absent. */
export async function seedDefaultApplicationsForApplicant(
  context: ApplicationSeedContext,
): Promise<void> {
  const { applicationRepository, applicant, logger } = context

  for (const applicationSeed of applicationSeeds) {
    const existingApplication = await applicationRepository.findOne({
      where: { registrationNumber: applicationSeed.registrationNumber },
    })

    if (existingApplication) {
      // Applicaion already exists
      continue
    }

    await applicationRepository.save(
      applicationRepository.create({
        ...applicationSeed,
        applicant,
      }),
    )
    logger.log(
      `Created application: ${applicationSeed.registrationNumber} (${applicationSeed.applicationStatus})`,
    )
  }
}
