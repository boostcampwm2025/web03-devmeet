import { DtlsParameters, IceCandidate, IceParameters } from "mediasoup/types";


// transport에 대해서 정보를 저장한다. 
export type TransportEntry = {
  transportId: string;
  iceParameters: IceParameters;
  iceCandidates: Array<IceCandidate>;
  dtlsParameters: DtlsParameters;
};

export type ConnectTransportType = {
  room_id : string;
  socket_id : string; 
  user_id : string;
  type : "send" | "recv";
  transport_id : string;
  dtlsParameters: DtlsParameters
};