import {BracketExport} from "@/components/bracket_export";
import {ManagementBackLink} from "@/components/management_back_link";

export default async function BracketExportPage({params}: {params: Promise<{tournament: string}>}) {
    const tournament = decodeURIComponent((await params).tournament);
    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 pb-20">
            <div className="flex flex-col gap-2 border-b border-default-200 pb-6 dark:border-white/10">
                <ManagementBackLink tournament={tournament}/>
                <h1 className="text-3xl font-black tracking-tight">比赛端配置</h1>
                <p className="text-default-500">{tournament} · 设置各轮比赛规则和参赛简称，生成 bracket.json。</p>
            </div>
            <BracketExport key={tournament} tournamentName={tournament}/>
        </div>
    );
}
