"server-only";

import { SlotInfo } from "../graphics/model";

// Mock function to request data
export const requestDBData = async (): Promise<SlotInfo[]> => {
    return [
        {
            slot: 2,
            color: 0xff00ff,
            count: 12,
            price: 20,
        },
        {
            slot: 12,
            color: 0xffdd11,
            count: 2,
            price: 3,
        },
    ];
};
