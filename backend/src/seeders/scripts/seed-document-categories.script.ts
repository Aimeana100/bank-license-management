import { seedDocumentCategories } from '../data/document-categories'
import { DocumentCategorySeedContext } from './types'

/** Creates default document categories when they do not already exist. */
export async function seedDefaultDocumentCategories(
  context: DocumentCategorySeedContext,
): Promise<void> {
  const { categoryRepository, logger } = context

  for (const categorySeed of seedDocumentCategories) {
    const existingCategory = await categoryRepository.findOne({
      where: { code: categorySeed.code },
    })

    if (existingCategory) {
      logger.log(`Category already exists: ${existingCategory.code}`)
      continue
    }

    await categoryRepository.save(categoryRepository.create(categorySeed))
    logger.log(`Created category: ${categorySeed.code}`)
  }
}
