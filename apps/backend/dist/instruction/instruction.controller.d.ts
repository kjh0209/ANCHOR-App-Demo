import { InstructionService } from './instruction.service';
declare class CreateInstructionDto {
    matchId: string;
    content: string;
    detectionData: any;
    imageWidth?: number;
    imageHeight?: number;
}
export declare class InstructionController {
    private readonly instructionService;
    constructor(instructionService: InstructionService);
    create(dto: CreateInstructionDto): Promise<import("./instruction.entity").Instruction>;
    send(id: string): Promise<import("./instruction.entity").Instruction>;
    cancel(id: string): Promise<{
        success: boolean;
    }>;
    getPending(matchId: string): Promise<import("./instruction.entity").Instruction | {
        status: string;
    }>;
    getLatest(matchId: string): Promise<import("./instruction.entity").Instruction>;
    getUnsent(matchId: string): Promise<import("./instruction.entity").Instruction>;
}
export {};
