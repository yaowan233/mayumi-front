"use client";

import {Button} from "@heroui/react";
import {useRouter} from "next/navigation";

export function TournamentLoadError({error}: {error: string}) {
    const router = useRouter();
    return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-white/10">
                    <svg className="h-8 w-8 text-zinc-400 dark:text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold text-zinc-700 dark:text-zinc-200">{error || "未找到数据"}</h1>
                <Button onPress={() => router.back()} variant="secondary">
                    返回上一页
                </Button>
            </div>
    );
}
