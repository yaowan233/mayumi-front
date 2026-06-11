"use client";

import NextLink from "next/link";
import {useContext, useEffect, useRef, useState} from "react";

import CurrentUserContext from "@/app/user_context";
import {siteConfig} from "@/config/site";

export const UserStatus = () => {
    const currentUser = useContext(CurrentUserContext);
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: PointerEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [open]);

    if (!currentUser?.currentUser) {
        return (
            <a
                className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
                href={`https://osu.ppy.sh/oauth/authorize?client_id=${siteConfig.client_id}&redirect_uri=${siteConfig.web_url}/oauth&response_type=code&scope=public`}
            >
                登录
            </a>
        );
    }

    const user = currentUser.currentUser;

    return (
        <div className="relative" ref={menuRef}>
            <button
                type="button"
                aria-label={`用户菜单 - ${user.name}`}
                aria-expanded={open}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-white p-0.5 shadow-lg shadow-primary/10 transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 dark:bg-zinc-900"
                onClick={() => setOpen((value) => !value)}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={`https://a.ppy.sh/${user.uid}`}
                    alt={user.name}
                    className="h-full w-full rounded-full object-cover"
                />
            </button>

            {open && (
                <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white/95 py-2 text-sm text-zinc-900 shadow-2xl backdrop-blur-md dark:border-white/[0.08] dark:bg-zinc-950/95 dark:text-zinc-100">
                    <div className="border-b border-zinc-200 px-4 py-3 dark:border-white/[0.08]">
                        <p className="font-semibold text-zinc-500 dark:text-zinc-400">登录用户</p>
                        <p className="truncate font-bold text-primary">{user.name}</p>
                    </div>
                    <NextLink
                        className="block px-4 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                        href="/user-info"
                        onClick={() => setOpen(false)}
                    >
                        个人信息
                    </NextLink>
                    <NextLink
                        className="block px-4 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                        href="/tournament-management"
                        onClick={() => setOpen(false)}
                    >
                        管理后台
                    </NextLink>
                    <button
                        type="button"
                        className="mt-1 block w-full border-t border-zinc-200 px-4 py-2 text-left font-bold text-red-500 transition-colors active:bg-red-500/20 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:border-white/[0.08] dark:text-red-400"
                        onClick={async () => {
                            await fetch(`${siteConfig.backend_url}/api/logout`, {method: "POST", credentials: "include"});
                            currentUser?.setCurrentUser(null);
                            window.location.href = "/";
                        }}
                    >
                        登出
                    </button>
                </div>
            )}
        </div>
    );
};
