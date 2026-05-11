import { MaxFileSizeValidator, ParseFilePipe, UploadedFile } from '@nestjs/common'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export const UploadedRequiredFile = () =>
  UploadedFile(
    new ParseFilePipe({
      fileIsRequired: true,
      validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })],
    }),
  )
