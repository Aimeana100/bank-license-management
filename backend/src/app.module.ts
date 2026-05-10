import { Module } from '@nestjs/common'
import { AppService } from './app.service'
import { UsersModule } from './modules/users/users.module'
import { ConfigModule } from '@nestjs/config'
import { validate } from './config/env.validation'
import { TypeOrmModule } from '@nestjs/typeorm'
import { typeOrmConfigAsync } from './config/typeorm'
import { AuthModule } from './modules/auth/auth.module'
import { ApplicationsModule } from './modules/applications/applications.module'
import { SeedersModule } from './seeders/seeders.module'
import { DocumentsService } from './modules/applications/documents.service'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),
    UsersModule,
    AuthModule,
    ApplicationsModule,
    SeedersModule,
  ],
  providers: [AppService, DocumentsService],
})
export class AppModule {}
