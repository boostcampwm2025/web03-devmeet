import { Module } from "@nestjs/common";
import { SfuService } from "./sfu.service";
import { MediasoupRouterFactory } from "./sfu.interface";
import { CreateRouterUsecase } from "@app/sfu/commands/usecase";
import { RoomCreateLockRepo, RoomRouterRepository } from "@infra/memory/sfu";
import { RoomCreateLockPort, RoomRouterRepositoryPort, RouterFactoryPort } from "@app/sfu/ports";


@Module({
  providers : [
    SfuService,

    // 메모리 사용을 위한 의존성 주입
    MediasoupRouterFactory,

    // usecase들
    // router를 생성하기 위한 usecase
    {
      provide : CreateRouterUsecase,
      useFactory : (
        roomRepo : RoomRouterRepositoryPort,
        roomCreateLockRepo : RoomCreateLockPort,
        routerFactory : RouterFactoryPort
      ) => {
        return new CreateRouterUsecase(
          roomRepo, roomCreateLockRepo, routerFactory
        )
      },
      inject : [
        RoomRouterRepository,
        RoomCreateLockRepo,
        MediasoupRouterFactory
      ]
    }

  ],
  exports : [
    SfuService,
  ]
})
export class SfuModule {};