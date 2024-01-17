import { FC, memo } from "react";

import { SlotInfo } from "@/src/graphics/model";

import { SlotCard } from "./slot-card.component";

import cn from "./inventory-editing.module.scss";

export type InventoryEditingProps = {
    value: SlotInfo[];
    canAdd?: boolean;
    maxItems: number;

    onSlotAdd: VoidFunction;
    onSlotChange: (index: number, update: Partial<SlotInfo>) => void;
    onSlotDelete: (index: number) => void;

    onSubmit: (next: SlotInfo[]) => void;
    onClose: VoidFunction;
};

export const InventoryEditing: FC<InventoryEditingProps> = memo((props) => {
    return (
        <div className={cn.root}>
            <button title="Exit" className={cn.exit} onClick={props.onClose}>
                x
            </button>
            <div className={cn.container}>
                {props.value.map((slot, i) => (
                    <SlotCard
                        key={slot.slot}
                        index={i}
                        maxItems={props.maxItems}
                        info={slot}
                        onChange={props.onSlotChange}
                        onDelete={props.onSlotDelete}
                    />
                ))}
                {props.canAdd && (
                    <div className={cn["add-slot"]} onClick={props.onSlotAdd}>
                        +
                    </div>
                )}
            </div>
            <div className={cn["submit-container"]}>
                <button
                    className={cn.submit}
                    onClick={() => props.onSubmit(props.value)}
                >
                    Submit
                </button>
            </div>
        </div>
    );
});
