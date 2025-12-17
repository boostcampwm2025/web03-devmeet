export const REDIS_SERVER = Symbol('REDIS_SERVER');

export const CACHE_USER_NAMESPACE_NAME = Object.freeze({
  CACHE_USER: 'cache:user', // user의 cache 정보를 이용할때 사용하는 namespace
  SESSION_USER: 'session:user', // user의 session 정보를 저장할때 사용하는 namespace
} as const);

export const CACHE_USER_SESSION_KEY_NAME = Object.freeze({
  REFRESH_TOKEN_HASH: 'refresh_token_hash',
} as const);
