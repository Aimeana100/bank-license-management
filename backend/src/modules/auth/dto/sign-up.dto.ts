import { IsEmail, IsString, MinLength } from 'class-validator'

export class SignUpDto {
  @IsString()
  names: string

  @IsString()
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string
}

export class SignUpWithPassWordConfirmationDto extends SignUpDto {
  @IsString()
  confirmPassword: string
}
