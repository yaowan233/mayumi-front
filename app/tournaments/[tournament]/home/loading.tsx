export default function Loading() {
    return (
            <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-2 pb-10">
                <div className="h-[280px] md:h-[420px] animate-pulse rounded-2xl bg-zinc-200/70 dark:bg-white/[0.06]" />
                <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-8 dark:border-white/[0.06] dark:bg-zinc-900/70">
                    <div className="h-6 w-32 animate-pulse rounded bg-zinc-200 dark:bg-white/10" />
                    <div className="mt-4 h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-white/10" />
                    <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-white/10" />
                    <div className="mt-6 h-10 w-40 animate-pulse rounded-lg bg-zinc-200 dark:bg-white/10" />
                </div>
            </div>
    );
}
