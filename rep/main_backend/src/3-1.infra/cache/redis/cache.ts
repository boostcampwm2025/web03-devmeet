import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import {
  DeleteUserDataToRedis,
  InsertUserSessionDataToRedis,
} from './user/user.outbound';
import { REDIS_SERVER } from '../cache.constants';
import { SelectHsetDataFromRedis } from './user/user.inbound';
import { DeleteRoomDatasToRedis, InsertRoomDatasToRedis, InsertRoomDataToRedis } from './room/room.outbound';
import { SelectRoomInfoFromRedis } from './room/room.inbound';


@Global()
@Module({
  providers: [
    ConfigService,
    {
      provide: REDIS_SERVER,
      useFactory: async (config: ConfigService) => {
        // redis connect
        const url: string = config.get<string>(
          'NODE_APP_REDIS_URL',
          'redis://localhost:6379',
        );
        const password: string = config.get<string>(
          'NODE_APP_REDIS_PASSWORD',
          'password',
        );

        const client = createClient({
          url,
          password,
        });

        // 나중에 logger로 처리
        client.on('error', (err) => {
          console.error(`redis를 연결하는데 에러가 발생했습니다: ${err}`);
        });

        await client.connect();

        return client;
      },
      inject: [ConfigService],
    },

    InsertUserSessionDataToRedis,
    SelectHsetDataFromRedis,
    DeleteUserDataToRedis,
    InsertRoomDataToRedis, // room data를 생성할때 사용
    SelectRoomInfoFromRedis, // roominfo 정보를 찾을때 사용
    InsertRoomDatasToRedis, // room data들을 저장할때 사용 
    DeleteRoomDatasToRedis, // room정보들을 삭제하기 위해 사용
  ],
  exports: [
    REDIS_SERVER,
    InsertUserSessionDataToRedis,
    SelectHsetDataFromRedis,
    DeleteUserDataToRedis,
    InsertRoomDataToRedis,
    SelectRoomInfoFromRedis,
    InsertRoomDatasToRedis,
    DeleteRoomDatasToRedis
  ],
})
export class RedisModule {}
