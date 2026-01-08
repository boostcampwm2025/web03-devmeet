import { SelectDataFromCache } from "@app/ports/cache/cache.inbound";
import { Inject, Injectable } from "@nestjs/common";
import { type RedisClientType } from "redis";
import { CACHE_ROOM_NAMESPACE_NAME, CACHE_ROOM_SUB_NAMESPACE_NAME, REDIS_SERVER } from "../../cache.constants";
import { RoomInfoValues } from "@app/room/dtos";


@Injectable()
export class SelectRoomInfoFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {

  constructor(
    @Inject(REDIS_SERVER) cache : RedisClientType<any, any>
  ) { super(cache); };

  // namespace에 room_id만 있음
  async select({ namespace, keyName, }: { namespace: string; keyName: string; }): Promise<RoomInfoValues | undefined> {
    
    const cache = this.cache;
    const roomInfoNamespace : string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${namespace}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`;

    const roomInfo = await cache.hGetAll(roomInfoNamespace);

    // 데이터가 하나도 없다면? ( 애초에 비밀번호를 제외하고 한번에 저장되기 때문에 다 있어야 한다 그리고 추가적으로 시간제한도 없기 때문에 이부분에 대해서는 일단 이렇게 처리해도 좋다고 판단이 된다. )
    if ( !roomInfo || Object.keys(roomInfo).length === 0 ) return undefined;

    return {
      code : roomInfo.code,
      title : roomInfo.title,
      owner_id : roomInfo.owner_id,
      max_particiants : Number(roomInfo.max_particiants),
      current_particiants : Number(roomInfo.current_particiants),
      password_hash : 
        roomInfo.password_hash && roomInfo.password_hash.length > 0
        ? roomInfo.password_hash : null
    };
  }
};