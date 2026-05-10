import { ParseFilePipe, UploadedFile } from '@nestjs/common'

export const UploadedRequiredFile = () =>
  UploadedFile(
    new ParseFilePipe({
      fileIsRequired: true,
    }),
  )
