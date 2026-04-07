export type JwtPayload = {
    id: string;
    role: 'owner';
};
type RefreshPayload = {
    id: string;
};
export declare function signAccessToken(payload: JwtPayload): string;
export declare function signRefreshToken(payload: RefreshPayload): string;
export declare function verifyAccessToken(token: string): JwtPayload;
export declare function verifyRefreshToken(token: string): RefreshPayload;
export {};
//# sourceMappingURL=jwt.d.ts.map