"use client"

import { FC, useEffect, useRef, useState } from "react";

import { CanvasView } from "../../graphics/view";
import { Assets } from "../../graphics/types";

import cn from "./display.module.scss";

export interface DisplayProps {
    assets: Assets
}

export const Display: FC<DisplayProps> = props => {
    const ref = useRef<HTMLCanvasElement>(null);

    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  
    useEffect(() => {
        if(!ref.current) return;

        setCanvas(ref.current);
    }, [])

    useEffect(() => {
        if(!canvas) return;

        const view = new CanvasView({
            canvas: canvas,
            assets: props.assets,
            width: window.innerWidth,
            height: window.innerHeight,
            initialText: ""
        })

        view.start();

        return () => {
            view.destroy();
        }
  
    }, [canvas, props.assets])


    return (
        <div className={cn.root}>
            <canvas ref={ref} />
        </div>
    )
}