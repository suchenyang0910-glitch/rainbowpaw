import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const required = process.env.INTERNAL_TOKEN;
    if (!required) return true;

    const req = context.switchToHttp().getRequest();
    const auth = String(req.headers?.authorization || '');
    const token = auth.startsWith('Bearer ')
      ? auth.slice('Bearer '.length)
      : '';
    return token === required;
  }
}
