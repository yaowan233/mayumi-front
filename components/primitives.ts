import {tv} from "tailwind-variants";

export const title = tv({
    base: "tracking-tight inline font-semibold",
    variants: {
        color: {
            violet: "from-[#FF1CF7] to-[#b249f8]",
            yellow: "from-[#FF705B] to-[#FFB457]",
            blue: "from-[#5EA2EF] to-[#0072F5]",
            cyan: "from-[#00b7fa] to-[#01cfea]",
            green: "from-[#6FEE8D] to-[#17c964]",
            pink: "from-[#FF72E1] to-[#F54C7A]",
            foreground: "dark:from-[#FFFFFF] dark:to-[#4B4B4B]",
        },
        size: {
            sm: "text-3xl lg:text-4xl",
            md: "text-[2.3rem] lg:text-5xl leading-9",
            lg: "text-4xl lg:text-6xl",
        },
        fullWidth: {
            true: "w-full block",
        },
    },
    defaultVariants: {
        size: "md",
    },
    compoundVariants: [
        {
            color: [
                "violet",
                "yellow",
                "blue",
                "cyan",
                "green",
                "pink",
                "foreground",
            ],
            class: "bg-clip-text text-transparent bg-linear-to-b",
        },
    ],
});

export const subtitle = tv({
    base: "w-full md:w-1/2 my-2 text-lg lg:text-xl text-default-600 block max-w-full",
    variants: {
        fullWidth: {
            true: "w-full!",
        },
    },
    defaultVariants: {
        fullWidth: true
    }
});


export const description_container = tv({
    base: "w-full md:w-1/2 my-2 text-lg lg:text-xl text-default-300 block max-w-full",
    variants: {
        fullWidth: {
            true: "w-full!",
        },
    },
    defaultVariants: {
        fullWidth: true
    }
});

export const panel = tv({
    base: "rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-zinc-950",
    variants: {
        tone: {
            default: "",
            soft: "bg-zinc-50/80 dark:bg-white/[0.04]",
            flat: "shadow-none",
        },
        padding: {
            none: "p-0",
            sm: "p-3",
            md: "p-4",
            lg: "p-5",
        },
    },
    defaultVariants: {
        tone: "default",
        padding: "md",
    },
});

export const sectionTitle = tv({
    base: "flex items-center gap-2 font-black tracking-normal text-zinc-950 dark:text-white",
    variants: {
        size: {
            sm: "text-base",
            md: "text-lg",
            lg: "text-xl",
        },
    },
    defaultVariants: {
        size: "md",
    },
});

export const sectionAccent = tv({
    base: "h-4 w-1 rounded-full bg-primary",
});

export const statLabel = tv({
    base: "text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400",
});

export const statValue = tv({
    base: "truncate font-mono text-sm font-black text-zinc-950 transition-colors dark:text-white",
    variants: {
        size: {
            sm: "text-sm",
            md: "text-base",
            lg: "text-2xl",
        },
        accent: {
            true: "text-primary",
        },
    },
    defaultVariants: {
        size: "sm",
    },
});
