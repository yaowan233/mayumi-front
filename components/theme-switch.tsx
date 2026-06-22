"use client";

import {FC, useEffect, useMemo, useState} from "react";
import {useTheme} from "next-themes";
import clsx from "clsx";

import {SunFilledIcon, MoonFilledIcon} from "@/components/icons";

export interface ThemeSwitchProps {
    className?: string;
    classNames?: {
        base?: string;
        wrapper?: string;
    };
}

const SystemIcon = ({size = 22}: { size?: number }) => (
    <svg
        aria-hidden="true"
        focusable="false"
        height={size}
        role="presentation"
        viewBox="0 0 24 24"
        width={size}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
    >
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
    </svg>
);

const themeOptions = [
    {key: "light", label: "亮色", icon: <SunFilledIcon size={16}/>},
    {key: "dark", label: "暗色", icon: <MoonFilledIcon size={16}/>},
    {key: "system", label: "系统默认", icon: <SystemIcon size={16}/>},
] as const;

export const ThemeSwitch: FC<ThemeSwitchProps> = ({
                                                      className,
                                                      classNames,
}) => {
    const {theme, resolvedTheme, setTheme} = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const currentTheme = mounted ? theme || "system" : "system";
    const options = useMemo(
        () => themeOptions.map((option) => ({
            ...option,
            active: option.key === currentTheme,
        })),
        [currentTheme]
    );

    return (
        <div
            className={clsx(
                "inline-flex items-center gap-1 rounded-full border border-zinc-200/70 bg-white/60 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none",
                className,
                classNames?.base
            )}
            role="group"
            aria-label="主题切换"
        >
            {options.map((option) => (
                <button
                    key={option.key}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={option.active}
                    title={option.label}
                    className={clsx(
                        "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-all duration-150 hover:bg-zinc-200/70 hover:text-zinc-950 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white",
                        option.active && "bg-primary/12 text-primary shadow-[inset_0_0_0_1px_rgba(14,165,233,0.22)] dark:bg-white/12 dark:text-white dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)]",
                        classNames?.wrapper
                    )}
                    onClick={() => setTheme(option.key)}
                >
                    {option.icon}
                </button>
            ))}
        </div>
    );
};
