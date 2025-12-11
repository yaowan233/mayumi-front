import {Card, CardBody} from "@heroui/card";
import {Divider} from "@heroui/divider";
import {siteConfig} from "@/config/site";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks"; // 1. 引入换行插件

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

            <Card className="bg-transparent shadow-none border-none">
                <CardBody className="p-0">
                    {info.data ? (
                        <div className="px-2 sm:px-4 py-4">
                            {/*
                                样式修复核心：
                                1. dark:prose-invert: 只有在深色模式下才反转颜色（变白），亮色模式保持黑色。
                                2. dark:prose-p:text-gray-200: 深色模式下正文变亮白。
                                3. prose-p:text-gray-600: 亮色模式下正文用深灰，保证阅读舒适。
                            */}
                            <article className="
                                prose max-w-none
                                dark:prose-invert

                                prose-p:leading-loose prose-p:font-medium
                                prose-p:text-gray-700 dark:prose-p:text-gray-200

                                prose-headings:font-bold
                                prose-headings:text-gray-900 dark:prose-headings:text-white

                                prose-a:text-primary prose-a:no-underline hover:prose-a:underline

                                prose-strong:font-black
                                prose-strong:text-gray-900 dark:prose-strong:text-white

                                prose-li:text-gray-700 dark:prose-li:text-gray-200

                                font-sans text-lg tracking-wide"
                            >
                                <Markdown
                                    // 2. 这里的 remarkPlugins 加入 remarkBreaks 即可解决换行问题
                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                    components={{
                                        a: ({node, ...props}) => (
                                            <a {...props} target="_blank" rel="noopener noreferrer" />
                                        )
                                    }}
                                >
                                    {info.data}
                                </Markdown>
                            </article>
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
                </CardBody>
            </Card>
        </div>
    )
}

async function getTournamentRule(tournament_name: string): Promise<{ data: string }> {
    const res = await fetch(siteConfig.backend_url + '/api/tournament_rule?tournament_name=' + tournament_name,
        {next: {revalidate: 60}})

    if (!res.ok) {
        return { data: "" }
    }

    return await res.json()
}