import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { RedisCacheModule } from '@infra/cache/redis/cache';
import { RedisChannelModule } from '@infra/channel/redis/channel';


@Module({
  imports: [
    ConfigModule.forRoot({}),

    // infra 모듈
    RedisCacheModule,
    RedisChannelModule,

    // 추가 모듈
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
