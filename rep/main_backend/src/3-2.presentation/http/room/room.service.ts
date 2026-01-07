import { CreateRoomDto } from "@app/room/commands/dto";
import { CreateRoomUsecase } from "@app/room/commands/usecase";
import { HttpException, Injectable } from "@nestjs/common";


@Injectable()
export class RoomService {
  constructor (
    private readonly createRoomUsecase : CreateRoomUsecase<any, any>,
  ) {}

  // 방을 생성하기 위한 서비스
  async createRoomService(dto : CreateRoomDto) {
    try {
      const result = await this.createRoomUsecase.execute(dto);
      return result;
    } catch (err) {
      throw new HttpException(
        {
          message: err.message || err,
          status: err.status || 500,
        },
        err.status || 500,
        {
          cause: err,
        },
      );
    };
  }
}