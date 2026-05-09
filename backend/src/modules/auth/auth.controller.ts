import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { SignInDto } from './dto/sign-in.dto'
import { SignUpWithPassWordConfirmationDto } from './dto/sign-up.dto'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async signIn(@Body() signInDto: SignInDto) {
    const data = await this.authService.signIn(signInDto)
    return { data, message: 'success' }
  }

  @Post('register')
  signUp(@Body() signUpdDto: SignUpWithPassWordConfirmationDto) {
    const { password, confirmPassword } = signUpdDto

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match')
    }
    return this.authService.signUp(signUpdDto)
  }
}
