import { FC, memo } from "react";

import cn from "./number-input.module.scss";

export type NumberInputProps = {
    value: number;

    min?: number;
    max?: number;

    onChange: (next: number) => void;
}

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max)

export const NumberInput: FC<NumberInputProps> = memo(props => {
    
    const decrement = () => {
        const nextValue = clamp(props.value - 1, props.min ?? -Infinity, props.max ?? Infinity);

        if(nextValue !== props.value) props.onChange(nextValue);
    }

    const increment = () => {
        const nextValue = clamp(props.value + 1, props.min ?? -Infinity, props.max ?? Infinity);

        if(nextValue !== props.value) props.onChange(nextValue);
    }

    return (
        <div className={cn.root}>
            <button className={cn.decrement} onClick={decrement} />

            <div className={cn.value}>
                {props.value}
            </div>

            <button className={cn.increment} onClick={increment} />
        </div>
    )
})