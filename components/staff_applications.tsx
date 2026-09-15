"use client";

import {Avatar, Chip, EmptyState, Skeleton} from "@heroui/react";
import type {RegistrationInfo} from "@/components/homepage";

export type StaffApplication = RegistrationInfo & {name?: string | null; avatar_url?: string | null};

const positionLabels: Record<string, string> = {
    referee: "裁判", streamer: "直播", commentator: "解说", mappooler: "选图", custom_mapper: "作图",
    graphic_designer: "设计", scheduler: "时间安排", map_tester: "测图", donator: "赞助",
};

export function StaffApplications({applications}: {applications: StaffApplication[]}) {
    if (!applications.length) return <EmptyState>暂无 Staff 申请</EmptyState>;
    return <div className="grid gap-4 xl:grid-cols-2">
        {applications.map(application => <article key={application.uid} className="min-w-0 overflow-hidden rounded-2xl border border-default-200 bg-surface dark:border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-default-200 px-5 py-4 dark:border-white/10">
                <a href={`https://osu.ppy.sh/users/${application.uid}`} target="_blank" rel="noreferrer" className="group flex min-w-0 items-center gap-3">
                    <Avatar className="size-12 shrink-0 rounded-xl">
                        <Avatar.Image src={application.avatar_url || `https://a.ppy.sh/${application.uid}`} alt={application.name || "申请者头像"}/>
                        <Avatar.Fallback>{application.name?.slice(0, 2) || "?"}</Avatar.Fallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="break-words font-bold text-foreground group-hover:text-primary">{application.name || "用户名暂不可用"}</p>
                        <p className="mt-1 text-xs text-default-500">osu! ID {application.uid} · 查看玩家资料 ↗</p>
                    </div>
                </a>
                <Chip size="sm" variant="soft">{application.isFirstTimeStaff === undefined ? "经历未填写" : application.isFirstTimeStaff ? "首次担任 Staff" : "有 Staff 经历"}</Chip>
            </div>
            <div className="space-y-5 p-5">
                <div className="flex flex-wrap gap-2">{application.selectedPositions.map(position => <Chip key={position} size="sm" color="accent" variant="soft">{positionLabels[position] || position}</Chip>)}</div>
                <dl className="space-y-4 text-sm">
                    {[
                        ["QQ", application.qqNumber], ["赛事经历", application.tournamentExperience],
                        ["其他说明", application.otherDetails], ["补充备注", application.additionalComments],
                    ].map(([label, value]) => <div key={label} className="space-y-1.5"><dt className="text-xs font-semibold text-default-500">{label}</dt><dd className="whitespace-pre-wrap break-words leading-relaxed text-foreground">{value?.trim() || "未填写"}</dd></div>)}
                </dl>
            </div>
        </article>)}
    </div>;
}

export function StaffApplicationsSkeleton() {
    return <div role="status" aria-busy="true"><span className="sr-only">正在加载 Staff 申请</span>
        <div aria-hidden="true" className="grid gap-4 xl:grid-cols-2">{[0, 1].map(i => <div key={i} className="rounded-2xl border border-default-200 bg-surface dark:border-white/10">
            <div className="flex items-center gap-3 border-b border-default-200 px-5 py-4 dark:border-white/10"><Skeleton className="size-12 shrink-0 rounded-xl"/><div className="space-y-2"><Skeleton className="h-5 w-32"/><Skeleton className="h-3 w-40"/></div></div>
            <div className="space-y-5 p-5"><Skeleton className="h-6 w-32"/>{[0, 1, 2, 3].map(field => <div key={field} className="space-y-2"><Skeleton className="h-3 w-20"/><Skeleton className="h-4 w-3/4"/></div>)}</div>
        </div>)}</div>
    </div>;
}
