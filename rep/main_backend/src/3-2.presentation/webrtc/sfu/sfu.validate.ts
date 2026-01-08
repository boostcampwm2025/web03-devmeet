import { DtlsParameters, IceCandidate, IceParameters } from "mediasoup/types";


export type ConnectTransportType = {
  room_id : string;
  socket_id : string; 
  user_id : string;
  type : "send" | "recv";
  transport_id : string;
  dtlsParameters: DtlsParameters
};