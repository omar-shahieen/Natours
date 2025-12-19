import type { JwtPayload } from 'jsonwebtoken';

export interface JwtDecoded extends JwtPayload {
    id: string;
    iat: number;
}

