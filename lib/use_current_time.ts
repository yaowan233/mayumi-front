"use client";

import {useEffect, useState} from "react";

export function useCurrentTime(initialTime?: number) {
    const [now, setNow] = useState(() => initialTime ?? Date.now());
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);
    return now;
}
