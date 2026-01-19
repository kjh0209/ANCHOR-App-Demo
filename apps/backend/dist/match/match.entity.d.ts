export declare class Match {
    id: string;
    driverId: string;
    driverUsername: string;
    passengerId: string;
    passengerUsername: string;
    driverConfirmed: boolean;
    passengerConfirmed: boolean;
    status: 'pending' | 'matched' | 'completed';
    driverLatitude: number;
    driverLongitude: number;
    passengerLatitude: number;
    passengerLongitude: number;
    createdAt: Date;
    updatedAt: Date;
}
