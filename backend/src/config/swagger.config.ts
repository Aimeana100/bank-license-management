import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger'

export const swaggerBuidlerConfig = new DocumentBuilder()
  .setTitle('License application and approval system')
  .setDescription('The  REST API Documentation, for the main endpoints')
  .setVersion('1.0')
  .addBearerAuth()
  .build()

export const swaggerCustomOptions: SwaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    defaultModelsExpandDepth: -1,
    initOAuth: {
      clientId: 'id',
      usePkceWithAuthorizationCodeGrant: true,
    },
  },
}
