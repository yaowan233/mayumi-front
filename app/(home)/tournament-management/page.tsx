'use client'
import {Button} from "@heroui/button";
import {Link} from "@heroui/link";
import {Card, CardBody, CardFooter, CardHeader} from "@heroui/card";
import {Chip} from "@heroui/chip";
import {Skeleton} from "@heroui/skeleton";
import {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {siteConfig} from "@/config/site";

// --- 图标组件 (无需修改) ---
const PlusIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14"/>
        <path d="M12 5v14"/>
    </svg>
);
const SettingIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <path
            d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);
const EmptyIcon = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"
         strokeLinecap="round" strokeLinejoin="round" className="text-default-300">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);
const LockIcon = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"
         strokeLinecap="round" strokeLinejoin="round" className="text-default-300">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

export default function TournamentManagementPage() {
    const currentUser = useContext(CurrentUserContext);
    const [tournamentManagementInfo, setTournamentManagementInfo] = useState<TournamentManagementInfo[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isLoggedIn = !!currentUser?.currentUser;

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                try {
                    const data = await getTournamentManagementInfo(currentUser.currentUser.uid);
                    setTournamentManagementInfo(data);
                } catch (e) {
                    console.error("Failed to load management info", e);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8 animate-appearance-in">

            {/* 1. 标题区 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    {/* 修复：text-white -> text-foreground */}
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <SettingIcon/>
                        比赛管理
                    </h1>
                    <p className="text-default-500 text-sm mt-1">管理您拥有权限的赛事，或发起新的比赛</p>
                </div>

                {isLoggedIn && (
                    <Button
                        as={Link}
                        href="/create-tournament"
                        color="primary"
                        variant="shadow"
                        className="font-bold"
                        startContent={<PlusIcon/>}
                    >
                        创建比赛
                    </Button>
                )}
            </div>

            {/* 2. 内容区 */}

            {isLoading ? (
                // 状态 A: 加载中
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        // 修复：bg-zinc-900 -> bg-content1 dark:bg-zinc-900
                        <Card key={i}
                              className="h-[160px] bg-content1 dark:bg-zinc-900 border border-default-200 dark:border-white/5 space-y-5 p-4"
                              radius="lg">
                            <Skeleton className="rounded-lg">
                                <div className="h-24 rounded-lg bg-default-300"></div>
                            </Skeleton>
                            <div className="space-y-3">
                                <Skeleton className="w-3/5 rounded-lg">
                                    <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
                                </Skeleton>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : !isLoggedIn ? (
                // 状态 B: 未登录 (修复边框和背景)
                <div
                    className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-default-200 dark:border-default-100 rounded-2xl bg-default-50 dark:bg-zinc-900/30">
                    <LockIcon/>
                    <h3 className="text-xl font-bold mt-4 text-default-600">请先登录</h3>
                    <p className="text-default-400 text-sm mb-6">您需要登录 osu! 账号才能查看或管理比赛。</p>
                    <div className="text-sm text-primary font-medium">
                        请点击右上角头像进行登录
                    </div>
                </div>
            ) : tournamentManagementInfo && tournamentManagementInfo.length > 0 ? (
                // 状态 C: 已登录且有数据
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournamentManagementInfo.map((info) => (
                        <Card
                            key={info.tournament_name}
                            as={Link}
                            href={`/tournament-management/${info.tournament_name}`}
                            isPressable
                            // 修复：背景色、边框、Hover效果适配
                            className="h-full min-h-[160px] border border-default-200 dark:border-white/5 bg-content1 dark:bg-zinc-900 hover:bg-default-100 dark:hover:bg-zinc-800 hover:border-primary/50 transition-all duration-300 group"
                        >
                            <CardHeader className="flex flex-col items-start px-6 pt-6 pb-2 gap-1">
                                {/* 修复：text-white -> text-foreground */}
                                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1"
                                    title={info.tournament_name}>
                                    {info.tournament_name}
                                </h3>
                                <p className="text-xs text-default-400">点击进入管理后台</p>
                            </CardHeader>

                            <CardBody className="px-6 py-2 overflow-visible">
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {info.roles.map((role) => (
                                        <Chip
                                            key={role}
                                            color="primary"
                                            variant="flat"
                                            size="sm"
                                            classNames={{
                                                base: "bg-primary/10 border border-primary/20",
                                                content: "font-bold text-primary-600 dark:text-primary-400"
                                            }}
                                        >
                                            {role}
                                        </Chip>
                                    ))}
                                </div>
                            </CardBody>

                            <CardFooter className="px-6 pb-6 pt-2">
                                <div
                                    className="text-tiny text-default-500 group-hover:text-primary/80 group-hover:translate-x-1 transition-all duration-300 flex items-center gap-1 font-medium">
                                    进入管理后台 <span>→</span>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                // 状态 D: 已登录但无数据 (修复背景)
                <div
                    className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-default-200 dark:border-default-100 rounded-2xl bg-default-50 dark:bg-zinc-900/30">
                    <EmptyIcon/>
                    <h3 className="text-xl font-bold mt-4 text-default-600">暂无管理的比赛</h3>
                    <p className="text-default-400 text-sm mb-6">您目前没有参与管理的赛事，或者还没有创建比赛。</p>
                    <Button
                        as={Link}
                        href="/create-tournament"
                        color="primary"
                        variant="flat"
                        className="font-bold"
                    >
                        立即创建新比赛
                    </Button>
                </div>
            )}
        </div>
    );
}

// ... API 和 Interface 保持不变
async function getTournamentManagementInfo(uid: number): Promise<TournamentManagementInfo[]> {
    const data = await fetch(siteConfig.backend_url + `/api/tournament-management-info?uid=${uid}`,
        {next: {revalidate: 10}});
    return await data.json();
}

export interface TournamentManagementInfo {
    tournament_name: string;
    roles: string[];
}