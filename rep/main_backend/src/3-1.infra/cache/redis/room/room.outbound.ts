import { InsertDataToCache } from "@app/ports/cache/cache.outbound";
import { Inject, Injectable } from "@nestjs/common";
import { type RedisClientType } from "redis";
import { CACHE_ROOM_INFO_KEY_NAME, CACHE_ROOM_NAMESPACE_NAME, CACHE_ROOM_SUB_NAMESPACE_NAME, REDIS_SERVER } from "../../cache.constants";
import { RoomProps } from "@domain/room/vo";


@Injectable()
export class InsertRoomDataToRedis extends InsertDataToCache<RedisClientType<any, any>> {

  constructor(
    @Inject(REDIS_SERVER) cache : RedisClientType<any, any>,
  ) { super(cache); };

  async insert(entity: Required<RoomProps>): Promise<boolean> {

    // room 관련 namespace 생성
    const roomNamespace : string = 
      `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${entity.room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`.trim();

    // watch는 필요없을것 같다 왜냐 room_id가 랜덤이니까 
    const roomInfoKeyValue : Record<string, string> = {
      [CACHE_ROOM_INFO_KEY_NAME.CODE] : entity.code,
      [CACHE_ROOM_INFO_KEY_NAME.TITLE] : entity.title,
      [CACHE_ROOM_INFO_KEY_NAME.OWNER_ID] : entity.owner_user_id,
      [CACHE_ROOM_INFO_KEY_NAME.MAX_PARTICIANTS] : String(entity.max_participants),
      [CACHE_ROOM_INFO_KEY_NAME.CURRENT_PARTICIANTS] : "0",
    };

    if ( entity.password_hash ) roomInfoKeyValue[CACHE_ROOM_INFO_KEY_NAME.PASSWORD_HASH] = entity.password_hash
    
    await this.cache.hSet(roomNamespace, roomInfoKeyValue)

    return true;
  };
};
