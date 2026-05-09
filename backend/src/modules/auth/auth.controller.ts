import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { SignInDto } from './dto/sign-in.dto'
import { SignUpWithPassWordConfirmationDto } from './dto/sign-up.dto'
import { AuthService } from './auth.service'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Sign in to the application' })
  @ApiResponse({ status: 200, description: 'Signed in successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('login')
  async signIn(@Body() signInDto: SignInDto) {
    const data = await this.authService.signIn(signInDto)
    return { data, message: 'success' }
  }

  @ApiOperation({ summary: 'Sign up as an applicant' })
  @ApiResponse({ status: 200, description: 'New user created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('register')
  signUp(@Body() signUpdDto: SignUpWithPassWordConfirmationDto) {
    const { password, confirmPassword } = signUpdDto

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match')
    }
    return this.authService.signUp(signUpdDto)
  }
}
