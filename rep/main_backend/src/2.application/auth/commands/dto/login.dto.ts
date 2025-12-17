export type LoginUserDto = {
  email: string;
};

export type LoginNormalUserDto = LoginUserDto & {
  password: string;
};

export type LoginOauthUserDto = LoginUserDto & {
  provider: string;
  provider_id: string;
};
