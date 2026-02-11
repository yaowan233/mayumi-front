"use client"

import { Link } from "@heroui/link";
import { Card, CardBody } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Divider } from "@heroui/divider";

// --- 子组件：贡献者卡片 ---
const ContributorCard = ({
    name,
    osuId,
    role,
    color = "default",
    isMain = false
}: {
    name: string,
    osuId: string,
    role: string,
    color?: "primary" | "secondary" | "warning" | "default",
    isMain?: boolean
}) => {
    return (
        <Card
            as={Link}
            href={`https://osu.ppy.sh/users/${osuId}`}
            isExternal
            className={`
                border border-default-200 dark:border-white/5 transition-all duration-300 group
                ${isMain 
                    ? "w-full max-w-md mx-auto bg-gradient-to-br from-white to-default-100 dark:from-zinc-900 dark:to-black hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,111,238,0.15)]" 
                    : "w-full bg-content1 dark:bg-zinc-900/50 hover:bg-default-100 dark:hover:bg-zinc-800/80 hover:border-default-300 dark:hover:border-white/20"
                }
            `}
        >
            <CardBody className={`flex flex-row items-center gap-5 ${isMain ? "p-6" : "p-4"}`}>
                <Avatar
                    src={`https://a.ppy.sh/${osuId}`}
                    isBordered
                    color={color as any}
                    className={`
                        shrink-0 transition-transform duration-300 group-hover:scale-105
                        ${isMain ? "w-20 h-20 text-large" : "w-14 h-14"}
                    `}
                />

                <div className="flex flex-col gap-1 min-w-0">
                    {/* 修复：text-foreground 自动适配黑白 */}
                    <span className={`
                        font-bold text-foreground transition-colors truncate group-hover:text-primary
                        ${isMain ? "text-2xl" : "text-lg"}
                    `}>
                        {name}
                    </span>
                    <span className={`
                        text-default-500 uppercase tracking-wider font-mono truncate
                        ${isMain ? "text-sm font-bold text-primary" : "text-xs"}
                    `}>
                        {role}
                    </span>
                </div>
            </CardBody>
        </Card>
    );
};

export default function AboutPage() {
    return (
        <div className="w-full max-w-4xl mx-auto px-6 py-12 flex flex-col gap-16">

            {/* 1. 标题区 */}
            <div className="flex flex-col items-center gap-4 text-center">
                <h1 className="text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-zinc-700 to-zinc-400 dark:from-white dark:to-white/50">
                    关于本站
                </h1>
                <p className="text-default-500 max-w-lg">
                    Mayumi 是一个专为 osu! 社区打造的<br className="sm:hidden"/>现代化赛事管理平台。
                </p>
            </div>

            <Divider className="opacity-30" />

            {/* 2. 核心开发 */}
            <section className="flex flex-col gap-6 text-center">
                <div className="flex items-center justify-center gap-3">
                    <div className="h-1 w-8 bg-primary rounded-full shadow-[0_0_10px_#006FEE]" />
                    {/* 修复：text-white -> text-foreground */}
                    <h2 className="text-xl font-bold text-foreground tracking-widest">核心开发</h2>
                    <div className="h-1 w-8 bg-primary rounded-full shadow-[0_0_10px_#006FEE]" />
                </div>

                <div className="w-full">
                    <ContributorCard
                        name="yaowan233"
                        osuId="3162675"
                        role="全栈开发 / 负责人"
                        color="primary"
                        isMain={true}
                    />
                </div>
            </section>

            {/* 3. 特别致谢 */}
            <section className="flex flex-col gap-6">
                <div className="flex items-center gap-3 px-1">
                    <div className="h-6 w-1 bg-warning rounded-full shadow-[0_0_10px_#F5A524]" />
                    <h2 className="text-lg font-bold text-foreground tracking-widest">特别致谢</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ContributorCard
                        name="Jason House"
                        osuId="5321112"
                        role="建议与支持"
                        color="warning"
                    />
                    <ContributorCard
                        name="Candy"
                        osuId="2360046"
                        role="协助开发"
                        color="warning"
                    />
                </div>
            </section>

            {/* 4. 联系方式 */}
            <div className="mt-4 flex justify-center">
                <div className="bg-default-50 dark:bg-zinc-900 border border-default-200 dark:border-white/5 rounded-full px-6 py-3 flex items-center gap-3 text-xs sm:text-sm text-default-500 cursor-default hover:text-foreground transition-colors shadow-sm">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <span>如有问题或建议，欢迎通过 osu! 私信联系开发人员</span>
                </div>
            </div>

        </div>
    );
}