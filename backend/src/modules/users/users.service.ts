import { ConflictException, Inject, Injectable } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { BcryptService } from '../auth/utils/bcrypt.service'
import { User } from './entities/user.entity'
import { Repository } from 'typeorm'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @Inject(BcryptService) private bcyService: BcryptService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    let user = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    })

    if (user) {
      throw new ConflictException('Email already exists')
    }
    const hashedPassword = await this.bcyService.hash(createUserDto.password)
    const userEntity = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    })
    user = await this.userRepository.save(userEntity)
    return user
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } })
  }
}
