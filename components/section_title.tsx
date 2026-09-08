export const SectionTitle = ({
    title,
    count,
    live = false,
}: {
    title: string;
    count?: number;
    live?: boolean;
}) => (
    <div className="mb-6 mt-4 flex items-center gap-3 sm:mb-8 sm:justify-center sm:gap-4">
        <div className="h-px w-8 bg-zinc-300 dark:bg-white/15 sm:w-12" />
        <h2 className="shrink-0 whitespace-nowrap text-xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
            {title}
        </h2>
        {typeof count === "number" && (
            <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                {count}
            </span>
        )}
        {live && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                Live
            </span>
        )}
        <div className="h-px min-w-6 flex-1 bg-zinc-300 dark:bg-white/15 sm:w-12 sm:flex-none" />
    </div>
);


