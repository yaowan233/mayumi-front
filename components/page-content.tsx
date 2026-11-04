"use client";

import {useEffect, useRef, type ReactNode} from "react";
import {usePathname} from "next/navigation";

export function PageContent({children, className}: {children: ReactNode; className: string}) {
    const pathname = usePathname();
    const contentRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const animation = contentRef.current?.animate(
            [{opacity: 0.75}, {opacity: 1}],
            {duration: 180, easing: "ease-out"},
        );
        return () => animation?.cancel();
    }, [pathname]);

    return <main ref={contentRef} className={className}>{children}</main>;
}
