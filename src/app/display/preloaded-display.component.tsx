"use client"

import dynamic from "next/dynamic";
import { FC } from "react";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";

import type { DisplayProps } from "./display.component";

import cn from "./display.module.scss";

export type PreloadedDisplayProps = Omit<DisplayProps, 'assets'>

const DynamicDisplay = dynamic(
    async () => {
        const { loadGLB, loadFont } = await import('../../helpers/asset-loaders')

        const [
            vendingGLB, 
            displayFont, 
            { Display }, 
            { parseVendingGLB }
        ] = await Promise.all([
            loadGLB("/assets/vending.glb"),
            loadFont("/assets/display-font.json"),
            import("./display.component"),
            import("../../helpers/parse-vending-glb")
        ]);

        const parsedVending = parseVendingGLB(vendingGLB);
    
        const DynamicDisplay: FC<PreloadedDisplayProps> = (props) => (
            <Display 
                {...props}
                assets={{ 
                    ...parsedVending, 
                    displayFont,
                }}
            />
        )

        return DynamicDisplay
    }, 
    {
        ssr: false,
        loading: (props) => {
            return (
                <div className={cn['loader-page']}>
                    <div>Loading Vending Machine</div>
                    <div className={cn.loader} />
                </div>
            )
        },
    }
)

export const PreloadedDisplay: FC<PreloadedDisplayProps> = props => {
    return (
        <ErrorBoundary errorComponent={(err) => <div>{err.error.message}</div>}>
            <DynamicDisplay {...props} />
        </ErrorBoundary>
    )
}