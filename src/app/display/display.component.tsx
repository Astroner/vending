"use client"

import { FC, useEffect, useMemo, useRef, useState } from "react";

import { CanvasView } from "../../graphics/view";
import { Assets } from "../../graphics/types";

import cn from "./display.module.scss";

export interface DisplayProps {
    assets: Assets
}

export const Display: FC<DisplayProps> = props => {
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
    
    const [isPointer, setIsPointer] = useState(false);

    const view = useMemo(() => {
        if(!canvas || !containerRef.current) return null;

        return new CanvasView({
            canvas: canvas,
            assets: props.assets,
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
            initialText: ""
        })
    }, [canvas, props.assets])

    useEffect(() => {
        if(!view) return;

        view.start();

        return () => {
            view.destroy();
        }
    }, [view])

    useEffect(() => {
        if(!view) return;

        const handler = () => {
            if(!containerRef.current) return;

            view.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        }

        window.addEventListener("resize", handler)

        return () => {
            window.removeEventListener("resize", handler);
        }
    }, [view])

    useEffect(() => {
        if(!view) return;

        let viewState = "";

        const items = [
            {
                slot: 1,
                color: 0xffffff,
                items: 30
            },
            {
                slot: 2,
                color: 0xff11ff,
                items: 2
            },
            {
                slot: 5,
                color: 0x000000,
                items: 3
            },
            {
                slot: 14,
                color: 0xff00ff,
                items: 6
            }
        ]

        for(const item of items) {
            view.setSlot(item.slot, "ss", item.color, item.items);
        }


        const sub = view.addEventListener((e) => {
            switch(e.type) {
                case "numberPressed":
                    if(viewState.length < 3) viewState += e.key + "";
                    break;
                
                case "resetPressed":
                    viewState = "";
                    break;

                case "okPressed":
                    viewState = "ok";
                    view.insertCoin();
                    view.openCloseHatch();
                    view.giveChange(15);

                    view.getCameraPosition() !== "front" && view.setCameraPosition("front");

                    break;

                case "numpadAreaClicked":
                    view.setCameraPosition("numpad");
                    break;

                case "keyHover":
                    setIsPointer(true);
                    break;

                case "keyLeave":
                    setIsPointer(false);
                    break;
            }

            view.setText(viewState);
        })

        return () => {
            sub.unsubscribe();
        }
    }, [view])


    return (
        <div className={cn.root} ref={containerRef} style={{ cursor: isPointer ? "pointer" : "default" }}>
            <canvas ref={setCanvas} />
        </div>
    )
}