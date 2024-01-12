import { Model } from "./types";

export class VendingModel implements Model {
    

    inputItemNumberID(char: string): { state: string; } & { type: "screenUpdate"; } {
        throw new Error("Method not implemented.");
    }
    pressOk(): ({ message: string; } & { type: "error"; }) | ({ price: string; } & { type: "success"; }) {
        throw new Error("Method not implemented.");
    }
    pressReset(): { screenState: string; coinsToReturn: number[]; } & { type: "reset"; } {
        throw new Error("Method not implemented.");
    }
    insertCoin(value: number): { moneyNeeded: number; } & { type: "success"; } {
        throw new Error("Method not implemented.");
    }
}