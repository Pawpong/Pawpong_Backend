import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        console.log('[RolesGuard] requiredRoles:', requiredRoles);

        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        console.log('[RolesGuard] user:', JSON.stringify(user));
        console.log('[RolesGuard] user.role:', user?.role);
        const hasRole = requiredRoles.some((role) => user?.role === role);
        console.log('[RolesGuard] hasRole:', hasRole);
        return hasRole;
    }
}
