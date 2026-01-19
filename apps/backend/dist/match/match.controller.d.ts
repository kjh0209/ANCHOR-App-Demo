import { MatchService } from './match.service';
import { RequestMatchDto } from './dto/request-match.dto';
import { UpdateGPSDto } from './dto/update-gps.dto';
export declare class MatchController {
    private readonly matchService;
    constructor(matchService: MatchService);
    requestMatch(dto: RequestMatchDto): Promise<import("./match.entity").Match>;
    getMatchStatus(userId: string, role: 'driver' | 'passenger'): Promise<import("./match.entity").Match | {
        status: "none";
    }>;
    getMatch(matchId: string): Promise<import("./match.entity").Match>;
    updateGPS(matchId: string, dto: UpdateGPSDto): Promise<import("./match.entity").Match>;
    cancelMatch(matchId: string): Promise<{
        success: boolean;
    }>;
    completeMatch(matchId: string): Promise<{
        success: boolean;
    }>;
}
