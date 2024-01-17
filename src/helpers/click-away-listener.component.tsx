import React, { useRef, useEffect, ReactNode, FC, memo } from "react";

interface ClickAwayListenerProps {
    children?: ReactNode;
    onClickAway: VoidFunction;
}

export const ClickAwayListener: FC<ClickAwayListenerProps> = memo(
    ({ onClickAway, children }) => {
        const ref: any = useRef(null);

        useEffect(() => {
            const handler = (event: MouseEvent) => {
                if (ref.current && !ref.current.contains(event.target)) {
                    onClickAway();
                }
            };

            document.addEventListener("click", handler);

            return () => document.removeEventListener("click", handler);
        }, [onClickAway]);

        return <div ref={ref}>{children}</div>;
    },
);
