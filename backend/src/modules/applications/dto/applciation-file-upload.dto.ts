import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class FileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The file attachment to be uploaded',
  })
  @IsNotEmpty({ message: 'File is required' })
  document: string
}
