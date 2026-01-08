import { Module } from "@nestjs/common";
import { RoomController } from "./room.controller";
import { RoomService } from "./room.service";
import { AuthModule } from "../auth/auth.module";
import { CreateRoomUsecase } from "@app/room/commands/usecase";
import { MakeArgonRoomPasswordHash, MakeRoomIdGenerator, MakeRoomRandomCodeGenerator } from "./room.interface";
import { DeleteRoomDataToMysql, InsertRoomDataToMysql } from "@infra/db/mysql/room/room.outbound";
import { InsertRoomDataToRedis } from "@/3-1.infra/cache/redis/room/room.outbound";


@Module({
  imports : [
    AuthModule // jwt를 위한 import
  ],
  controllers : [
    RoomController,
  ],   
  providers : [
    // room에서 사용하는 서비스
    RoomService,
    MakeArgonRoomPasswordHash,
    MakeRoomIdGenerator,
    MakeRoomRandomCodeGenerator,

    // usecase 관련
    {
      provide : CreateRoomUsecase,
      useFactory : (
        passwordHash : MakeArgonRoomPasswordHash,
        roomIdGenerator : MakeRoomIdGenerator,
        makeRoomCodeGenerator : MakeRoomRandomCodeGenerator,
        insertRoomDataToDb : InsertRoomDataToMysql,
        insertRoomDataToCache : InsertRoomDataToRedis,
        deleteRoomDataToDb : DeleteRoomDataToMysql,
      ) => {
        return new CreateRoomUsecase({
          passwordHash, roomIdGenerator, makeRoomCodeGenerator, insertRoomDataToDb, insertRoomDataToCache, deleteRoomDataToDb
        });
      },
      inject : [
        MakeArgonRoomPasswordHash,
        MakeRoomIdGenerator,
        MakeRoomRandomCodeGenerator,
        InsertRoomDataToMysql,
        InsertRoomDataToRedis,
        DeleteRoomDataToMysql
      ]
    }
  ]
})
export class RoomModule {};