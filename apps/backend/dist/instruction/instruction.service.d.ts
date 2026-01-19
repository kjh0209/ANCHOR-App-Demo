import { Repository } from 'typeorm';
import { Instruction } from './instruction.entity';
export declare class InstructionService {
    private instructionRepository;
    constructor(instructionRepository: Repository<Instruction>);
    create(matchId: string, content: string, detectionData: any, imageWidth?: number, imageHeight?: number): Promise<Instruction>;
    send(instructionId: string): Promise<Instruction>;
    cancel(instructionId: string): Promise<void>;
    getPending(matchId: string): Promise<Instruction | null>;
    getLatest(matchId: string): Promise<Instruction | null>;
    getUnsent(matchId: string): Promise<Instruction | null>;
}
