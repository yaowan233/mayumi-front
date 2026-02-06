'use client'
import {Button} from "@heroui/button";
import {Link} from "@heroui/link";
import {Card, CardBody, CardFooter, CardHeader} from "@heroui/card";
import {Chip} from "@heroui/chip";
import {Tooltip} from "@heroui/tooltip";
import {Skeleton} from "@heroui/skeleton";
import {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {siteConfig} from "@/config/site";

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
const AlertIcon = () => <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;

const STATUS_CONFIG: Record<string, { label: string; color: "default" | "warning" | "success" | "danger" | "secondary" | "primary" }> = {
    draft: { label: "草稿", color: "default" },
    pending: { label: "审核中", color: "warning" },
    approved: { label: "已发布", color: "success" },
    rejected: { label: "已驳回", color: "danger" },
    hidden: { label: "已隐藏", color: "default" },
};

const getRoleStyle = (role: string) => {
    switch (role) {
        case "主办":
            return { color: "primary" as const, label: "主办" }; // 蓝色
        case "选图":
            return { color: "secondary" as const, label: "选图" }; // 紫色
        case "时间安排":
            return { color: "warning" as const, label: "时间安排" }; // 橙色/黄色
        default:
            return { color: "default" as const, label: role }; // 灰色
    }
};

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
            {/* 标题区保持不变 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
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

            {/* 内容区 */}
            {isLoading ? (
                // Loading Skeleton (保持不变)
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="h-[180px] p-4 space-y-4" radius="lg">
                            <Skeleton className="rounded-lg"><div className="h-6 w-1/3 bg-default-300"></div></Skeleton>
                            <Skeleton className="rounded-lg"><div className="h-20 bg-default-300"></div></Skeleton>
                        </Card>
                    ))}
                </div>
            ) : !isLoggedIn ? (
                // 未登录 (保持不变)
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-default-200 dark:border-default-100 rounded-2xl bg-default-50 dark:bg-zinc-900/30">
                    <LockIcon/>
                    <h3 className="text-xl font-bold mt-4 text-default-600">请先登录</h3>
                    <p className="text-default-400 text-sm mb-6">您需要登录 osu! 账号才能查看或管理比赛。</p>
                    <div className="text-sm text-primary font-medium">请点击右上角头像进行登录</div>
                </div>
            ) : tournamentManagementInfo && tournamentManagementInfo.length > 0 ? (
                // 已登录且有数据
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournamentManagementInfo.map((info) => {
                        // 获取状态配置
                        const statusConfig = STATUS_CONFIG[info.status] || STATUS_CONFIG.draft;

                        return (
                            <Card
                                key={info.tournament_name}
                                as={Link}
                                href={`/tournament-management/${info.abbreviation}`}
                                isPressable
                                className="h-full min-h-[180px] border border-default-200 dark:border-white/5 bg-content1 dark:bg-zinc-900 hover:bg-default-100 dark:hover:bg-zinc-800 hover:border-primary/50 transition-all duration-300 group"
                            >
                                <CardHeader className="flex flex-row justify-between items-start px-6 pt-6 pb-0 gap-2">
                                    {/* 比赛名称 */}
                                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 flex-1"
                                        title={info.tournament_name}>
                                        {info.tournament_name}
                                    </h3>

                                    {/* --- 变化点：状态标签 --- */}
                                    <Chip
                                        color={statusConfig.color}
                                        variant="flat"
                                        size="sm"
                                        className="capitalize border-none min-w-fit"
                                    >
                                        {statusConfig.label}
                                    </Chip>
                                </CardHeader>

                                <CardBody className="px-6 py-3 flex flex-col justify-between">
                                    {/* 角色标签 */}
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {info.roles.map((role) => {
                                            const style = getRoleStyle(role);
                                            return (
                                                <Chip
                                                    key={role}
                                                    size="sm"
                                                    variant="flat"
                                                    color={style.color}
                                                    className="font-medium"
                                                >
                                                    {role}
                                                </Chip>
                                            );
                                        })}
                                    </div>

                                    {/* --- 变化点：如果是“已驳回”，显示醒目的红色提示 --- */}
                                    {info.status === 'rejected' && info.reject_reason && (
                                        <Tooltip content={info.reject_reason} color="danger">
                                            <div className="mt-2 p-2 rounded-medium bg-danger-50 dark:bg-danger/10 border border-danger/20 flex items-start gap-2 text-danger text-xs font-medium cursor-help">
                                                <div className="mt-0.5"><AlertIcon /></div>
                                                <span className="line-clamp-2">驳回原因: {info.reject_reason}</span>
                                            </div>
                                        </Tooltip>
                                    )}

                                    {/* 如果是待审核，可以给一个温馨提示 */}
                                    {info.status === 'pending' && (
                                        <div className="mt-2 text-xs text-warning-600 dark:text-warning-400">
                                            正在等待管理员审核，期间您可以修改信息。
                                        </div>
                                    )}
                                </CardBody>

                                <CardFooter className="px-6 pb-6 pt-0">
                                    <div className="text-tiny text-default-500 group-hover:text-primary/80 group-hover:translate-x-1 transition-all duration-300 flex items-center gap-1 font-medium">
                                        {info.status === 'rejected' ? '去修改' : '进入管理后台'} <span>→</span>
                                    </div>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                // 无数据 (保持不变)
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-default-200 dark:border-default-100 rounded-2xl bg-default-50 dark:bg-zinc-900/30">
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

async function getTournamentManagementInfo(uid: number): Promise<TournamentManagementInfo[]> {
    const data = await fetch(siteConfig.backend_url + `/api/tournament-management-info?uid=${uid}`,
        {next: {revalidate: 10}});
    return await data.json();
}

export type TournamentStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'hidden';

export interface TournamentManagementInfo {
    tournament_name: string;
    abbreviation: string;
    roles: string[];
    status: TournamentStatus;
    reject_reason?: string;
}