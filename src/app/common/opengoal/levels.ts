export class Level {
    static lavaTube = "lavatube";
    static beach = "beach";
    static citadel = "citadel";
    static darkCave = "darkcave";
    static finalBoss = "finalboss";
    static fireCanyon = "firecanyon";
    static jungle = "jungle";
    static plantBoss = "jungleb";
    static spiderCave = "maincave";
    static misty = "misty";
    static mountainPass = "ogre";
    static spiderRobotCave = "robocave";
    static basin = "rolling";
    static snowy = "snow";
    static lpcTopPart = "sunken";
    static lpcBottomPart = "sunkenb";
    static boggy = "swamp";
    static geyser = "training";
    static hub1 = "village1";
    static hub2 = "village2";
    static hub3 = "village3";
    

    static toSymbol(levelName: string | undefined) {
        switch(levelName) {      
            case Level.lavaTube:
                return 1325164;
            case Level.beach:
                return 1312916;
            case Level.citadel:
                return 1338444;
            case Level.darkCave:
                return 1433092;
            case Level.finalBoss:
                return 1340092;
            case Level.fireCanyon:
                return 1321092;
            case Level.jungle:
                return 1314348;
            case Level.plantBoss:
                return 1410548;
            case Level.spiderCave:
                return 1347564;
            case Level.misty:
                return 1399604;
            case Level.mountainPass:
                return 1403380;
            case Level.spiderRobotCave:
                return 1358164;
            case Level.basin:
                return 1399012;
            case Level.snowy:
                return 1409380;
            case Level.lpcTopPart:
                return 1348316;
            case Level.lpcBottomPart:
                return 1430476;
            case Level.boggy:
                return 1329836;
            case Level.geyser:
                return 1334388;
            case Level.hub1:
                return 1428580;
            case Level.hub2:
                return 1428612;
            case Level.hub3:
                return 1428596;
            default:
                return "";
        }
    }
}

export class LevelSymbol {
    static lavaTube = 1325164;
    static beach = 1312916;
    static citadel = 1338444;
    static darkCave = 1433092;
    static finalBoss = 1340092;
    static fireCanyon = 1321092;
    static jungle = 1314348;
    static plantBoss = 1410548;
    static spiderCave = 1347564;
    static misty = 1399604;
    static mountainPass = 1403380;
    static spiderRobotCave = 1358164;
    static basin = 1399012;
    static snowy = 1409380;
    static lpcTopPart = 1348316;
    static lpcBottomPart = 1430476;
    static boggy = 1329836;
    static geyser = 1334388;
    static hub1 = 1428580;
    static hub2 = 1428612;
    static hub3 = 1428596;

    static toName(levelSymbol: number | undefined) {
        switch(levelSymbol) {
            case 1325164:
                return Level.lavaTube;
            case 1312916:
                return Level.beach;
            case 1338444:
                return Level.citadel;
            case 1433092:
                return Level.darkCave;
            case 1340092:
                return Level.finalBoss;
            case 1321092:
                return Level.fireCanyon;
            case 1314348:
                return Level.jungle;
            case 1410548:
                return Level.plantBoss;
            case 1347564:
                return Level.spiderCave;
            case 1399604:
                return Level.misty;
            case 1403380:
                return Level.mountainPass;
            case 1358164:
                return Level.spiderRobotCave;
            case 1399012:
                return Level.basin;
            case 1409380:
                return Level.snowy;
            case 1348316:
                return Level.lpcTopPart;
            case 1430476:
                return Level.lpcBottomPart;
            case 1329836:
                return Level.boggy;
            case 1334388:
                return Level.geyser;
            case 1428580:
                return Level.hub1;
            case 1428612:
                return Level.hub2;
            case 1428596:
                return Level.hub3;
            default:
                return "";
        }
    }
}

export class MultiLevel {
    static spiderCave(): string[] {
        return [ Level.spiderCave, Level.spiderRobotCave, Level.darkCave];
    }

    static jungle(): string[] {
        return [ Level.jungle, Level.plantBoss];
    }

    static lpc(): string[] {
        return [ Level.lpcTopPart, Level.lpcBottomPart];
    }
}