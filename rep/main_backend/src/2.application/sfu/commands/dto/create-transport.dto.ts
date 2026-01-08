

export type CreateTransportDto = {
  room_id : string;
  socket_id : string; 
  user_id : string;
  type : "send" | "recv"
};

export type CreateRoomTransportDto = {
  room_id : string;
  socket_id : string;
  transport_id : string;
  user_id : string;
  type : "send" | "recv"
};