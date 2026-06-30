// Doit rester le tout premier import : Sentry s'initialise avant le reste (ADR-0011).
import './instrument';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import type { Env } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // nestjs-pino comme logger applicatif (logs JSON + correlation_id).
  app.useLogger(app.get(Logger));

  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.use(helmet());

  // CORS explicite via env, jamais '*' en prod (rules/07-security.md).
  // CORS_ORIGIN='*' (dev local uniquement) → reflète l'origine de la requête :
  // équivalent "tout autorisé" mais COMPATIBLE avec credentials (un vrai '*'
  // littéral est rejeté par les navigateurs dès que credentials: true).
  const corsConfig = config.get('CORS_ORIGIN', { infer: true });
  const corsOrigins =
    corsConfig.trim() === '*'
      ? true
      : corsConfig.split(',').map((origin) => origin.trim());
  app.enableCors({ origin: corsOrigins, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // /health et /ready restent à la racine ; le reste est sous /api/v1.
  app.setGlobalPrefix('api', { exclude: ['health', 'ready'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FutureKawa — backend-pays')
    .setDescription(
      'API REST locale du backend pays (lots, mesures, alertes). Erreurs au format RFC 7807.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(config.get('PORT'));
}

void bootstrap();
