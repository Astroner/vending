"use client"

import { FC, useCallback, useEffect, useRef, useState } from "react";


import { Assets, CameraPosition } from "../../graphics/types";

import { Coin, Model, ModelState, SlotInfo } from "@/src/graphics/model";

import { useGraphics } from "./use-graphics";
import { InventoryEditing } from "../inventory-editing/invetory-editing.component";
import { Coins } from "./coins.component";

import cn from "./display.module.scss";
import { WalletIcon } from "@/src/icons/wallet.icon";

export interface DisplayProps {
    assets: Assets,
    initialSlots: SlotInfo[],
    initialWallet: Coin[],
}

export const Display: FC<DisplayProps> = props => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

    const { model, view } = useGraphics(props.initialSlots, canvas, containerRef.current, props.assets);
    
    const [modelState, setModelState] = useState<ModelState>("waitForInput");
    const [isPointer, setIsPointer] = useState(false);
    const [cameraPosition, setCameraPosition] = useState<CameraPosition>("front");

    const [editableInventory, setEditableInventory] = useState<null | SlotInfo[]>(null);
    const [pocket, setPocket] = useState<Coin[]>(props.initialWallet);
    const [isPocketVisible, setIsPocketVisible] = useState(false);
   

    const addSlot = useCallback(() => {
        setEditableInventory(prev => {
            if(!prev) return null;

            const freeSlot = new Array(Model.TOTAL_SLOTS).fill(null).map((_, i) => i + 1).filter(slot => !prev.find(item => item.slot === slot))[0]

            if(!freeSlot) return prev;

            return [
                ...prev,
                {
                    color: 0xffffff,
                    count: 1,
                    price: 1,
                    slot: freeSlot
                }
            ]
        })
    }, [])

    const changeSlot = useCallback((index: number, info: SlotInfo) => {
        setEditableInventory(prev => {
            if(!prev) return null;

            const next = prev.slice(0);

            next[index] = info;

            return next;
        })
    }, [])

    const deleteSlot = useCallback((index: number) => {
        setEditableInventory(prev => {
            if(!prev) return null;
            
            const next = prev.slice(0);

            next.splice(index, 1);

            return next;
        })
    }, [])

    const updateInventory = useCallback((nextSlots: SlotInfo[]) => {
        if(!view) return;
        model.setSlots(nextSlots);

        view.clearSlots();
        for(const slot of nextSlots) {
            view.setSlot(slot.slot, slot.color, slot.count);
        }

        setEditableInventory(null);
    }, [view, model])

    const closeEditor = useCallback(() => {
        setEditableInventory(null);
    }, [])

    const selectCoin = useCallback((index: number, coin: Coin) => {
        if(model.getState() !== "acceptingCoins") return;
        setPocket(prev => prev.slice(0, index).concat(prev.slice(index + 1)));
        model.insertCoin(coin);
        view?.insertCoin();
    }, [model, view])

    useEffect(() => {
        const sub = model.addEventListener((e) => {
            switch(e.type) {
                case "stateChange":
                    setModelState(e.state)
                    break;

                case "returnCash":
                    setPocket(prev => prev.concat(e.coins))
                    break;
            }
        })

        return () => {
            sub.unsubscribe();
        }
    }, [model])

    useEffect(() => {
        if(!view) return;

        const sub = view.addEventListener((e) => {
            switch(e.type) {
                case "keyHover":
                    setIsPointer(true);
                    break;
                
                case "keyLeave":
                    setIsPointer(false);
                    break;

                case "cameraChange":
                    setCameraPosition(e.position);
                    break;

                case "glassClick":
                    view.setCameraPosition("front");
                    setEditableInventory(model.getSlots());
                    setIsPointer(false);
                    break;
            }
        });

        return () => {
            sub.unsubscribe();
        }
    }, [model, view])

    return (
        <div className={cn.root} ref={containerRef} style={{ cursor: isPointer ? "pointer" : "default" }}>
            <canvas ref={setCanvas} />
            {cameraPosition !== "front" && <div className={cn.back} onClick={() => view?.setCameraPosition("front")}></div>}

            <Coins isOpen={(cameraPosition === "numpad" && modelState === "acceptingCoins") || isPocketVisible} coins={pocket} onSelect={selectCoin} />
            
            <button className={cn.wallet} onClick={() => setIsPocketVisible(p => !p)}>
                <WalletIcon />
            </button>

            {editableInventory && (
                <InventoryEditing 
                    value={editableInventory} 
                    maxItems={15}
                    canAdd={editableInventory.length < Model.TOTAL_SLOTS} 
                    
                    onSlotAdd={addSlot} 
                    onSlotChange={changeSlot} 
                    onSlotDelete={deleteSlot}

                    onSubmit={updateInventory}
                    onClose={closeEditor} 
                />
            )}
        </div>
    )
}