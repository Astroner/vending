"use client"

import { FC, useEffect, useRef, useState } from "react";

import { CanvasView } from "../graphics/view";
import { Assets } from "../graphics/types";

export interface DisplayProps {
    assets: Assets
}

export const Display: FC<DisplayProps> = props => {
    const ref = useRef<HTMLCanvasElement>(null);

    const [canvas, setCanvas] = useState<HTMLCanvasElement>();
  
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
            height: window.innerHeight
        })

        view.start()

        return () => {
            view.destroy();
        }
  
    }, [canvas, props.assets])


    return (
        <div>
            <canvas ref={ref} />
        </div>
    )
}