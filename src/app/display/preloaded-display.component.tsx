import dynamic from "next/dynamic";
import { FC } from "react";
import { parseVendingGLB } from "../../helpers/parse-vending-glb";
import { loadFont } from "../../helpers/asset-loaders";

export const PreloadedDisplay = dynamic(
    async () => {
        const { loadGLB } = await import('../../helpers/asset-loaders')

        const [vendingGLB, displayFont, { Display }] = await Promise.all([
            loadGLB("/assets/vending.glb"),
            loadFont("/assets/display-font.json"),
            import("./display.component"),
        ]);

        const parsedVending = parseVendingGLB(vendingGLB);
    
        const PreloadedDisplay: FC = () => <Display assets={{ ...parsedVending, displayFont }} />

        return PreloadedDisplay
    }, 
    {
        ssr: false,
        loading: (props) => {
            return <div>Loading</div>
        },
    }
)