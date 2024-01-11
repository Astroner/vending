import dynamic from "next/dynamic";
import { FC } from "react";

export const PreloadedDisplay = dynamic(
    async () => {
        const { loadAssets } = await import('../graphics/load-assets')

        const [assets, { Display }] = await Promise.all([
            loadAssets(),
            import("./display.component")
        ]);
    
    const PreloadedDisplay: FC = () => <Display assets={assets} />

    return PreloadedDisplay
}, {
    ssr: false,
    loading: () => {
        return <div>Loading</div>
    },
})