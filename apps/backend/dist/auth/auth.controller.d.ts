import { AuthService } from './auth.service';
declare class RegisterDto {
    username: string;
    password: string;
    role: 'driver' | 'passenger';
}
declare class LoginDto {
    username: string;
    password: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        id: string;
        username: string;
        role: string;
    }>;
    login(dto: LoginDto): Promise<{
        id: string;
        username: string;
        role: string;
    }>;
    getUser(id: string): Promise<{
        error: string;
        id?: undefined;
        username?: undefined;
        role?: undefined;
    } | {
        id: string;
        username: string;
        role: "driver" | "passenger";
        error?: undefined;
    }>;
    getUserByUsername(username: string): Promise<{
        error: string;
        id?: undefined;
        username?: undefined;
        role?: undefined;
    } | {
        id: string;
        username: string;
        role: "driver" | "passenger";
        error?: undefined;
    }>;
}
export {};
