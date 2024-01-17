import { FC, memo, useCallback, useMemo, useState } from "react";
import { SketchPicker, ColorChangeHandler } from "react-color";

import { SlotInfo } from "@/src/graphics/model";

import cn from "./inventory-editing.module.scss";
import { ClickAwayListener } from "@/src/helpers/click-away-listener.component";
import { NumberInput } from "@/src/helpers/number-input/number-input.component";

export type SlotCardProps = {
    index: number;
    info: SlotInfo;

    maxItems: number;

    onChange: (index: number, info: Partial<SlotInfo>) => void;
    onDelete: (index: number) => void;
};

export const SlotCard: FC<SlotCardProps> = memo(({ onChange, ...props }) => {
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const colorString = useMemo(() => {
        return "#" + props.info.color.toString(16);
    }, [props.info.color]);

    const colorChange = useCallback<ColorChangeHandler>(
        (e) => {
            const asNumber = Number.parseInt(e.hex.slice(1), 16);

            onChange(props.index, {
                color: asNumber,
            });
        },
        [onChange, props.index],
    );

    const closePicker = useCallback(() => {
        setIsPickerOpen(false);
    }, []);

    const changePrice = useCallback(
        (price: number) => {
            onChange(props.index, {
                price,
            });
        },
        [onChange, props.index],
    );

    const changeItems = useCallback(
        (count: number) => {
            onChange(props.index, {
                ...props.info,
                count,
            });
        },
        [onChange, props.index, props.info],
    );

    return (
        <div className={cn.slot}>
            <div className={cn.slot__number}>{props.info.slot}</div>
            <div className={cn.slot__content}>
                <div
                    style={{ background: colorString }}
                    className={cn.slot__color}
                    onClick={() => setIsPickerOpen(true)}
                >
                    {isPickerOpen && (
                        <ClickAwayListener onClickAway={closePicker}>
                            <SketchPicker
                                disableAlpha
                                color={colorString}
                                onChangeComplete={colorChange}
                                className={cn.slot__picker}
                            />
                        </ClickAwayListener>
                    )}
                </div>
                <div className={cn.slot__numerics}>
                    <div className={cn.slot__input}>
                        <div className={cn.slot__input__label}>Items</div>
                        <NumberInput
                            min={1}
                            max={props.maxItems}
                            value={props.info.count}
                            onChange={changeItems}
                        />
                    </div>
                    <div className={cn.slot__input}>
                        <div className={cn.slot__input__label}>Price</div>
                        <NumberInput
                            min={1}
                            max={999}
                            value={props.info.price}
                            onChange={changePrice}
                        />
                    </div>
                </div>
            </div>
            <button
                title="Delete"
                className={cn.slot__delete}
                onClick={() => props.onDelete(props.index)}
            >
                x
            </button>
        </div>
    );
});
