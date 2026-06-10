"use client";

import {FC} from "react";
import {VisuallyHidden} from "@react-aria/visually-hidden";
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

export const ThemeSwitch: FC<ThemeSwitchProps> = ({
                                                      className,
                                                      classNames,
}) => {
    const {resolvedTheme, setTheme} = useTheme();
    const isLight = resolvedTheme === "light";

    const onChange = () => {
        setTheme(isLight ? "dark" : "light");
    };

    return (
        <button
            type="button"
            aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
            className={clsx(
                "px-px cursor-pointer transition-all duration-150 hover:opacity-80 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-md",
                className,
                classNames?.base
            )}
            onClick={onChange}
        >
            <VisuallyHidden>
                <input type="checkbox" checked={isLight} readOnly />
            </VisuallyHidden>
            <div
                className={clsx(
                    "w-auto h-auto bg-transparent rounded-lg flex items-center justify-center text-default-500! pt-px px-0 mx-0",
                    classNames?.wrapper
                )}
            >
                {isLight ? <MoonFilledIcon size={22}/> : <SunFilledIcon size={22}/>}
            </div>
        </button>
    );
};
