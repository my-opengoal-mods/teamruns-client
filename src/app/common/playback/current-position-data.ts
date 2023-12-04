import { Color } from "../opengoal/color";
import { InteractionType } from "../opengoal/interaction-type";
import { MultiplayerState } from "../opengoal/multiplayer-state";
import { UserBase } from "../user/user";
import { InteractionData } from "./interaction-data";
import { PositionData } from "./position-data";
import { RemotePlayerInfo } from "./remote-player-info";

export class CurrentPositionData {
    transX: number;
    transY: number;
    transZ: number;
    quatX: number;
    quatY: number;
    quatZ: number;
    quatW: number;
    rotY: number;
    tgtState: any;
    currentLevel: string;
    
    interaction: InteractionData | undefined;
    playerInfo: RemotePlayerInfo | undefined;

    userId: string;
    username: string;
    color: Color;
    mpState: MultiplayerState;

    constructor(user: UserBase, state: MultiplayerState) {
        this.username = user.name;
        this.userId = user.id;
        this.mpState = state;
        this.color = Color.normal;
    }

    updateCurrentInteraction(interactionData: InteractionData) {
        this.interaction = InteractionData.getInteractionValues(interactionData);
    }

    resetCurrentInteraction() {
        this.interaction = undefined;
    }

    resetCurrentInfo() {
        this.playerInfo = undefined;
    }
}


export class CurrentPlayerData {
    positionData: CurrentPositionData;

    interactionBuffer: InteractionData[] = []; // updates gets pushed from top of list first
    hasInteractionUpdate: boolean;
    hasInfoUpdate: boolean;
    recordingDataIndex: number | undefined; // only used by recordings

    constructor(user: UserBase, state: MultiplayerState) {
        this.positionData = new CurrentPositionData(user, state);
        this.hasInteractionUpdate = false;
        this.interactionBuffer = [];
    }

    // returns if has updated
    updateCurrentPosition(positionData: PositionData, isLocalUser: boolean, recordingDataIndex: number | undefined = undefined) : boolean {
        if (recordingDataIndex) {
            if (recordingDataIndex === this.recordingDataIndex)
                return false;
            else
                this.recordingDataIndex = recordingDataIndex;
        }

        //remove/clean up old player info
        if (!this.hasInfoUpdate && this.positionData.playerInfo)
            this.positionData.playerInfo = undefined;
        
        //check if overwriting unsent position update with interaction
        const bufferInteraction = this.hasInteractionUpdate && positionData.interType && positionData.interType !== InteractionType.none;
        if (!isLocalUser && bufferInteraction)
            this.interactionBuffer.push(InteractionData.getInteractionValues(positionData));


        this.positionData.quatW = positionData.quatW;
        this.positionData.quatX = positionData.quatX;
        this.positionData.quatY = positionData.quatY;
        this.positionData.quatZ = positionData.quatZ;
        this.positionData.rotY = positionData.rotY;
        this.positionData.tgtState = positionData.tgtState;
        this.positionData.currentLevel = positionData.currentLevel;
        this.positionData.transX = positionData.transX;
        this.positionData.transY = positionData.transY;
        this.positionData.transZ = positionData.transZ;
        if (isLocalUser || !bufferInteraction) 
        {
            if (positionData.interType !== InteractionType.none) {
                if (!this.positionData.interaction || this.positionData.interaction.interType !== InteractionType.none) {
                    this.positionData.updateCurrentInteraction(positionData);
                    this.hasInteractionUpdate = true;
                }
                else
                    this.interactionBuffer.push(InteractionData.getInteractionValues(positionData));
            }
        }

        return true;
    }

    checkUpdateInteractionFromBuffer() {
        if (this.hasInteractionUpdate || this.interactionBuffer.length == 0 || (this.positionData.interaction?.interType && this.positionData.interaction?.interType !== InteractionType.none))
            return;

        const interactionData: InteractionData | undefined = this.interactionBuffer.shift();
        if (interactionData) {
            this.positionData.updateCurrentInteraction(interactionData);
            this.hasInteractionUpdate = true;
        }
    }
}
