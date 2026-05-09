import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UsersModule } from './modules/users/users.module'
import { ConfigModule } from '@nestjs/config'
import { validate } from './config/env.validation'
import { TypeOrmModule } from '@nestjs/typeorm'
import { typeOrmConfigAsync } from './config/typeorm'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
