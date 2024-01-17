"use server"

import { requestDBData } from "../helpers/request-db-data";
import { PreloadedDisplay } from "./display/preloaded-display.component";

export default async function Home() {

    const initialData = await requestDBData();

    return (
        <PreloadedDisplay initialSlots={initialData} initialWallet={[1, 2, 5, 10, 10, 10, 10]} />
    )
}
