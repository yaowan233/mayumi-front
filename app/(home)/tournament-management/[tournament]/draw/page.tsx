import Link from "next/link";
import {DrawManagement} from "@/components/draw_management";

export default async function DrawPage({params}: {params: Promise<{tournament: string}>}) {
    const {tournament} = await params;
    return <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-8">
        <div><Link href={`/tournament-management/${encodeURIComponent(tournament)}`} className="text-sm text-primary">返回赛事管理</Link><h1 className="mt-3 text-3xl font-bold">对阵管理</h1><p className="mt-2 text-default-500">{tournament} · 生成淘汰赛对阵、录入比分并自动安排晋级。</p></div>
        <DrawManagement tournamentName={tournament}/>
    </div>;
}
