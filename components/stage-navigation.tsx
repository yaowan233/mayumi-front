"use client";

import {useEffect, useRef, type ReactNode} from "react";

// Keep the current round visible without scrolling the page or stealing focus.
export function StageNavigation({activeStage, children, className}: {
    activeStage?: string;
    children: ReactNode;
    className: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const reveal = () => {
            const active = container.querySelector<HTMLElement>('[aria-current="true"]');
            if (!active) return;
            const bounds = container.getBoundingClientRect();
            const item = active.getBoundingClientRect();
            if (item.left < bounds.left || item.right > bounds.right) {
                container.scrollLeft += item.left - bounds.left - (bounds.width - item.width) / 2;
            }
        };
        reveal();
        const observer = new ResizeObserver(reveal);
        observer.observe(container);
        return () => observer.disconnect();
    }, [activeStage]);
    return <div ref={containerRef} className={className} aria-label="比赛轮次">{children}</div>;
}
