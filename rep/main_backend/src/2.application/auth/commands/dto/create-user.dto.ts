export type CreateUserDto = {
  // 필수
  email: string;
  nickname: string;
};

export type CreateUserNormalDto = CreateUserDto & {
  password: string;
};

export type CreateUserOauthDto = CreateUserDto & {
  provider: string;
  provider_id: string;
};
