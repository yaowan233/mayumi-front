import type {ReactNode} from "react";
import {Card, Skeleton} from "@heroui/react";

const panel = "rounded-2xl border border-zinc-200/80 bg-white/70 p-5 dark:border-white/[0.08] dark:bg-white/[0.025]";

function Block({className = ""}: {className?: string}) {
    return <Skeleton animationType="pulse" className={`rounded-lg motion-reduce:animate-none ${className}`}/>;
}

function LoadingFrame({children, className = "", label = "正在加载页面"}: {children: ReactNode; className?: string; label?: string}) {
    return <div role="status" aria-busy="true" className={`page-skeleton w-full ${className}`}>
        <span className="sr-only">{label}</span><div aria-hidden="true">{children}</div>
    </div>;
}

function TextLines() {
    return <div className="space-y-3"><Block className="h-4 w-full"/><Block className="h-4 w-5/6"/><Block className="h-4 w-2/3"/></div>;
}

function Field() {
    return <div className="min-w-0 space-y-2"><Block className="h-4 w-24 max-w-full"/><Block className="h-10 w-full"/></div>;
}

function ManagementHeader() {
    return <div className="space-y-3 border-b border-default-200 pb-6 dark:border-white/5">
        <Block className="h-4 w-40"/><Block className="h-9 w-52 max-w-full"/><Block className="h-5 w-full max-w-xl"/>
    </div>;
}

function ActionBar() {
    return <div className="flex flex-wrap items-center justify-between gap-4"><Block className="h-4 w-72 max-w-full"/><div className="flex flex-wrap gap-3"><Block className="h-10 w-24"/><Block className="h-10 w-32"/></div></div>;
}

export function OverviewSkeleton() {
    return <LoadingFrame className="mx-auto max-w-7xl px-2 pb-10" label="正在加载比赛主页">
        <div className="flex flex-col gap-6">
            <div className={`${panel} overflow-hidden !p-0`}>
                <Block className="aspect-video w-full !rounded-none md:aspect-[21/9]"/>
                <div className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-end md:p-8">
                    <div className="min-w-0 flex-1 space-y-3">
                        <Block className="h-6 w-3/4 md:h-9"/><Block className="h-4 w-5/6"/>
                        <div className="flex gap-2"><Block className="h-6 w-16"/><Block className="h-6 w-48 max-w-full"/></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:flex"><Block className="h-10 md:h-11 md:w-28"/><Block className="h-10 md:h-11 md:w-28"/></div>
                </div>
            </div>
            <Card className="overflow-hidden border border-zinc-200/80 bg-white/95 dark:border-white/[0.06] dark:bg-zinc-900/70">
                <Card.Content className="divide-y divide-zinc-200 p-0 dark:divide-white/[0.06]">
                {[0, 1, 2, 3].map(i => <section key={i} className="space-y-4 px-6 py-6 md:px-8 md:py-7">
                    <Block className="h-6 w-28"/><TextLines/>{(i === 0 || i === 3) && <Block className="h-12 w-full"/>}
                </section>)}
                </Card.Content>
            </Card>
        </div>
    </LoadingFrame>;
}

export function RulesSkeleton() {
    return <LoadingFrame className="mx-auto max-w-5xl px-4 py-8" label="正在加载赛事规则">
        <div className="mb-6 flex items-center gap-4 px-2"><Block className="size-12 shrink-0"/><div className="space-y-2"><Block className="h-9 w-36"/><Block className="h-4 w-44"/></div></div>
        <div className="space-y-8 px-6 py-8 sm:px-8">{[0, 1, 2].map(i => <section key={i} className="space-y-4"><Block className="h-6 w-36"/><TextLines/></section>)}</div>
    </LoadingFrame>;
}

export function ParticipantsSkeleton() {
    // Only reserve the shared tab/toolbar until the team/solo roster is known.
    // Team cards and solo registration cards have different, data-dependent heights.
    return <LoadingFrame className="mx-auto max-w-7xl" label="正在加载参赛成员">
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-4 border-b border-zinc-200 px-1 dark:border-white/[0.08]">
            <Block className="h-5 w-28"/><Block className="my-2 h-8 w-32"/>
        </div>
    </LoadingFrame>;
}

export function StaffSkeleton() {
    return <LoadingFrame className="mx-auto max-w-7xl px-4 py-8" label="正在加载工作人员">
        <div className="mb-14 space-y-3 border-b border-zinc-200 pb-8 dark:border-white/[0.08]"><Block className="mx-auto h-10 w-60 max-w-full"/><Block className="mx-auto h-4 w-52 max-w-full"/></div>
        <div className="space-y-12">{[0, 1].map(role => <section key={role} className="space-y-5">
            <div className="flex items-center gap-3 border-b border-zinc-200 pb-3 dark:border-white/[0.08]"><Block className="h-7 w-1.5"/><Block className="h-7 w-32"/><Block className="h-6 w-8"/></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className={`${panel} flex flex-col items-center gap-3 !rounded-xl !px-3 !py-5`}><Block className="size-20 !rounded-full"/><Block className="h-6 w-20 max-w-full"/></div>)}
            </div>
        </section>)}</div>
    </LoadingFrame>;
}

export function ScheduleSkeleton() {
    // The selected view can be a lobby, match list, or bracket. Reserve its
    // navigation area without assuming a particular content layout.
    return <LoadingFrame label="正在加载赛程"><div className="flex h-12 items-center justify-center"><Block className="h-8 w-60 max-w-full"/></div></LoadingFrame>;
}

function TableRows({rows = 5}: {rows?: number}) {
    return <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-white/5">
        <div className="min-w-[640px]">
            {Array.from({length: rows + 1}, (_, row) => <div key={row} className={`grid grid-cols-[3rem_2fr_repeat(4,1fr)] gap-4 px-4 py-3 ${row === 0 ? "bg-default-100" : "border-t border-zinc-200/70 dark:border-white/[0.06]"}`}>
                {[0, 1, 2, 3, 4, 5].map(col => <Block key={col} className="h-4 w-3/4"/>)}
            </div>)}
        </div>
    </div>;
}

export function LeaderboardSkeleton() {
    return <LoadingFrame label="正在加载排行榜"><TableRows/></LoadingFrame>;
}

export function StatsSkeleton() {
    return <LoadingFrame label="正在加载统计数据">
        <div className="flex flex-col gap-6"><RoundTabsSkeleton/>
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-4">
                <section className="space-y-4"><Block className="h-8 w-40"/><TableRows/></section>
                <section className="space-y-4"><Block className="h-8 w-40"/><div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className={`${panel} h-[500px] overflow-hidden !p-0`}><Block className="h-[140px] !rounded-none"/><div className="space-y-5 p-4">{[0, 1, 2, 3, 4].map(row => <Block key={row} className="h-8"/>)}</div></div>)}</div></section>
            </div>
        </div>
    </LoadingFrame>;
}

export function TournamentListSkeleton() {
    return <LoadingFrame label="正在加载赛事列表">
        <section className="mb-16 space-y-6">
            <Block className="h-8 w-44"/>
            <div className={`${panel} grid overflow-hidden !p-0 md:grid-cols-[1.55fr_1fr]`}>
                <Block className="aspect-video !rounded-none"/>
                <div className="flex flex-col justify-between gap-6 p-5 md:p-6"><div className="space-y-4"><Block className="h-6 w-28"/><Block className="h-8 w-4/5"/><TextLines/></div><Block className="h-5 w-32"/></div>
            </div>
        </section>
        <section className="space-y-7">
            <div className="space-y-4 border-b border-zinc-200 pb-5 dark:border-white/10"><ActionBar/><div className="flex flex-wrap gap-2">{[0, 1, 2, 3].map(i => <Block key={i} className="h-8 w-16 !rounded-full"/>)}</div></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[0, 1, 2, 3].map(i => <div key={i} className={`${panel} overflow-hidden !rounded-xl !p-0`}><Block className="aspect-video !rounded-none"/><div className="space-y-3 px-4 py-3"><Block className="h-4 w-full"/><Block className="h-4 w-2/3"/></div></div>)}</div>
        </section>
    </LoadingFrame>;
}

export function MemberEditorSkeleton() {
    return <LoadingFrame label="正在加载成员信息"><div className="space-y-6">
        <RoundTabsSkeleton editing/>
        <div className={`${panel} space-y-8 !p-10 sm:!p-12`}><div className="border-b border-default-100 pb-6 dark:border-white/5"><ActionBar/></div><div className="flex min-h-[100px] flex-wrap gap-4">{[0, 1, 2].map(i => <div key={i} className="flex h-14 items-center gap-3 rounded-xl border border-default-200 px-3 py-1.5 dark:border-white/10"><Block className="size-10 !rounded-full"/><div className="space-y-2"><Block className="h-4 w-20"/><Block className="h-3 w-12"/></div></div>)}</div></div>
    </div></LoadingFrame>;
}

export function BracketExportSkeleton() {
    return <LoadingFrame label="正在加载比赛端配置"><div className="space-y-6">
        <ActionBar/>
        <div className={`${panel} divide-y divide-zinc-200 !p-0 dark:divide-white/10`}>
            <div className="space-y-2 p-5"><Block className="h-7 w-32"/><Block className="h-4 w-3/4"/></div>
            {[0, 1, 2].map(i => <div key={i} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_9rem_9rem] sm:items-center"><div className="space-y-2"><Block className="h-5 w-32"/><Block className="h-4 w-3/4"/></div><Field/><Field/></div>)}
        </div>
        <div className={`${panel} space-y-5`}><Block className="h-7 w-40"/><div className="grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map(i => <Field key={i}/>)}</div></div>
    </div></LoadingFrame>;
}

export function DrawManagementSkeleton() {
    return <LoadingFrame label="正在加载对阵管理"><div className="space-y-6"><ActionBar/>
        <div className={`${panel} space-y-5`}><Block className="h-6 w-32"/><div className="w-60 max-w-full"><Field/></div><TextLines/><div className="flex flex-wrap gap-4"><Block className="h-10 w-60 max-w-full"/><Block className="h-10 w-36"/></div><div className="grid gap-2 md:grid-cols-2">{[0, 1, 2, 3].map(i => <Block key={i} className="h-12"/>)}</div><Block className="h-10 w-32"/></div>
    </div></LoadingFrame>;
}

export function ManagementSkeleton({page}: {page: "meta" | "round" | "scheduler" | "statistics" | "team"}) {
    return <LoadingFrame className={`mx-auto px-4 pb-32 ${page === "meta" ? "max-w-5xl pt-10" : page === "round" ? "max-w-5xl pt-8" : "max-w-7xl pt-8"}`}>
        <div className="space-y-8"><ManagementHeader/>
            {page === "meta" && <div className="space-y-6">
                <Card className="overflow-hidden">
                    <Card.Header className="border-b border-default-200 px-6 py-4 dark:border-white/5"><Block className="h-6 w-40"/></Card.Header>
                    <Card.Content className="space-y-6 p-6">
                        <div className="grid gap-6 md:grid-cols-2"><Field/><Field/></div>
                        <div className="space-y-3"><Block className="h-4 w-24"/><Block className="aspect-video w-full max-w-xl"/><Block className="h-10 w-28"/><Block className="h-3 w-3/4"/><Field/></div>
                        <div className="rounded-xl border border-default-200 p-4 dark:border-white/10"><div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-end"><Block className="h-11 w-16"/><Field/></div></div>
                        <div className="grid gap-6 md:grid-cols-2"><Field/><Field/></div><Field/>
                        <div className="grid gap-6 md:grid-cols-2"><Field/><Field/></div>
                        <div className="space-y-4 rounded-xl bg-default-100 p-4"><Block className="h-4 w-24"/><div className="grid gap-6 md:grid-cols-2"><Field/><Field/></div></div>
                    </Card.Content>
                </Card>
                <div className={`${panel} space-y-6 !p-10`}><Block className="h-6 w-40"/><Block className="h-24"/><Block className="h-64"/></div>
            </div>}
            {page === "round" && <div className="space-y-6">{[0, 1, 2].map(i => <Card key={i}><Card.Header className="flex flex-row items-center gap-3 border-b border-default-200 px-6 py-4 dark:border-white/5"><Block className="size-6 !rounded-full"/><Block className="h-6 w-28"/></Card.Header><Card.Content className="p-6"><div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-12">{[4, 3, 3, 2].map((span, idx) => <div key={idx} className={span === 4 ? "lg:col-span-4" : span === 3 ? "lg:col-span-3" : "lg:col-span-2"}><Field/></div>)}</div></Card.Content></Card>)}<Block className="h-16"/></div>}
            {page === "scheduler" && <div className="space-y-6"><RoundTabsSkeleton editing/><div className="space-y-4">{[0, 1, 2].map(i => <div key={i} className={`${panel} flex items-center justify-between !px-6 !py-5`}><div className="space-y-2"><Block className="h-6 w-44"/><Block className="h-3 w-32"/></div><Block className="h-6 w-20"/></div>)}<Block className="h-10"/></div></div>}
            {page === "statistics" && <div className="space-y-6"><RoundTabsSkeleton editing/>
                <div className={`${panel} space-y-6 !rounded-xl !p-10`}><div className="flex gap-3"><Block className="size-10"/><div className="space-y-2"><Block className="h-6 w-44"/><Block className="h-4 w-36"/></div></div><div className="rounded-lg bg-default-100 p-4"><TextLines/></div><Block className="h-12 w-40"/></div>
                <div className={`${panel} space-y-6 !rounded-xl !p-10`}><ActionBar/><TableRows/></div>
            </div>}
            {page === "team" && <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">{[0, 1].map(i => <div key={i} className={`${panel} space-y-6 !p-8`}>
                <div className="flex gap-4"><Block className="size-20 shrink-0 !rounded-full"/><div className="min-w-0 flex-1 space-y-3"><Block className="h-7 w-28 max-w-full"/><Field/><Block className="h-4 w-20"/><Block className="size-28 max-w-full"/><Block className="h-10 w-28 max-w-full"/><Block className="h-3 w-3/4"/><Field/></div></div>
                <div className="space-y-6 border-t border-default-200 pt-4 dark:border-white/10"><Field/><Field/><Field/></div>
            </div>)}</div>}
            {page !== "statistics" && <div className={panel}><ActionBar/></div>}
        </div>
    </LoadingFrame>;
}

export function ManagementListSkeleton() {
    return <LoadingFrame label="正在加载可管理赛事"><div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className={`${panel} space-y-5 !p-6`}><div className="flex justify-between gap-3"><Block className="h-7 w-2/3"/><Block className="h-6 w-16"/></div><div className="flex gap-2"><Block className="h-6 w-16"/><Block className="h-6 w-16"/></div><Block className="h-4 w-28"/></div>)}</div></LoadingFrame>;
}

export function DashboardSkeleton() {
    return <LoadingFrame className="mx-auto max-w-7xl px-4 py-8" label="正在加载管理控制台"><div className="space-y-8"><div className="space-y-2"><Block className="h-9 w-48"/><Block className="h-6 w-64 max-w-full"/></div><div className={panel}><ActionBar/></div><div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[0, 1, 2, 3, 4, 5].map(i => <div key={i} className={`${panel} space-y-4 !p-10`}><Block className="size-12"/><Block className="h-7 w-28"/><Block className="h-4 w-full"/></div>)}</div></div></LoadingFrame>;
}

function RoundTabsSkeleton({editing = false}: {editing?: boolean}) {
    return <div className={`flex h-12 items-center gap-6 overflow-hidden ${editing ? "" : "justify-start border-b border-zinc-200 px-6 dark:border-white/[0.08] md:justify-center md:px-0"}`}>
        {[0, 1, 2, 3].map(i => <Block key={i} className="h-5 w-20 shrink-0"/>)}
    </div>;
}

export function MappoolSkeleton() {
    return <div role="status" aria-busy="true" className="page-skeleton w-full">
        <span className="sr-only">正在加载图池</span>
        <div aria-hidden="true">
            <RoundTabsSkeleton/>
            <div className="mx-auto w-full max-w-7xl px-4 py-8">
                <div className="mb-6 flex flex-wrap justify-end gap-3">
                    <Block className="h-10 w-28"/><Block className="h-10 w-[210px]"/>
                </div>
                <div className="flex flex-col gap-12">
                    {[0, 1].map(group => <div key={group} className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <Block className="h-8 w-1.5"/><Block className="h-9 w-36"/>
                            <div className="h-px flex-1 bg-zinc-200 dark:bg-white/[0.08]"/>
                        </div>
                        <div className="flex w-full flex-wrap justify-center gap-6">
                            {[0, 1, 2].map(i => <div key={i} className="flex h-[210px] w-full flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white/70 p-4 dark:border-white/[0.06] dark:bg-zinc-950 sm:w-[380px]">
                                <div className="flex justify-between"><Block className="h-7 w-16 !rounded-full"/><Block className="h-7 w-14"/></div>
                                <div className="space-y-2">
                                    <Block className="h-6 w-4/5"/>
                                    <div className="flex justify-between"><Block className="h-4 w-1/2"/><Block className="h-3 w-1/4"/></div>
                                    <div className="grid grid-cols-4 gap-2">{[0, 1, 2, 3].map(stat => <Block key={stat} className="h-6"/>)}</div>
                                </div>
                            </div>)}
                        </div>
                    </div>)}
                </div>
            </div>
        </div>
    </div>;
}

export function MappoolEditorSkeleton() {
    return <div role="status" aria-busy="true" className="page-skeleton mx-auto w-full max-w-7xl px-4 pb-32 py-8">
        <span className="sr-only">正在加载图池管理</span>
        <div aria-hidden="true" className="space-y-8">
            <div className="space-y-3 border-b border-zinc-200 pb-6 dark:border-white/5">
                <Block className="h-4 w-40"/><Block className="h-9 w-44"/><Block className="h-5 w-full max-w-lg"/>
            </div>
            <div className="space-y-6">
                <RoundTabsSkeleton editing/>
                <div className={`${panel} space-y-4`}>
                    <Block className="h-5 w-44"/><Block className="h-4 w-2/3"/><Block className="h-24 w-full"/>
                    <div className="flex justify-end gap-3"><Block className="h-10 w-32"/><Block className="h-10 w-28"/></div>
                </div>
                <div className="grid grid-cols-1 justify-items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2].map(i => <div key={i} className={`${panel} w-full max-w-[420px] overflow-hidden !p-0`}>
                        <Block className="h-32 !rounded-none"/>
                        <div className="space-y-4 p-4">
                            <div className="grid grid-cols-4 gap-3">{[0, 1, 2].map(field => <div key={field} className={`space-y-2 ${field === 0 ? "col-span-2" : ""}`}><Block className="h-4 w-3/4"/><Block className="h-10"/></div>)}</div>
                            <Block className="h-5 w-24"/><Block className="h-3 w-2/3"/>
                        </div>
                    </div>)}
                </div>
            </div>
        </div>
    </div>;
}
