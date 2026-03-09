import { EditorLanguage } from '@/constants/code-editor';

export type CursorState = {
  lineNumber: number;
  column: number;
};

export type UserRole = 'viewer' | 'presenter';

export type UserState = {
  name: string;
  role: UserRole;
};

export type LanguageState = {
  value: EditorLanguage;
  updatedAt: number;
  updatedBy: number; // clientID
};

export type AwarenessState = {
  user?: UserState;
  cursor?: CursorState | null;
};

/* Yjs - payload 및 요구타입 정의 */

export type YjsInitPayload = {
  update: ArrayBuffer;
  state_vector?: ArrayBuffer;
  origin?: 'INIT';
};

export type YjsRemoteUpdate = {
  update?: ArrayBuffer;
  updates?: ArrayBuffer[];
};

export type YjsSyncOrigin = 'SYNC_REQ' | 'INIT';

export type YjsSyncServerPayload =
  | {
      type: 'diff';
      ok: true;
      update: ArrayBuffer;
      server_state_vector?: ArrayBuffer;
      origin: YjsSyncOrigin;
    }
  | {
      type: 'error';
      ok: false;
      code: 'BAD_PAYLOAD' | 'ROOM_NOT_FOUND' | 'INTERNAL';
      message?: string;
      origin?: YjsSyncOrigin;
    };

export type YjsSyncReqPayload = {
  state_vector: Uint8Array;
  reason?:
    | 'MANUAL'
    | 'UNKNOWN'
    | 'INIT'
    | 'REMOTE_APPLY_FAILED'
    | 'SERVER_HINT';
};

export type YjsUpdateClientPayload = {
  update?: Uint8Array;
  updates?: Uint8Array[];
};
