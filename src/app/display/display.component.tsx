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
                    break;
            }

            view.setText(viewState);
        })

        return () => {
            sub.unsubscribe();
        }
    }, [view])


    return (
        <div className={cn.root} ref={containerRef}>
            <canvas ref={setCanvas} />
        </div>
    )
}