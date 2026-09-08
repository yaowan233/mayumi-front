import {Card} from "@heroui/react";
import {backendServerUrl} from "@/lib/backend_server";
import {TournamentMarkdown} from "@/components/tournament_markdown";

// --- 图标组件 ---
const RuleBookIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
);

export default async function TournamentRulesPage(props: { params: Promise<{ tournament: string }> }) {
    const params = await props.params;
    const info = await getTournamentRule(params.tournament);

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-8">

            {/* 标题区 */}
            <div className="flex items-center gap-4 mb-6 px-2">
                <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,111,238,0.2)]">
                    <RuleBookIcon />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-3xl font-black text-foreground tracking-tight">
                        赛事规则
                    </h1>
                    <p className="text-default-500 text-sm">
                        请参赛前仔细阅读规则
                    </p>
                </div>
            </div>

            <Card variant="transparent" className="border-none bg-transparent shadow-none">
                <Card.Content className="p-0">
                    {info.data ? (
                        <div className="px-2 sm:px-4 py-4">
                            <TournamentMarkdown>{info.data}</TournamentMarkdown>
                        </div>
                    ) : (
                        // 空状态
                        <div className="flex flex-col items-center justify-center h-64 gap-4 text-default-400">
                            <div className="text-6xl opacity-20">
                                <RuleBookIcon />
                            </div>
                            <p>暂无比赛规则 (No rules available yet)</p>
                        </div>
                    )}
                </Card.Content>
            </Card>
        </div>
    )
}

async function getTournamentRule(tournament_name: string): Promise<{ data: string }> {
    const res = await fetch(backendServerUrl() + '/api/tournament_rule?tournament_name=' + tournament_name,
        {next: {revalidate: 0}})

    if (!res.ok) {
        return { data: "" }
    }

    return await res.json()
}
