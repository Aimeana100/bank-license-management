import { hash } from 'bcrypt'
import { seedUsers } from '../data/users'
import { Role, User } from '../../modules/users/entities/user.entity'
import { UserSeedContext } from './types'

/** Creates one default user per role if missing and returns users indexed by role. */
export async function seedDefaultUsers(
  context: UserSeedContext,
): Promise<Map<Role, User>> {
  const { userRepository, logger } = context
  const usersByRole = new Map<Role, User>()

  for (const userSeed of seedUsers) {
    const existingUser = await userRepository.findOne({
      where: { email: userSeed.email },
    })

    if (existingUser) {
      usersByRole.set(existingUser.role, existingUser)
      logger.log(`User already exists: ${existingUser.email}`)
      continue
    }

    const createdUser = await userRepository.save(
      userRepository.create({
        names: userSeed.names,
        email: userSeed.email,
        role: userSeed.role,
        password: await hash(userSeed.password, 10),
      }),
    )

    usersByRole.set(createdUser.role, createdUser)
    logger.log(`Created user: ${createdUser.email}`)
  }

  if (!usersByRole.has(Role.APPLICANT)) {
    const applicant = await userRepository.findOne({
      where: { role: Role.APPLICANT },
    })
    if (applicant) {
      usersByRole.set(Role.APPLICANT, applicant)
    }
  }

  return usersByRole
}
