import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";


// socket에서 사용할 
export type SocketPayload = {
  socket_id : string;
  ip : string;
  user_id : string;
  nickname : string;
  access_token? : string;
  is_guest : boolean;
};

// 처음에 방에 가입할때 필요한 정보
export class JoinRoomValidate {

  @IsNotEmpty()
  @IsString()
  @MinLength(32)
  @MaxLength(32)
  code : string;

  @IsOptional()
  @IsString()
  @MaxLength(16) // 16글자로 정리 가능
  password? : string;

  @IsOptional()
  @IsString()
  @MaxLength(16) // 16글자? 
  nickname? : string;
}