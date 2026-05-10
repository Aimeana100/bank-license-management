import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { SignInDto } from './dto/sign-in.dto'
import { UsersService } from '../users/users.service'
import { SignUpDto } from './dto/sign-up.dto'
import { BcryptService } from './utils/bcrypt.service'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from '../users/entities/user.entity'
import { Repository } from 'typeorm'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly bcryptService: BcryptService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  async signUp(signUpto: SignUpDto) {
    let user = await this.userRepository.findOne({
      where: { email: signUpto.email },
    })
    if (user) {
      throw new ConflictException('User with the same Email already exists')
    }
    const userEntity = this.userRepository.create({
      ...signUpto,
      password: await this.bcryptService.hash(signUpto.password),
    })
    user = await this.userRepository.save(userEntity)

    const { password, ...userPublicData } = user
    return { user: userPublicData }
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.usersService.findByEmail(signInDto.email)

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    if (
      !(await this.bcryptService.compare(signInDto.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid credentials')
    }
    const payload = { id: user.id, role: user.role }
    const { password, ...userPublicData } = user
    return {
      token: await this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<number>('JWT_TOKEN_EXPIRES_IN'),
      }),
      user: userPublicData,
    }
  }
}
