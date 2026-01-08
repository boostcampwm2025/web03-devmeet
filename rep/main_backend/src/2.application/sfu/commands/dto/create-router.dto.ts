import { Router } from "mediasoup/types";


export type RoomEntry = {
  room_id : string;
  worker_idx : number; // 이 라우터를 운영하기 위해서 필요한 정보 
  worker_pid : number; // worker를 디버깅 하기 위해서 필요한 정보 
  router : Router; // 실질적으로 기능구현에 사용되는 라우터 -> 여기에 있으면 안되고 domain에서 가져오도록 해야한다. ( 나중에 수정 모먼트 )
  transport_ids : Set<string>; // transport들이 저장된 라우터 
  created_at : Date;
};