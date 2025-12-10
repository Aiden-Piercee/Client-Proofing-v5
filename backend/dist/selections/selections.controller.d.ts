import { SelectionsService } from './selections.service';
import { SessionsService } from '../sessions/sessions.service';
export declare class SelectionsController {
    private readonly selectionsService;
    private readonly sessionsService;
    constructor(selectionsService: SelectionsService, sessionsService: SessionsService);
    updateSelection(sessionToken: string, imageId: number, state: string | null, print: boolean | undefined): Promise<{
        clientId: number;
        imageId: number;
        state: any;
        print: boolean;
    }>;
    getSelections(sessionToken: string): Promise<{
        imageId: any;
        state: import("./selections.service").SelectionState;
        print: boolean;
    }[]>;
}
