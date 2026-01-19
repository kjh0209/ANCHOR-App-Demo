import { Repository } from 'typeorm';
import { Match } from './match.entity';
export declare class MatchService {
    private matchRepository;
    constructor(matchRepository: Repository<Match>);
    requestMatch(userId: string, username: string, role: 'driver' | 'passenger', targetUsername: string): Promise<Match>;
    findActiveMatchByUser(userId: string, role: 'driver' | 'passenger'): Promise<Match | null>;
    getMatchStatus(userId: string, role: 'driver' | 'passenger'): Promise<Match | null>;
    updateGPS(matchId: string, userId: string, role: 'driver' | 'passenger', latitude: number, longitude: number): Promise<Match>;
    cancelMatch(matchId: string): Promise<void>;
    completeMatch(matchId: string): Promise<void>;
    findById(matchId: string): Promise<Match | null>;
}
