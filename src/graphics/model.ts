import { EventListener, EventTemplate, Subscription } from "./types";

export type ModelState = "waitForInput" | "input" | "acceptingCoins";

export type SlotInfo = { 
    slot: number;
    price: number;
    count: number;
    color: number;
};

const coinsRecord = {
    [1]: null,
    [2]: null,
    [5]: null,
    [10]: null,
}

export type Coin = keyof typeof coinsRecord;

export const coinsArray: Coin[] = Object.keys(coinsRecord).map(n => +n).reverse() as Coin[];

const his = ["Hi!", "Hola", "Olá!", "Ahoj", "Hej!", "Hei!", "Helo"]

const getRandomHi = () => his[Math.floor(Math.random() * his.length)]

export type ModelEvent = 
    | EventTemplate<"displayUpdate", { display: string }>
    | EventTemplate<"itemDrop", { slot: number }>
    | EventTemplate<"returnCash", { coins: Coin[] }>
    | EventTemplate<"stateChange", { state: ModelState }>

export class Model {
    static TOTAL_SLOTS = 15;

    static splitIntoCoins(money: number): Coin[] {
        let rest = money;

        const result: Coin[] = [];

        for(const coin of coinsArray) {
            while(rest >= coin) {
                rest -= coin;
                result.push(coin)
            }
        }

        return result;
    }

    private eventListeners = new Set<EventListener<ModelEvent>>();

    private state: ModelState = "waitForInput";
    private displayText = getRandomHi()
    private pendingSlot = 0;
    private moneyInside = 0;
    private requiredPrice = 0;

    private slots = new Map<number, SlotInfo>()

    constructor(initSlots: SlotInfo[]) {
        for(const data of initSlots) {
            if(data.slot < 1 || data.slot > Model.TOTAL_SLOTS + 1) throw new Error("Unsupported slot");
            
            this.slots.set(data.slot, data);
        }
    }

    getState() {
        return this.state;
    }

    getDisplay() {
        return this.displayText;
    }

    setSlots(slots: SlotInfo[]) {
        this.slots.clear();

        for(const slot of slots) {
            if(slot.slot < 1 || slot.slot > Model.TOTAL_SLOTS + 1) throw new Error("Unsupported slot");
            
            this.slots.set(slot.slot, slot);
        }
    }

    getSlots(): Array<SlotInfo & { slot: number }> {
        return Array.from(this.slots.values());
    }

    inputNumber(dig: number) {
        if(this.state === "waitForInput") {
            this.setState("input");
            this.updateDisplay(dig + "");

            return;
        }

        if(this.state !== "input" || this.displayText.length === 3) return;

        this.updateDisplay(this.displayText + dig + "");
    }

    pressOk() {
        if(this.state === "waitForInput" || this.state === "acceptingCoins") return;

        const slotID = +this.displayText;

        const slot = this.slots.get(slotID);

        if(!slot) {
            this.setState("waitForInput");
            this.updateDisplay("404");

            return;
        }

        this.setState("acceptingCoins");
        this.updateDisplay(slot.price + "¢");
        this.requiredPrice = slot.price;
        this.pendingSlot = slotID;
    }

    pressReset() {
        const shouldReturnCoins = this.state === "acceptingCoins" && this.moneyInside > 0;

        this.setState("waitForInput");
        this.updateDisplay(getRandomHi());

        if(shouldReturnCoins) {
            const returnCoins = Model.splitIntoCoins(this.moneyInside);
            this.moneyInside = 0;
            this.sendEvent({ type: "returnCash", coins: returnCoins })
        }
    }

    insertCoin(coin: Coin) {
        if(this.state !== "acceptingCoins") {
            return this.sendEvent({ type: "returnCash", coins: [coin] });
        }

        this.moneyInside += coin;

        if(this.moneyInside < this.requiredPrice) {
            return this.updateDisplay((this.requiredPrice - this.moneyInside) + "¢");
        }

        const change = this.moneyInside - this.requiredPrice;
        const slot = this.pendingSlot;

        const changeCoins = Model.splitIntoCoins(change);

        this.setState("waitForInput");
        this.moneyInside = 0;

        this.updateDisplay(getRandomHi());
        this.sendEvent({ type: "returnCash", coins: changeCoins })
        this.sendEvent({ type: "itemDrop", slot })

        const slotInfo = this.slots.get(slot);
        if(slotInfo && (--slotInfo.count === 0)) {
            this.slots.delete(slot);
        }
    }

    addEventListener(cb: EventListener<ModelEvent>): Subscription {
        this.eventListeners.add(cb);

        return {
            unsubscribe: () => this.eventListeners.delete(cb)
        }
    }

    private setState(state: ModelState) {
        this.state = state;
        this.sendEvent({ type: "stateChange", state })
    }

    private updateDisplay(nextDisplay: string) {
        this.displayText = nextDisplay;

        this.sendEvent({ type: "displayUpdate", display: this.displayText })
    }

    private sendEvent(e: ModelEvent) {
        for(const listener of this.eventListeners) {
            listener(e);
        }
    }
}