import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { SwaggerModule } from '@nestjs/swagger'
import {
  swaggerBuidlerConfig,
  swaggerCustomOptions,
} from './config/swagger.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true })
  const configService = app.get(ConfigService)

  const document = SwaggerModule.createDocument(app, swaggerBuidlerConfig)
  SwaggerModule.setup('docs', app, document, swaggerCustomOptions)

  await app.listen(configService.get<string>('PORT'))
}
bootstrap()
