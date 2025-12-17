import { EmptyAuthCode } from '@error/presentation/user/user.error';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Response } from 'express';
import { AuthService } from '@present/http/auth/auth.service';
import {
  CreateUserOauthDto,
  LoginOauthUserDto,
  Payload,
  TokenDto,
} from '@app/auth/commands/dto';
import { JwtGuard } from './guards';
import { LoginValidate, SignUpValidate } from './auth.validate';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {}

  // 로컬에서 회원가입이 이루어지는 컨트롤러
  @Post('signup')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )
  public async signUpController(
    @Body() dto: SignUpValidate,
  ): Promise<Record<string, string>> {
    await this.authService.signUpService(dto);
    return { status: 'ok' };
  }

  // kakao 회원가입
  @Post('signup/kakao')
  public signUpForKakaoController(
    @Res({ passthrough: true }) res: Response,
  ): void {
    const backend_url: string = this.config.get<string>(
      'NODE_BACKEND_SERVER',
      'redirctUrl',
    );
    const redirect_url: string = `${backend_url}/api/auth/signup/kakao/redirect`;
    const url: string = this.authService.getAuthTokenKakaoUrl(redirect_url);
    res.redirect(url);
  }

  // kakao 회원가입 리다이렉트
  @Get('signup/kakao/redirect')
  @HttpCode(201)
  public async signUpForKakaoRedirectController(
    @Req() req: Request,
  ): Promise<Record<string, string>> {
    const code = (req as any).query?.code; // code 읽어오기
    if (!code) throw new EmptyAuthCode();
    const signUpData: CreateUserOauthDto =
      await this.authService.getDataKakaoLogicVerSignUp(code);
    await this.authService.signUpVerOauthService(signUpData); // 실제 로그인
    return { status: 'ok' };
  }

  // 로그인 관련 - local
  @Post('login')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )
  @HttpCode(200)
  public async loginController(
    @Body() dto: LoginValidate,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Record<string, string>> {
    const tokens: TokenDto = await this.authService.loginService(dto);

    // refresh_token은 cookie로
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 밀리초
      path: '/',
      sameSite: 'lax',
    });

    // access_token은 body로
    return { access_token: tokens.access_token };
  }

  // 로그인 관련 - kakao
  @Post('login/kakao')
  public loginForKakaoController(
    @Res({ passthrough: true }) res: Response,
  ): void {
    const backend_url: string = this.config.get<string>(
      'NODE_BACKEND_SERVER',
      'redirctUrl',
    );
    const redirect_url: string = `${backend_url}/api/auth/login/kakao/redirect`;
    const url: string = this.authService.getAuthTokenKakaoUrl(redirect_url);
    res.redirect(url);
  }

  @Get('login/kakao/redirect')
  public async loginForKakaoRedirectController(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Record<string, string>> {
    const code = (req as any).query?.code; // 코드확인
    if (!code) throw new EmptyAuthCode();
    const loginData: LoginOauthUserDto =
      await this.authService.getDataKakaoLogicVerLogin(code);
    const tokens: TokenDto =
      await this.authService.loginVerOauthService(loginData); // 실제 로그인

    // refresh_token은 cookie로
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 밀리초
      path: '/',
      sameSite: 'lax',
    });

    // access_token은 body로
    return { access_token: tokens.access_token };
  }

  // 로그아웃과 관련
  @UseGuards(JwtGuard)
  @Delete('logout')
  public async logoutController(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Record<string, string>> {
    const payload: Payload = (req as any).user;
    await this.authService.logoutService(payload);

    // header로 x-access-token 빈값으로 전달
    res.setHeader('x-access-token', '');

    // cookie 삭제
    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return { status: 'ok' };
  }
}
