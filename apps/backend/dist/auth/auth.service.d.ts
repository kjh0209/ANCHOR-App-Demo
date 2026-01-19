import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
export declare class AuthService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    register(username: string, password: string, role: 'driver' | 'passenger'): Promise<{
        id: string;
        username: string;
        role: string;
    }>;
    login(username: string, password: string): Promise<{
        id: string;
        username: string;
        role: string;
    }>;
    findById(id: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
}
