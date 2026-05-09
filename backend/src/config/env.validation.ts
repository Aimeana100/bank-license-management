import { plainToInstance } from 'class-transformer'
import { IsNotEmpty, IsString, validateSync } from 'class-validator'

class EnvironmentVariables {
  @IsNotEmpty()
  @IsString()
  DB_HOST: string

  @IsNotEmpty()
  @IsString()
  DB_PORT: string

  @IsNotEmpty()
  @IsString()
  DB_USERNAME: string

  @IsNotEmpty()
  @IsString()
  DB_PASSWORD: string

  @IsNotEmpty()
  @IsString()
  DB_NAME: string

  @IsNotEmpty()
  @IsString()
  PORT: string

  @IsNotEmpty()
  @IsString()
  JWT_SECRET: string

  @IsNotEmpty()
  @IsString()
  JWT_TOKEN_EXPIRES_IN: string
}

export function validate(config: Record<string, unknown>) {
  const validateCOnfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  })
  const errors = validateSync(validateCOnfig, {
    skipMissingProperties: false,
  })

  if (errors.length > 0) {
    throw new Error(errors.toString())
  }

  return validateCOnfig
}
