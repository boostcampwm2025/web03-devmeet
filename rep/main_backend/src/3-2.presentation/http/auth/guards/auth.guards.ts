// 인증 로직이 들어온다.
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
  type LoggerService,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuth } from '@app/auth/queries/usecase';
import { type TokenDto } from '@app/auth/commands/dto';
import { type PayloadRes } from '@app/auth/queries/dto';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly authUsecase: JwtAuth<unknown>) {}

  private removeSession(response: Response) {
    // header로 x-access-token 빈값으로 전달
    response.setHeader('x-access-token', '');

    // cookie로 전달
    response.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  }

  private extractBearerToken(authHeader?: string): string | undefined {
    if (!authHeader) return undefined;
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) return undefined;
    return token.trim();
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    // req, res 관련해서 일단 받아오기
    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();

    // access_tokens - RFC 7235 Bearer 토큰 기준으로 정식으로 전달
    const access_token = this.extractBearerToken(request.headers.authorization);

    // refresh_token
    const refresh_token: string | undefined =
      request.cookies?.['refresh_token'];

    try {
      if (!access_token || !refresh_token) {
        // 고민이다 - 사실 다른 곳에서 잘못된 의도로 접근하면 삭제하는게 맞긴 하다.
        throw new UnauthorizedException('세션이 만료되었습니다.');
      }

      // response
      const tokenDto: TokenDto = {
        access_token,
        refresh_token,
      };

      // jwt 인증
      const payload: PayloadRes | undefined =
        await this.authUsecase.execute(tokenDto);

      if (payload) {
        // header에 전달 access_token 전달
        response.setHeader('x-access-token', payload.access_token);

        (request as any).user = {
          user_id: payload.user_id,
          email: payload.email,
          nickname: payload.nickname,
        };
        return true;
      } else {
        // payload가 없으면 삭제가 된다. 아래에 추가 하였다.
        throw new UnauthorizedException(
          '유저 인증 절차를 진행하고 있는데 에러가 발생했습니다.',
        );
      }
    } catch (err) {
      // 삭제
      this.removeSession(response);
      throw new HttpException(
        {
          message: err.message,
          status: err.status,
        },
        err.status || 500,
        {
          cause: err.message,
        },
      );
    }
  }
}
