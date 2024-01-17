import { Model } from "./model";
import { Subscription } from "./types";
import { View } from "./view";

export class Controller {

    private subs: Subscription[] = [];

    constructor(
        private model: Model,
        private view: View
    ) {
    }

    start() {
        this.view.start();
        
        for(const slot of this.model.getSlots()) {
            this.view.setSlot(slot.slot, slot.color, slot.count);
        }


        this.subs.push(
            this.view.addEventListener((e) => {
                switch(e.type) {
                    case "numberPressed":
                        this.model.inputNumber(e.key);
                        break;
                    
                    case "okPressed":
                        this.model.pressOk();
                        break;

                    case "resetPressed":
                        this.model.pressReset();
                        break;
                    
                    case "numpadAreaClicked":
                        this.view.setCameraPosition("numpad");
                        break;

                    case "hatchClick":
                        this.view.openCloseHatch();
                        break;
                }
            }),
            this.model.addEventListener((e) => {
                switch(e.type) {
                    case "displayUpdate":
                        this.view.setDisplay(e.display)
                        break;
                    
                    case "itemDrop":
                        this.view.dropItem(e.slot);
                        break;
                    
                    case "returnCash":
                        this.view.dropChange(e.coins.length)
                        break;
                }
            })
        )
    }

    stop() {
        this.view.destroy();

        for(const sub of this.subs) {
            sub.unsubscribe();
        }
    }
}