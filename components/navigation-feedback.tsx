"use client";

import {useLinkStatus} from "next/link";

export function NavigationFeedback() {
    const {pending} = useLinkStatus();
    return <span aria-hidden="true" className="navigation-feedback" data-pending={pending}/>;
}
