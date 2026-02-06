"use client";
import React, {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {TournamentManagementInfo} from "@/app/(home)/tournament-management/page";
import {Link} from "@heroui/link";
import {siteConfig} from "@/config/site";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {Card, CardBody} from "@heroui/card";
import {Skeleton} from "@heroui/skeleton";
import {Chip} from "@heroui/chip";

// --- 图标 (无需修改) ---
const MetaIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <path
            d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>);
const RoundIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>);
const MemberIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>);
const DataIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>);
const TeamIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>);
const MapIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
        <line x1="8" y1="2" x2="8" y2="18"/>
        <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>);
const ScheduleIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>);

export default function ManagementHomePage(props: { params: Promise<{ tournament: string }> }) {
    const currentUser = useContext(CurrentUserContext);
    const [myRoles, setMyRoles] = useState<string[]>([]);
    const [tournamentPlayers, setTournamentPlayers] = useState<TournamentPlayers>({groups: undefined, players: []});
    const [isLoading, setIsLoading] = useState(true);

    const params = React.use(props.params);
    const tournament_abbr = decodeURIComponent(params.tournament);

    const link_prefix = `/tournament-management/${tournament_abbr}`;

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                try {
                    // 1. 先获取所有管理权限信息 (包含简称和全称的对应关系)
                    const manageData = await getTournamentManagementInfo(currentUser.currentUser.uid);

                    // 2. 在本地查找当前比赛 (通过 URL 参数的简称匹配)
                    const currentTournament = manageData.find(
                        info => info.abbreviation === tournament_abbr
                    );

                    if (currentTournament) {
                        // 找到比赛了，设置权限
                        setMyRoles(currentTournament.roles || []);

                        // 3. 【关键修改】拿到全称 (tournament_name) 后，再去请求 getPlayers
                        try {
                            const playersData = await getPlayers(currentTournament.tournament_name, 120);
                            setTournamentPlayers(playersData);
                        } catch (err) {
                            console.error("Failed to load players:", err);
                        }
                    } else {
                        console.warn("未找到匹配的比赛权限:", tournament_abbr);
                        setMyRoles([]);
                    }
                } catch (e) {
                    console.error("Failed to load dashboard data", e);
                } finally {
                    setIsLoading(false);
                }
            } else if (currentUser?.currentUser === null) {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [currentUser, tournament_abbr]);

    // 定义菜单配置
    const menuItems = [
        {
            title: "赛事信息",
            desc: "修改比赛基本设置、规则与简介",
            href: `${link_prefix}/meta`,
            icon: <MetaIcon/>,
            allowed: myRoles.includes('主办')
        },
        {
            title: "轮次管理",
            desc: "配置每个阶段的图池、时间与规则",
            href: `${link_prefix}/round`,
            icon: <RoundIcon/>,
            allowed: myRoles.includes('主办')
        },
        {
            title: "成员管理",
            desc: "管理 Staff 权限与名单",
            href: `${link_prefix}/member`,
            icon: <MemberIcon/>,
            allowed: myRoles.includes('主办')
        },
        {
            title: "图池管理",
            desc: "添加、修改比赛用图",
            href: `${link_prefix}/mappool`,
            icon: <MapIcon/>,
            allowed: myRoles.includes('主办') || myRoles.includes('选图')
        },
        {
            title: "赛程管理",
            desc: "安排比赛对阵与时间表",
            href: `${link_prefix}/scheduler`,
            icon: <ScheduleIcon/>,
            allowed: myRoles.includes('主办') || myRoles.includes('时间安排')
        },
        {
            title: "数据统计",
            desc: "进行比赛数据分析",
            href: `${link_prefix}/statistics`,
            icon: <DataIcon/>,
            allowed: myRoles.includes('主办')
        },
        {
            title: "队伍管理",
            desc: "管理参赛队伍信息",
            href: `${link_prefix}/team`,
            icon: <TeamIcon/>,
            allowed: myRoles.includes('主办'),
            disabled: !tournamentPlayers.groups, // 团队赛才可用
            disabledReason: "仅团队赛可用"
        },
    ];

    if (isLoading) {
        return <DashboardSkeleton/>;
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8 animate-appearance-in">
            {/* Header: 修复文字颜色 */}
            <div className="flex flex-col gap-2">
                {/* 修复：text-white -> text-foreground */}
                <h1 className="text-3xl font-black tracking-tight text-foreground">
                    管理控制台
                </h1>
                <div className="flex items-center gap-3 text-default-500">
                    {/* 修复：text-foreground */}
                    <span>当前赛事: <span className="text-foreground font-bold">{tournament_abbr}</span></span>
                    {myRoles.map(role => (
                        <Chip key={role} size="sm" color="primary" variant="flat">{role}</Chip>
                    ))}
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {menuItems.map((item, index) => {
                    if (!item.allowed) return null;

                    return (
                        <DashboardCard
                            key={index}
                            item={item}
                        />
                    );
                })}
            </div>
        </div>
    );
}

// --- 子组件：仪表盘卡片 ---
const DashboardCard = ({item}: { item: MenuItem }) => {

    return (
        <Card
            as={Link}
            href={item.disabled ? undefined : item.href}
            isPressable={!item.disabled}
            // 修复：
            // 1. bg-zinc-900 -> bg-content1 (白) dark:bg-zinc-900
            // 2. border-white/5 -> border-default-200 dark:border-white/5
            // 3. hover:bg-zinc-800 -> hover:bg-default-100 dark:hover:bg-zinc-800
            className={`
                h-full min-h-[140px] border border-default-200 dark:border-white/5 bg-content1 dark:bg-zinc-900 transition-all duration-300 group
                ${item.disabled
                ? "opacity-50 cursor-not-allowed grayscale"
                : "hover:bg-default-100 dark:hover:bg-zinc-800 hover:border-primary/50 hover:-translate-y-1 hover:shadow-lg"
            }
            `}
        >
            <CardBody className="p-6 flex flex-col justify-between gap-4">
                <div className="flex justify-between items-start">
                    {/* 修复：图标背景色 bg-default-100 (浅灰) 适合亮暗模式 */}
                    <div
                        className={`p-3 rounded-xl bg-default-100 text-2xl ${item.disabled ? 'text-default-400' : 'text-primary group-hover:bg-primary group-hover:text-white transition-colors'}`}>
                        {item.icon}
                    </div>
                    {item.disabled && (
                        <Chip size="sm" variant="flat" color="default">{item.disabledReason}</Chip>
                    )}
                </div>

                <div>
                    {/* 修复：text-foreground */}
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                    </h3>
                    <p className="text-xs text-default-500 mt-1 line-clamp-2">
                        {item.desc}
                    </p>
                </div>
            </CardBody>
        </Card>
    );
}

// --- 子组件：加载骨架 ---
const DashboardSkeleton = () => (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="space-y-3">
            <Skeleton className="w-48 h-10 rounded-lg bg-default-200"/>
            <Skeleton className="w-64 h-6 rounded-lg bg-default-100"/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
                // 修复：骨架屏背景色 bg-content1 dark:bg-zinc-900
                <Card key={i}
                      className="h-[140px] bg-content1 dark:bg-zinc-900 border border-default-200 dark:border-white/5 p-6 space-y-4">
                    <Skeleton className="w-12 h-12 rounded-xl bg-default-200"/>
                    <div className="space-y-2">
                        <Skeleton className="w-24 h-5 rounded-lg bg-default-200"/>
                        <Skeleton className="w-full h-3 rounded-lg bg-default-100"/>
                    </div>
                </Card>
            ))}
        </div>
    </div>
)

// --- 数据获取 ---
async function getTournamentManagementInfo(uid: number): Promise<TournamentManagementInfo[]> {
    const data = await fetch(siteConfig.backend_url + `/api/tournament-management-info?uid=${uid}`,
        {next: {revalidate: 10}});
    return await data.json();
}

async function getPlayers(tournament_name: string, revalidate_time: number = 0): Promise<TournamentPlayers> {
    const res = await fetch(siteConfig.backend_url + '/api/players?tournament_name=' + tournament_name,
        {next: {revalidate: revalidate_time}})
    return await res.json()
}

interface MenuItem {
    title: string;
    desc: string;
    href: string;
    icon: React.ReactNode;
    allowed: boolean;
    disabled?: boolean;
    disabledReason?: string;
}