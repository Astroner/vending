import { Controller } from "@/src/graphics/controller";
import { Model, SlotInfo } from "@/src/graphics/model";
import { Assets } from "@/src/graphics/types";
import { View } from "@/src/graphics/view";
import { useEffect, useMemo } from "react";

export const useGraphics = (
    initialSlots: SlotInfo[],
    canvas: HTMLCanvasElement | null,
    container: HTMLDivElement | null,
    assets: Assets
) => {
    const model = useMemo(() => {
        return new Model(initialSlots);
    }, [initialSlots])

    const view = useMemo(() => {
        if(!canvas || !container) return null;

        return new View({
            canvas: canvas,
            assets: assets,
            width: container.clientWidth,
            height: container.clientHeight,
            initialText: model.getDisplay()
        })
    }, [canvas, assets, model, container])

    const controller = useMemo(() => {
        if(!view) return null;

        return new Controller(model, view);
    }, [model, view]);

    useEffect(() => {
        if(!controller || !view || !container) return;

        controller.start();

        const handler = () => {
            view.setSize(container.clientWidth, container.clientHeight);

            if(container.clientWidth < 900) {
                view.setHighlight(false)
                view.setCameraAdjustments(false)
            } else {
                view.setHighlight(true)
                view.setCameraAdjustments(true)
            }
        }

        window.addEventListener("resize", handler);

        return () => {
            controller.stop();

            window.removeEventListener("resize", handler);
        }
    }, [controller, container, view])
    

    return { view, model }
}