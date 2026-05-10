import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../modules/users/entities/user.entity'
import { Application } from '../modules/applications/entities/applications.entity'
import { StartupSeederService } from './startup-seeder.service'

@Module({
  imports: [TypeOrmModule.forFeature([User, Application])],
  providers: [StartupSeederService],
})
export class SeedersModule {}
