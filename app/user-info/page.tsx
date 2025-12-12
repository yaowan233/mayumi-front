"use client";
import { Image } from "@heroui/image";
import { ScoreRankA, ScoreRankS, ScoreRankSS, ScoreRankX, ScoreRankXH } from "@/app/user-info/score-rank";
import { Progress } from "@heroui/progress";
import UserLevel from "@/components/user_level";
import { User } from "@/app/user-info/types";
import { useContext, useEffect, useState } from "react";
import CurrentUserContext from "@/app/user_context";
import GameModeIcon, { GameMode } from "@/components/gamemode_icon";
import { Input } from "@heroui/input";
import { Tooltip } from "@heroui/tooltip";
import { SearchIcon } from "@heroui/shared-icons";
import { siteConfig } from "@/config/site";
import RankDisplay from "@/app/user-info/rank-display";
import { Button } from "@heroui/button";


interface ModeData {
    name: GameMode;
    color: string;
}
const MODE_DEFAULTS: Record<GameMode, ModeData> = {
    osu: { name: 'osu', color: '#ff66aa' },
    taiko: { name: 'taiko', color: '#f33' },
    fruits: { name: 'fruits', color: '#ffa500' },
    mania: { name: 'mania', color: '#6cf' },
};
const MODE_LIST = Object.values(MODE_DEFAULTS);


const GLASS_CLASS = "bg-white/60 dark:bg-black/60 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm text-zinc-800 dark:text-white";
const TEXT_MUTED = "text-zinc-500 dark:text-zinc-400"; // 次要文字颜色

export default function TournamentHomePage() {
    const currentUser = useContext(CurrentUserContext);
    const [userInfo, setUserInfo] = useState<User | null>(null);
    const [selectedMode, setSelectedMode] = useState<GameMode>("osu");
    const [searchName, setSearchName] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (currentUser?.currentUser?.uid && !searchName) {
            handleSearch(currentUser.currentUser.name);
        }
    }, [currentUser]);

    useEffect(() => {
        if (userInfo?.username) handleSearch(userInfo.username);
    }, [selectedMode]);

    const handleSearch = async (name: string) => {
        if (!name) return;
        setIsSearching(true);
        try {
            const data = await getUserInfo(selectedMode, name);
            setUserInfo(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const hasBadges = userInfo?.badges && userInfo.badges.length > 0;

    return (
        <div className="flex flex-col items-center gap-6 w-full py-8 px-2 md:px-4">

            {/* 1. 顶部控制栏 (搜索 & 模式) */}
            <div className={`flex flex-col sm:flex-row gap-4 items-center p-3 rounded-2xl w-full max-w-xl transition-colors ${GLASS_CLASS}`}>
                {/* 模式选择 - 强制正方形 */}
                <div className="flex justify-center gap-2 w-full sm:w-auto">
                    {MODE_LIST.map((modeData) => {
                        const isSelected = selectedMode === modeData.name;
                        return (
                            <div
                                key={modeData.name}
                                onClick={() => setSelectedMode(modeData.name)}
                                className={`
                                    w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-300
                                    ${isSelected 
                                        ? 'bg-zinc-800 text-white shadow-md scale-110' // 选中态：深色块（在亮色下也保持深色以突出） 
                                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10'
                                    }
                                `}
                            >
                                <GameModeIcon
                                    mode={modeData.name}
                                    size={20}
                                    color={isSelected ? modeData.color : "currentColor"}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* 分割线 */}
                <div className="w-full h-[1px] sm:w-[1px] sm:h-8 bg-zinc-300 dark:bg-white/10"></div>

                {/* 搜索框 */}
                <div className="flex gap-2 w-full">
                    <Input
                        placeholder="搜索用户名..."
                        size="sm"
                        value={searchName}
                        classNames={{
                            inputWrapper: "bg-white/50 dark:bg-black/30 shadow-none h-10 border border-zinc-200 dark:border-white/5",
                            input: "text-zinc-800 dark:text-white placeholder:text-zinc-500"
                        }}
                        onValueChange={setSearchName}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchName)}
                    />
                    <Button
                        isIconOnly
                        size="sm"
                        color="primary"
                        className="h-10 w-10 min-w-10 rounded-lg shadow-md font-bold text-white"
                        isLoading={isSearching}
                        onPress={() => handleSearch(searchName)}
                    >
                        {!isSearching && <SearchIcon />}
                    </Button>
                </div>
            </div>

            {/* 2. 核心卡片 */}
            {userInfo && (
                <div className="relative w-full max-w-4xl rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/10 group bg-zinc-100 dark:bg-[#0a0a0a]">

                    {/* A. 背景层 */}
                    <div
                        className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url('${"https://www.loliapi.com/acg"}')` }}
                    />
                    {/* 背景遮罩：亮色模式用白雾，暗色模式用黑雾 */}
                    <div className="absolute inset-0 bg-white/40 dark:bg-black/50 z-0 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white/90 dark:from-transparent dark:via-black/60 dark:to-black/90 z-0" />

                    {/* B. 内容层 */}
                    <div className="relative z-10 flex flex-col gap-3 p-4 sm:p-6">

                        {/* --- Header: 信息聚合 (应用 GLASS_CLASS) --- */}
                        <div className={`flex flex-col md:flex-row gap-5 items-center md:items-stretch rounded-2xl p-5 ${GLASS_CLASS}`}>
                            <div className="shrink-0">
                                <Image
                                    src={`https://a.ppy.sh/${userInfo.id}`}
                                    alt="avatar"
                                    className="w-24 h-24 rounded-2xl border-2 border-white/50 dark:border-white/20 shadow-lg"
                                />
                            </div>

                            <div className="flex flex-col justify-center min-w-0 gap-1 flex-grow text-center md:text-left">
                                <div className="text-3xl font-black tracking-tight drop-shadow-sm text-zinc-900 dark:text-white">
                                    {userInfo.username}
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 text-xs font-bold text-zinc-600 dark:text-white/80">
                                    {userInfo.team && (
                                        <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md border border-black/5 dark:border-white/5">
                                            <Image radius="none" src={userInfo.team.flag_url} alt="flag" className="w-4 h-3" />
                                            <span>{userInfo.team.name}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md border border-black/5 dark:border-white/5">
                                        <Image radius="none" src={flagUrl(userInfo.country_code)} alt={userInfo.country_code} className="w-4 h-auto" />
                                        <span>#{userInfo.statistics?.country_rank || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center items-center md:items-end">
                                <div className="text-5xl font-black leading-none drop-shadow-sm scale-110 origin-right">
                                    <RankDisplay user={userInfo} type="global" />
                                </div>
                                <div className={`text-lg font-bold tabular-nums mt-1 ${TEXT_MUTED}`}>
                                    {Math.round(userInfo.statistics?.pp || 0)} <span className="text-xs font-normal opacity-70">pp</span>
                                </div>
                            </div>
                        </div>

                        {/* --- 进度条 + 等级 --- */}
                        <div className={`flex items-center gap-5 rounded-2xl p-4 ${GLASS_CLASS}`}>
                            <div className="flex flex-col w-full gap-1.5">
                                <div className={`flex justify-between text-xs font-bold tracking-wider ${TEXT_MUTED}`}>
                                    <span>等级 (LEVEL)</span>
                                    <span>{userInfo.statistics?.level.progress}%</span>
                                </div>
                                <Progress
                                    size="sm"
                                    radius="full"
                                    value={userInfo.statistics?.level.progress}
                                    aria-label="Level"
                                    classNames={{
                                        track: "bg-black/10 dark:bg-white/10 h-2",
                                        indicator: "bg-[#0099FF] h-2 shadow-sm"
                                    }}
                                    className="flex-grow"
                                />
                            </div>
                            <div className="shrink-0 flex items-center justify-center scale-110">
                                <UserLevel level={userInfo.statistics?.level.current || 0}/>
                            </div>
                        </div>

                        {/* --- 数据面板 --- */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">

                        <div className={`
                            md:col-span-2 flex flex-col justify-center
                            rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm
                            ${GLASS_CLASS}
                        `}>

                            <div className="flex flex-col w-full gap-5 py-6">

                                {/* 1. 徽章区域 */}
                                {hasBadges && (
                                    <div className="flex flex-col items-center gap-2">
                                        {/* 标题 */}
                                        <div className="flex items-center gap-2 opacity-40 mb-1">
                                            <span className="text-[10px] font-black tracking-[0.2em] uppercase">Badges</span>
                                            <span className="bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {userInfo.badges?.length}
                                            </span>
                                        </div>

                                        {/* 列表 */}
                                        <div className="flex flex-wrap gap-2 justify-center px-4">
                                            {userInfo.badges?.map((badge, i) => (
                                                <Tooltip key={i} content={badge.description} closeDelay={0}>
                                                    <Image
                                                        src={badge.image_url}
                                                        alt="badge"
                                                        className="h-10 w-auto rounded-md hover:scale-110 transition-transform cursor-pointer shadow-sm border border-black/5 dark:border-white/10"
                                                    />
                                                </Tooltip>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {hasBadges && <div className="w-4/5 h-[1px] bg-zinc-300/30 dark:bg-white/10 mx-auto" />}

                                {/* 2. 成绩分布区域 */}
                                <div className={`flex flex-col gap-5 px-2 transition-all duration-300 ${!hasBadges ? 'scale-110' : ''}`}>
                                    <div className="flex justify-between px-6"> {/* 增加 px-6 让两边留白多一点，聚焦中间 */}
                                        <GradeItem icon={<ScoreRankXH />} count={userInfo.statistics?.grade_counts.ssh} size={!hasBadges ? "lg" : "md"} />
                                        <GradeItem icon={<ScoreRankSS />} count={userInfo.statistics?.grade_counts.ss} size={!hasBadges ? "lg" : "md"} />
                                        <GradeItem icon={<ScoreRankX />} count={userInfo.statistics?.grade_counts.sh} size={!hasBadges ? "lg" : "md"} />
                                    </div>
                                    <div className="flex justify-center gap-16">
                                        <GradeItem icon={<ScoreRankS />} count={userInfo.statistics?.grade_counts.s} size={!hasBadges ? "lg" : "md"} />
                                        <GradeItem icon={<ScoreRankA />} count={userInfo.statistics?.grade_counts.a} size={!hasBadges ? "lg" : "md"} />
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className={`
                            md:col-span-3 rounded-2xl p-6 md:p-8 flex flex-col justify-between gap-4 text-sm h-full min-h-[360px]
                            border border-zinc-200 dark:border-white/10 shadow-sm
                            ${GLASS_CLASS}
                        `}>
                            <StatRow label="Ranked 总分" value={userInfo.statistics?.ranked_score.toLocaleString()} />
                            <StatRow label="准确率" value={`${(userInfo.statistics?.hit_accuracy || 0).toFixed(2)}%`} />
                            <StatRow label="游玩次数" value={userInfo.statistics?.play_count.toLocaleString()} />
                            <StatRow label="总分" value={userInfo.statistics?.total_score.toLocaleString()} />
                            <StatRow label="总点击数" value={userInfo.statistics?.total_hits.toLocaleString()} />
                            <StatRow label="游玩时长" value={`${Math.floor((userInfo.statistics?.play_time || 0) / 3600)}小时 ${Math.floor(((userInfo.statistics?.play_time || 0) % 3600) / 60)}分`} />
                            <StatRow label="最大连击" value={userInfo.statistics?.maximum_combo.toLocaleString()} />
                            <StatRow label="回放观看数" value={userInfo.statistics?.replays_watched_by_others.toLocaleString()} />
                        </div>
                    </div>

                    </div>
                </div>
            )}
        </div>
    );
}


const GradeItem = ({
    icon,
    count,
    size = "md"
}: {
    icon: React.ReactNode,
    count?: number,
    label?: string, // 这里的 label 实际上不需要显示，因为图标本身就是 SS/S
    size?: "md" | "lg"
}) => (
    <div className="flex flex-col items-center justify-center gap-1">
        <div className={`transition-transform duration-300 origin-bottom ${size === "lg" ? "scale-125 mb-1" : "scale-100"}`}>
            {icon}
        </div>

        <span className={`
            font-black tabular-nums leading-none tracking-tight text-zinc-800 dark:text-white
            ${size === "lg" ? "text-2xl" : "text-lg"}
        `}>
            {count?.toLocaleString() || 0}
        </span>
    </div>
);

const StatRow = ({ label, value, highlight }: { label: string, value?: string | number, highlight?: boolean }) => (
    <div className="flex justify-between items-center border-b border-zinc-200 dark:border-white/5 last:border-0 pb-1.5 last:pb-0">
        <span className={`${TEXT_MUTED} font-bold text-xs tracking-wide`}>{label}</span>
        <span className={`font-mono font-bold text-right ${highlight ? 'text-[#0099FF] text-lg' : 'text-zinc-800 dark:text-white/90 text-base'}`}>
            {value || 0}
        </span>
    </div>
);

function flagUrl(countryCode: string): string {
    if (!countryCode) return "";
    const chars = countryCode.toUpperCase().split('');
    const hexEmojiChars = chars.map(chr => (chr.codePointAt(0)! + 127397).toString(16));
    return `https://osu.ppy.sh/assets/images/flags/${hexEmojiChars.join('-')}.svg`;
}

async function getUserInfo(mode: string, username: string): Promise<User> {
    const res = await fetch(`${siteConfig.backend_url}/api/user-info?mode=${mode}&username=${username}`, {
        method: 'POST',
        credentials: 'include'
    });
    return await res.json();
}