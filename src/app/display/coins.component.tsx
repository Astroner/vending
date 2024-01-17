import { FC, memo } from "react";

import type { Coin } from "@/src/graphics/model";

import cn from "./display.module.scss";

export type CoinsProps = {
    isOpen?: boolean;
    coins: Coin[];
    onSelect: (index: number, coin: Coin) => void;
}

export const Coins: FC<CoinsProps> = memo(props => {
    return (
        <div className={props.isOpen ? cn['pocket--open'] : cn['pocket--closed']}>
            <div className={cn['coins-container']}>
                {props.coins.map((value, i) => (
                    <div 
                        className={cn.coin} 
                        key={i} 
                        onClick={() => props.onSelect(i, value)}
                    >
                        {value}
                    </div>
                ))}
            </div>
        </div>
    )
})