import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // 기본 설정
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const env = config.get<string>("NODE_ENV", "deployment");

  // 개발 환경일때만 허용하도록 한다. -> 실제 배포에서는 cors 정책이 필요하지는 않다. 
  if ( env !== "production" ) {
    // cors 설정
    const origin : Array<string> = config
    .get<string>("NODE_ALLOWED_ORIGIN", "http://localhost:3000")
    .split(",")
    .map(host => host.trim());

    const methods : Array<string> = config
    .get<string>("NODE_ALLOWED_METHODS" ,"GET,POST")
    .split(",")
    .map(method => method.trim());

    const allowedHeaders : Array<string> = config
    .get<string>("NODE_ALLOWED_HEADERS", "Content-Type, Accept, Authorization")
    .split(",")
    .map(header => header.trim());

    const credentials : boolean = config
    .get<string>("NODE_ALLOWED_CREDENTIALS", "false").trim() === "true"

    app.enableCors({
      origin, methods, allowedHeaders, credentials
    });
  }

  // port, host 설정
  const port: number = config.get<number>('NODE_PORT', 8080);
  const host: string = config.get<string>('NODE_HOST', 'localhost');

  // 종료 훅을 반드시 호출해 달라는 함수이다.
  app.enableShutdownHooks();

  await app.listen(port, host);
}
bootstrap();
