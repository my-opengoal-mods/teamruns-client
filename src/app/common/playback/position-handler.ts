
import { WebSocketSubject, webSocket } from "rxjs/webSocket";
import { Subject } from 'rxjs';
import { Recording } from "./recording";
import { PositionDataTimestamp, UserPositionDataTimestamp } from "./position-data";
import { UserService } from "src/app/services/user.service";
import { UserBase } from "../user/user";
import { MultiplayerState } from "../opengoal/multiplayer-state";
import { InteractionType } from "../opengoal/interaction-type";
import { Timer } from "../run/timer";
import { InteractionData, UserInteractionData } from "./interaction-data";
import { CurrentPlayerData } from "./current-position-data";
import { LocalPlayerData } from "../user/local-player-data";

export class PositionHandler {

    recordings: Recording[] = [];
    private hasDrawnRecordingNames: boolean = false;
    private userPositionRecording: Recording[] = [];

    timer: Timer = new Timer();

    private self: CurrentPlayerData;
    private players: CurrentPlayerData[] = [];
    private drawPositions: boolean = false;
    private positionUpdateRateMs: number = 16;

    ogSocket: WebSocketSubject<any> = webSocket('ws://localhost:8111');
    private launchListener: any;
    recordingPickups: Subject<UserPositionDataTimestamp> = new Subject();


    constructor(public userService: UserService) {

        if (this.userService.user.name) //if client is fully reloaded in a place where position service is started at same time as use we pick up user on movement instead
            this.checkRegisterPlayer(this.userService.user, MultiplayerState.interactive);

        if (this.userService.gameLaunched)
            this.connectToOpengoal();

        this.launchListener = (window as any).electron.receive("og-launched", (launched: boolean) => {
            if (launched)
                this.connectToOpengoal();
            else {
                this.ogSocket.complete();
                this.ogSocket = webSocket('ws://localhost:8111');
            }

        });
    }

    private connectToOpengoal() {
        this.ogSocket.subscribe(target => {
            if (target.position)
                this.updatePlayerPosition(new UserPositionDataTimestamp(target.position, this.timer.totalMs, this.userService.user));

            if (target.state && target.state.justSpawned)
                this.timer.onPlayerLoad();

            /*
            if (target.state) {
              console.log(target.state)
            }
      
            if (target.levels) {
              console.log(target.levels)
            }*/

            if (target.connected) {
                this.userService.replConnected = true;
                console.log("REPL Connected!");
            }
        },
            error => {
                console.log("Opengoal socket error, did the game shut down?");
            });
    }

    resetGetRecordings(): Recording[] {
        const recordings = this.userPositionRecording;
        this.cleanupPlayers();

        this.resetOngoingRecordings();
        this.recordings = [];
        this.players = [];
        return recordings;
    }

    resetOngoingRecordings() {
        this.userPositionRecording = [];
    }

    getPlayerIngameIndex(id: string): number | undefined {
        const player = this.players.find(x => x.positionData.userId === id);
        return player ? (this.players.indexOf(player) + 1) : undefined; //current is always 0 inside opengoal so + 1 for remote id
    }

    getCurrentPlayer(): CurrentPlayerData | undefined {
        return this.players.find(x => x.positionData.userId === this.userService.getId());
    }

    addPlayerInteraction(interaction: UserInteractionData) {
        const player = this.players.find(x => x.positionData.userId == interaction.userId);
        if (!player) return;
        player.interactionBuffer.push(InteractionData.getInteractionValues(interaction));
        console.log("adding to buffer 3", interaction)
    }

    addOrbReductionToCurrentPlayer(reductionAmount: number, level: string) {
        const orbReductionInteraction: UserInteractionData = {
            interType: InteractionType.money,
            interAmount: reductionAmount < 0 ? reductionAmount : -reductionAmount,
            interStatus: 0,
            interName: "money",
            interParent: "entity-pool",
            interLevel: level,
            interCleanup: false,
            userId: this.userService.getId()
        };
        console.log("adding orb reduction!", orbReductionInteraction)
        this.addPlayerInteraction(orbReductionInteraction);
    }

    removePlayer(userId: string) {
        this.recordings = this.recordings.filter(x => x.userId !== userId);
        this.userPositionRecording = this.userPositionRecording.filter(x => x.userId !== userId);
        this.players = this.players.filter(x => x.positionData.userId !== userId);
    }

    checkRegisterPlayer(user: UserBase | undefined, state: MultiplayerState) {
        if (!user || this.players.find(x => x.positionData.userId === user.id)) return;

        if (user.id !== this.userService.getId())
            this.players.push(new CurrentPlayerData(user, state));
        else
            this.self = new CurrentPlayerData(user, MultiplayerState.interactive);
    }

    addRecording(recording: Recording, user: UserBase, state: MultiplayerState = MultiplayerState.active) {
        recording.userId = recording.id;
        user.id = recording.id;
        this.checkRegisterPlayer(user, state);
        this.recordings.push(recording);
    }


    updatePlayerPosition(positionData: UserPositionDataTimestamp) {
        let player = positionData.userId !== this.userService.user.id ? this.players.find(x => x.positionData.userId === positionData.userId) : this.self;

        if (player) player.updateCurrentPosition(positionData);
        else
            this.checkRegisterPlayer(new UserBase(positionData.userId, positionData.username), MultiplayerState.interactive);

        if (this.timer.totalMs === 0) return;
        //handle user position recording
        let userRecording = this.userPositionRecording.find(x => x.userId === positionData.userId);

        //registner new if missing
        if (!userRecording) {
            userRecording = new Recording(positionData.userId);
            this.userPositionRecording.push(userRecording);
        }

        userRecording.playback.unshift(new PositionDataTimestamp(positionData, positionData.time));
    }

    startDrawPlayers() {
        if (this.drawPositions) return;
        this.drawPositions = true;
        this.drawPlayers();
        this.players.forEach(player => {
            if (player.positionData.mpState === MultiplayerState.disconnected)
                player.positionData.mpState = MultiplayerState.interactive;
        });
    }

    stopDrawPlayers() {
        this.drawPositions = false;
        this.cleanupPlayers();
    }

    private async drawPlayers() {
        if (!this.drawPositions) return;

        if (this.timer.totalMs > 0) {
            this.recordings.forEach(recording => {
                const positionData = recording.playback.find(x => x.time < this.timer.totalMs);
                if (positionData) {
                    const currentPlayer = this.players.find(x => x.positionData.userId === recording.userId);
                    if (currentPlayer) {
                        const previousRecordingdataIndex = currentPlayer.recordingDataIndex;
                        const newRecordingdataIndex = recording.playback.indexOf(positionData);
                        if (currentPlayer.updateCurrentPosition(positionData, newRecordingdataIndex)) {

                            //handle missed pickups
                            if (previousRecordingdataIndex && (previousRecordingdataIndex - 1) > newRecordingdataIndex) {
                                console.log("skipped frames", previousRecordingdataIndex - newRecordingdataIndex - 1);
                                for (let i = previousRecordingdataIndex - 1; i > newRecordingdataIndex; i--) {
                                    this.addInteractionToBuffer(currentPlayer, recording.playback[i]);
                                    this.checkSendRecordingPickup(currentPlayer, recording.playback[i]);
                                }
                            }

                            //handle recording pickups
                            this.checkSendRecordingPickup(currentPlayer, positionData);
                        }
                    }
                }
            });
        }

        if (this.timer.totalMs > 200) {
            if (!this.hasDrawnRecordingNames) {
                this.recordings.forEach(recording => {
                    const currentPlayer = this.players.find(x => x.positionData.userId === recording.userId);
                    if (currentPlayer) currentPlayer.positionData.username = recording.nameFrontend ?? "BLANK";
                });
            }
        }

        this.players.forEach(player => {
            //ensure interaction don't run twice
            if (!player.hasFrameUpdate)
                player.positionData.resetCurrentInteraction();

            player.hasFrameUpdate = false; 

            //fill interaction from buffer if possible
            player.checkUpdateInteractionFromBuffer();
        });

        this.updatePlayersInOpengoal();
        await new Promise(r => setTimeout(r, this.positionUpdateRateMs));

        this.drawPlayers();
    }

    private addInteractionToBuffer(currentPlayer: CurrentPlayerData, positionData: PositionDataTimestamp) {
        if (currentPlayer.positionData.mpState === MultiplayerState.interactive && positionData.interType && positionData.interType !== InteractionType.none)
            currentPlayer.interactionBuffer.push(InteractionData.getInteractionValues(positionData));
    }

    private checkSendRecordingPickup(currentPlayer: CurrentPlayerData, positionData: PositionDataTimestamp) {
        if (currentPlayer.positionData.mpState === MultiplayerState.interactive && positionData.interType && positionData.interType !== InteractionType.none)
            this.recordingPickups.next(new UserPositionDataTimestamp(positionData, positionData.time, new UserBase(currentPlayer.positionData.userId, currentPlayer.positionData.username)));
    }

    private updatePlayersInOpengoal() {
        this.ogSocket.next(this.players.flatMap(x => x.positionData));
    }

    private cleanupPlayers() {
        if (!this.players.some(x => x.positionData.mpState !== MultiplayerState.disconnected)) return;

        this.players.forEach(player => {
            player.positionData.username = "";
            player.positionData.mpState = MultiplayerState.disconnected;
        });

        this.updatePlayersInOpengoal();
    }

    onDestroy(): void {
        this.timer.reset();
        this.stopDrawPlayers();
        this.timer.onDestroy();
        this.launchListener();
        this.ogSocket.complete();
    }
}
