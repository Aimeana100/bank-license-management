import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { SwaggerModule } from '@nestjs/swagger'
import {
  swaggerBuidlerConfig,
  swaggerCustomOptions,
} from './config/swagger.config'
import { join } from 'path'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true })
  const configService = app.get(ConfigService)

  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' })
  app.useGlobalPipes(new ValidationPipe({ transform: true }))

  const document = SwaggerModule.createDocument(app, swaggerBuidlerConfig)
  SwaggerModule.setup('docs', app, document, swaggerCustomOptions)

  await app.listen(configService.get<string>('PORT'))
}
bootstrap()
