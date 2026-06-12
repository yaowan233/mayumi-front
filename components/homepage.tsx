"use client"

import {useCallback, useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {siteConfig} from "@/config/site";
import {Player, Team, TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {normalizeTournamentThemeColor} from "@/components/tournament_theme";
import NextImage from "next/image";
import {
    Alert,
    Avatar,
    Button,
    Card,
    Checkbox,
    CheckboxGroup,
    Chip,
    Input,
    Modal,
    Radio,
    RadioGroup,
    Separator,
    Spinner,
    TextArea,
    Tooltip,
} from "@heroui/react";

const colorClass: Record<string, string> = {
    primary: "bg-primary/15 text-primary",
    secondary: "bg-primary/15 text-primary",
    success: "bg-emerald-500/15 text-emerald-300",
    danger: "bg-red-500/15 text-red-300",
    warning: "bg-amber-500/15 text-amber-300",
    default: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200",
};

const useDisclosure = () => {
    const [isOpen, setIsOpen] = useState(false);
    return {
        isOpen,
        onOpen: () => setIsOpen(true),
        onClose: () => setIsOpen(false),
        onOpenChange: (open?: boolean) => setIsOpen((value) => typeof open === "boolean" ? open : !value),
    };
};

const alertToneClass: Record<string, string> = {
    warning: "border-l-amber-400 bg-amber-50/80 text-amber-800 dark:bg-amber-400/[0.08] dark:text-amber-100",
    danger: "border-l-red-400 bg-red-50/80 text-red-800 dark:bg-red-400/[0.08] dark:text-red-100",
    success: "border-l-emerald-400 bg-emerald-50/80 text-emerald-800 dark:bg-emerald-400/[0.08] dark:text-emerald-100",
    accent: "border-l-primary bg-primary/10 text-primary dark:bg-primary/[0.10] dark:text-primary-foreground",
    default: "border-l-zinc-300 bg-zinc-100/80 text-zinc-700 dark:border-l-zinc-500 dark:bg-white/[0.06] dark:text-zinc-200",
};


const CalendarIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);
const LinkIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
);

const statusColorMap: Record<string, "warning" | "success" | "danger" | "default"> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    draft: "default",
    hidden: "default",
};

const statusLabelMap: Record<string, string> = {
    pending: "待审核",
    approved: "已发布",
    rejected: "审核被驳回",
    draft: "草稿",
    hidden: "已隐藏",
};


export const HomePage = ({tournament_info}: { tournament_info: TournamentInfo }) => {
    // ... 状态逻辑保持不变 ...
    const currentUser = useContext(CurrentUserContext);
    const {isOpen, onOpen, onClose, onOpenChange} = useDisclosure();
    const {isOpen: isIconOpen, onOpen: onIconOpen, onClose: onIconClose, onOpenChange: onIconOpenChange} = useDisclosure();
    const [errMsg, setErrMsg] = useState('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [iconUrl, setIconUrl] = useState('');
    const [teamName, setTeamName] = useState('');
    const [isUpdatingIcon, setIsUpdatingIcon] = useState(false);
    const [iconErrMsg, setIconErrMsg] = useState('');
    const [formData, setFormData] = useState<RegistrationInfo>({
        tournament: tournament_info.abbreviation,
        uid: currentUser?.currentUser?.uid,
        qqNumber: '',
        isFirstTimeStaff: undefined,
        tournamentExperience: '',
        selectedPositions: [],
        otherDetails: '',
        additionalComments: ''
    });
    const [members, setMembers] = useState<Player[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                const data = await getPlayers(tournament_info.abbreviation);
                setMembers(data.players);
                setTeams(data.groups || []);
            }
        };
        fetchData();
    }, [currentUser, tournament_info.abbreviation]);

    const resetRegistrationForm = useCallback(() => {
        setErrMsg('');
        setFormData({
            tournament: tournament_info.abbreviation,
            uid: currentUser?.currentUser?.uid,
            qqNumber: '',
            isFirstTimeStaff: false,
            tournamentExperience: '',
            selectedPositions: [],
            otherDetails: '',
            additionalComments: ''
        });
    }, [currentUser?.currentUser?.uid, tournament_info.abbreviation]);

    const handleOpenStaffModal = useCallback(() => {
        resetRegistrationForm();
        onOpen();
    }, [onOpen, resetRegistrationForm]);

    const handleOpenChange = useCallback((open: boolean) => {
        onOpenChange();
        if (!open) {
            resetRegistrationForm();
        }
    }, [onOpenChange, resetRegistrationForm]);

    const handleRegistration = async (onClose: () => void) => {
        if (formData.qqNumber === '' || formData.isFirstTimeStaff === undefined || formData.selectedPositions.length === 0) {
            setErrMsg('请填写所有必填字段')
        } else if (isNaN(Number(formData.qqNumber))) {
            setErrMsg('QQ号必须是数字')
        } else {
            const res = await fetch(siteConfig.backend_url + '/api/tournament-info', {
                'method': 'POST',
                'body': JSON.stringify(formData),
                'headers': {'Content-Type': 'application/json'}
            })
            if (res.status != 200) {
                setErrMsg(await res.text());
            } else {
                onClose();
                alert('报名成功');
            }
        }
    };

    let userRank: number = 0;
    const currentUserStats = currentUser?.currentUser?.statistics_rulesets;
    if (currentUserStats) {
        switch (tournament_info.mode) {
            case 'fruits': userRank = currentUserStats.fruits?.global_rank ?? 0; break;
            case 'osu': userRank = currentUserStats.osu?.global_rank ?? 0; break;
            case 'taiko': userRank = currentUserStats.taiko?.global_rank ?? 0; break;
            case 'mania': userRank = currentUserStats.mania?.global_rank ?? 0; break;
            case 'all': userRank = currentUserStats.osu?.global_rank ?? 0; break;
        }
    }

    const regNotAvailable = userRank
        && (
            (tournament_info.rank_min && userRank < tournament_info.rank_min) ||
            (tournament_info.rank_max && userRank > tournament_info.rank_max) ||
            (new Date(tournament_info.start_date) < new Date())
        );
    const hasRegistrationEnded = new Date(tournament_info.start_date) < new Date();

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('zh-CN');
    const isRegistered = members.some((member) => member.player && member.uid === currentUser?.currentUser?.uid);
    const myTeam = tournament_info.is_group
        ? teams.find(t => t.captains.includes(currentUser?.currentUser?.uid ?? -1))
        : null;
    const fallbackImage = "https://nextui.org/images/card-example-4.jpeg";
    const bgSrc = tournament_info.pic_url || fallbackImage;
    const themeColor = normalizeTournamentThemeColor(tournament_info.theme_color);
    const themeStyle = themeColor
        ? {
            "--accent": themeColor,
            "--tournament-hero-border": `color-mix(in srgb, ${themeColor} 38%, transparent)`,
            "--tournament-hero-shadow": `0 20px 70px color-mix(in srgb, ${themeColor} 20%, transparent)`,
            "--tournament-panel-bg": `linear-gradient(135deg, color-mix(in srgb, ${themeColor} 12%, rgb(250 250 250)) 0%, rgb(250 250 250 / 0.96) 52%, rgb(250 250 250 / 0.92) 100%)`,
            "--tournament-panel-bg-dark": `linear-gradient(135deg, color-mix(in srgb, ${themeColor} 16%, rgb(9 9 11)) 0%, rgb(9 9 11 / 0.96) 58%, rgb(9 9 11 / 0.92) 100%)`,
        } as React.CSSProperties
        : undefined;
    const iconModalState = {
        isOpen: isIconOpen,
        setOpen: onIconOpenChange,
        open: onIconOpen,
        close: onIconClose,
        toggle: () => onIconOpenChange(!isIconOpen),
    };
    const staffModalState = {
        isOpen,
        setOpen: handleOpenChange,
        open: handleOpenStaffModal,
        close: onClose,
        toggle: () => handleOpenChange(!isOpen),
    };
    return (
        <div
            className="flex flex-col gap-6 w-full max-w-6xl mx-auto px-2 pb-10"
            style={themeStyle}
        >
            {tournament_info.status !== 'approved' && (
                <div className={`
                    w-full p-4 rounded-xl border flex flex-col gap-3 shadow-sm transition-all
                    ${tournament_info.status === 'rejected' 
                        ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-900 text-danger' 
                        : 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-900 text-warning-600'}
                `}>
                    {/* 第一行：状态标签 + 提示文字 */}
                    <div className="flex flex-wrap items-center gap-3">
                        <Chip
                            color={statusColorMap[tournament_info.status]}
                            variant="primary"
                            className="text-white font-bold border-none"
                            size="sm"
                        >
                            {statusLabelMap[tournament_info.status]}
                        </Chip>
                        <span className="font-bold text-sm sm:text-base opacity-90">
                            当前页面未对外公开，仅管理员与主办方可见。
                        </span>
                    </div>

                    {/* 第二行：驳回理由详情 (仅在被驳回且有理由时显示) */}
                    {tournament_info.status === 'rejected' && tournament_info.reject_reason && (
                        <div className="flex items-start gap-2 bg-white/60 dark:bg-black/20 p-3 rounded-lg text-sm border border-danger-200/50 dark:border-danger-900/50">
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex flex-col gap-1">
                                <span className="font-bold opacity-80 text-xs uppercase tracking-wider">
                                    驳回理由
                                </span>
                                <span className="font-medium leading-relaxed">
                                    {tournament_info.reject_reason}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div
                className="relative w-full overflow-hidden rounded-2xl border border-zinc-200/70 bg-zinc-50 shadow-[0_16px_38px_rgba(15,23,42,0.08)] group dark:border-white/[0.10] dark:bg-zinc-950 dark:shadow-[0_18px_45px_rgba(0,0,0,0.34)]"
                style={themeColor ? {borderColor: "var(--tournament-hero-border)", boxShadow: "var(--tournament-hero-shadow)"} : undefined}
            >
                {themeColor && (
                    <div className="absolute inset-x-0 top-0 z-40 h-1 bg-primary" />
                )}

                <div className="absolute inset-0 z-0">
                    <NextImage
                        src={bgSrc}
                        alt=""
                        fill
                        sizes="100vw"
                        className="object-cover blur-[60px] opacity-50 scale-125"
                        quality={10}
                    />
                    {/* 黑色遮罩，增强文字对比度 */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-zinc-50/20 dark:bg-none dark:bg-black/20" />
                </div>

                {/* --- 主体层 --- */}
                <div className="relative z-10 w-full aspect-video md:aspect-[21/9] flex items-center justify-center">
                    <NextImage
                        src={bgSrc}
                        alt={tournament_info.name}
                        width={1200}
                        height={600}
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) calc(100vw - 3rem), 1280px"
                        style={{ width: '100%', height: '100%' }}
                        className="w-full h-full object-contain drop-shadow-2xl z-10"
                        priority
                    />
                </div>

                <div className="
                    relative z-30 flex flex-col justify-between gap-4
                    p-5 md:p-8

                    /* === 手机端样式 === */
                    bg-zinc-50/95 border-t border-zinc-200/70 dark:bg-zinc-950/95 dark:border-white/10  /* 纯色背景，有顶部分割线 */

                    /* === 电脑端样式 (覆盖手机端) === */
                    md:border-t-0                        /* 移除分割线 */
                    md:bg-zinc-50/95 md:dark:bg-zinc-950/95
                    md:flex-row md:items-end             /* 左右布局，底部对齐 */
                    [background:var(--tournament-panel-bg)] dark:[background:var(--tournament-panel-bg-dark)]
                "
                >

                    {/* 左侧：标题与信息 */}
                    <div className="flex flex-col gap-2 w-full md:w-auto flex-1 min-w-0">
                        {/* 标题 */}
                        <h1 className="text-xl md:text-3xl font-extrabold text-slate-700 tracking-tight leading-tight dark:text-white">
                            {tournament_info.name}
                        </h1>

                        {/* 标签组 */}
                        <div className="flex flex-wrap gap-2 items-center mt-1">
                            <Chip color="accent" size="sm" variant="primary" className="uppercase shadow-sm md:text-md">
                                {tournament_info.mode}
                            </Chip>
                            <Chip size="sm" variant="soft" className="border border-zinc-200/70 bg-white/75 text-zinc-600 shadow-sm backdrop-blur-md dark:text-zinc-300 dark:bg-white/5 dark:border-white/10 dark:md:text-white/90 dark:md:bg-white/10">
                                <CalendarIcon/>
                                {formatDate(tournament_info.start_date)} - {formatDate(tournament_info.end_date)}
                            </Chip>
                        </div>
                    </div>

                    {/* 右侧：按钮组 */}
                    {/* 手机端 Grid (两列)，电脑端 Flex */}
                    <div className="grid grid-cols-2 gap-3 w-full md:w-auto md:flex md:flex-wrap shrink-0 mt-2 md:mt-0">
                        {tournament_info.links.map((link) => (
                            <a
                                key={link.name}
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className="
                                    inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors md:w-auto sm:h-10 md:h-11
                                    border-zinc-200/80 bg-white/80 text-zinc-900 shadow-sm
                                    hover:bg-white hover:border-zinc-300
                                    dark:border-white/10 dark:bg-white/5 dark:text-white
                                    dark:hover:bg-white/10 dark:hover:border-white/50
                                    font-medium backdrop-blur-md
                                    md:text-base
                                "
                            >
                                <LinkIcon />
                                {link.name}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            <Card className="relative overflow-hidden border border-zinc-200/80 bg-white/95 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-white/[0.06] dark:bg-zinc-900/70 dark:shadow-[0_14px_34px_rgba(0,0,0,0.24)]">
                {themeColor && <div className="absolute inset-x-0 top-0 z-10 h-1 bg-primary" />}
                <Card.Content className="p-0">
                    <section className="px-6 py-6 md:px-8 md:py-7">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="font-bold text-lg">Staff 报名</h2>
                        </div>
                        <div className="mt-4 whitespace-pre-wrap text-zinc-600 leading-relaxed dark:text-zinc-300 text-sm sm:text-base">
                            {tournament_info.staff_registration_info}
                        </div>
                        <div className="mt-5">
                            {hasRegistrationEnded ? (
                                <Alert status="warning" className={`${alertToneClass.warning} rounded-lg border-l-[3px] px-4 py-3`}>
                                    <Alert.Content>
                                        <Alert.Title>该比赛报名已结束</Alert.Title>
                                    </Alert.Content>
                                </Alert>
                            ) : currentUser?.currentUser ? (
                                <Button onPress={handleOpenStaffModal} variant="primary" className="font-bold w-full sm:w-auto" size="lg">
                                    立即报名 Staff
                                </Button>
                            ) : (
                                <Alert status="warning" className={`${alertToneClass.warning} rounded-lg border-l-[3px] px-4 py-3`}>
                                    <Alert.Content>
                                        <Alert.Title>请登录后进行 Staff 报名</Alert.Title>
                                    </Alert.Content>
                                </Alert>
                            )}
                        </div>
                    </section>

                    <Separator className="bg-zinc-200/80 dark:bg-white/[0.06]" />

                    <section className="px-6 py-6 md:px-8 md:py-7">
                        <h2 className="font-bold text-lg">赛程</h2>
                        <div className="mt-4 whitespace-pre-wrap text-zinc-600 leading-relaxed dark:text-zinc-300 font-mono">
                            {tournament_info.tournament_schedule_info || "暂无赛程信息"}
                        </div>
                    </section>

                    <Separator className="bg-zinc-200/80 dark:bg-white/[0.06]" />

                    <section className="px-6 py-6 md:px-8 md:py-7">
                        <h2 className="font-bold text-lg">奖金</h2>
                        <div className="mt-4 whitespace-pre-wrap text-zinc-600 leading-relaxed dark:text-zinc-300">
                            {tournament_info.prize_info || "暂无奖金信息"}
                        </div>
                    </section>

                    <Separator className="bg-zinc-200/80 dark:bg-white/[0.06]" />

                    <section className="px-6 py-6 md:px-8 md:py-7">
                        <h2 className="font-bold text-lg">选手报名</h2>

                        <div className="mt-4 flex flex-col gap-4">
                            {(tournament_info.rank_max || tournament_info.rank_min) && (
                                <Alert status="default" className={`${alertToneClass.accent} rounded-lg border-l-[3px] px-4 py-3`}>
                                    <Alert.Content>
                                        <Alert.Title>{`排名限制：${tournament_info.rank_min || 0} - ${tournament_info.rank_max || "∞"}`}</Alert.Title>
                                    </Alert.Content>
                                </Alert>
                            )}

                            {tournament_info.registration_info && (
                                <div className="whitespace-pre-wrap text-zinc-600 leading-relaxed dark:text-zinc-300">
                                    {tournament_info.registration_info}
                                </div>
                            )}

                            {tournament_info.qq_group && isRegistered && (
                                <div className="flex items-center gap-2 rounded-lg border-l-[3px] border-l-emerald-400 bg-emerald-50/80 p-3 text-emerald-800 dark:bg-emerald-400/[0.08] dark:text-emerald-100">
                                    <span className="text-success font-bold text-sm">QQ群:</span>
                                    <button
                                        type="button"
                                        className="rounded-lg bg-emerald-500/15 px-2 py-1 text-sm font-bold text-emerald-700 transition-all duration-150 hover:bg-emerald-500/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:text-emerald-200"
                                        onClick={() => navigator.clipboard.writeText(tournament_info.qq_group!.toString())}
                                    >
                                        {tournament_info.qq_group.toString()}
                                    </button>
                                    <span className="text-xs text-success-600">(报名后请务必加群)</span>
                                </div>
                            )}

                            <div className="mt-2">
                                {hasRegistrationEnded ? (
                                    <Alert status="warning" className={`${alertToneClass.warning} rounded-lg border-l-[3px] px-4 py-3`}>
                                        <Alert.Content>
                                            <Alert.Title>该比赛报名已结束</Alert.Title>
                                        </Alert.Content>
                                    </Alert>
                                ) : !currentUser?.currentUser ? (
                                    <Alert status="warning" className={`${alertToneClass.warning} rounded-lg border-l-[3px] px-4 py-3`}>
                                        <Alert.Content>
                                            <Alert.Title>请点击右上角登录后进行赛事报名</Alert.Title>
                                        </Alert.Content>
                                    </Alert>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {regNotAvailable ? (
                                            <Alert status="danger" className={`${alertToneClass.danger} rounded-lg border-l-[3px] px-4 py-3`}>
                                                <Alert.Content>
                                                    <Alert.Title>您不符合报名条件</Alert.Title>
                                                    <Alert.Description>{`当前排名 #${userRank} 不在限制范围内`}</Alert.Description>
                                                </Alert.Content>
                                            </Alert>
                                        ) : (
                                            <div className="flex flex-col sm:flex-row gap-4 justify-start">
                                                <Tooltip>
                                                    <Tooltip.Trigger>
                                                        <Button
                                                            variant="primary"
                                                            size="lg"
                                                            className="font-bold w-full sm:w-auto"
                                                            isDisabled={regNotAvailable || isRegistered}
                                                            onPress={async () => {
                                                                const res = await fetch(siteConfig.backend_url + `/api/reg?tournament_name=${encodeURIComponent(tournament_info.abbreviation)}`, {
                                                                    method: 'POST', credentials: 'include'
                                                                })
                                                                if (!res.ok) alert(await res.text());
                                                                else { alert('报名成功'); setMembers(await res.json()) }
                                                            }}
                                                        >
                                                            {isRegistered ? "已报名" : "立即报名比赛"}
                                                        </Button>
                                                    </Tooltip.Trigger>
                                                    <Tooltip.Content>排名需符合赛事要求才能报名</Tooltip.Content>
                                                </Tooltip>

                                                {isRegistered && (
                                                    <Button
                                                        variant="danger-soft"
                                                        size="lg"
                                                        className="w-full sm:w-auto"
                                                        onPress={async () => {
                                                            const res = await fetch(siteConfig.backend_url + `/api/del_reg?tournament_name=${encodeURIComponent(tournament_info.abbreviation)}`, {
                                                                method: 'DELETE', credentials: 'include'
                                                            })
                                                            if (!res.ok) alert(await res.text());
                                                            else { alert('取消报名成功'); setMembers(await res.json()) }
                                                        }}
                                                    >
                                                        取消报名
                                                    </Button>
                                                )}
                                            </div>
                                        )}

                                        {isRegistered && (
                                            <Alert status="success" className={`${alertToneClass.success} rounded-lg border-l-[3px] px-4 py-3`}>
                                                <Alert.Content>
                                                    <Alert.Title>您已成功报名</Alert.Title>
                                                </Alert.Content>
                                            </Alert>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </Card.Content>
            </Card>


            {/* 队伍管理 (仅队长可见) */}
            {myTeam && (
                <Card className="overflow-hidden border border-zinc-200 bg-white shadow-md dark:border-white/[0.10] dark:bg-zinc-900/90 dark:shadow-[0_12px_30px_rgba(0,0,0,0.26)]">
                    <Card.Header className="flex items-center justify-between bg-zinc-50 px-6 py-4 dark:bg-white/[0.04]">
                        <div className="font-bold text-lg">我的队伍</div>
                        <Chip size="sm" color="warning" variant="soft">队长</Chip>
                    </Card.Header>
                    <Card.Content className="px-6 py-4 flex flex-col gap-4">
                        {/* 队伍基本信息 */}
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 shrink-0 border-2 border-default-200 text-large">
                                <Avatar.Image src={myTeam.icon_url} alt={myTeam.name}/>
                                <Avatar.Fallback>{myTeam.name.charAt(0) || "?"}</Avatar.Fallback>
                            </Avatar>
                            <div className="flex flex-col gap-1 min-w-0">
                                <span className="font-bold text-lg truncate">{myTeam.name}</span>
                                <span className="text-sm text-default-400">
                                    {myTeam.captains.length + myTeam.members.length} 名成员
                                </span>
                            </div>
                            {myTeam.is_verified ? (
                                <Chip size="sm" color="success" variant="soft" className="ml-auto shrink-0">已审核锁定</Chip>
                            ) : (
                                <Button
                                    className="ml-auto shrink-0"
                                   
                                    onPress={() => {
                                        setIconUrl(myTeam.icon_url || '');
                                        setTeamName(myTeam.name);
                                        setIconErrMsg('');
                                        onIconOpen();
                                    }}
                                >
                                    编辑队伍信息
                                </Button>
                            )}
                        </div>

                        <Separator />

                        {/* 队员列表 */}
                        <div className="flex flex-col gap-3">
                            {myTeam.captains.length > 0 && (
                                <div>
                                    <span className="text-xs font-bold text-warning uppercase mb-2 block">队长</span>
                                    <div className="flex flex-wrap gap-2">
                                        {myTeam.captains.map(uid => {
                                            const p = members.find(m => m.uid === uid);
                                            return (
                                                <Chip
                                                    key={uid}
                                                    variant="soft"
                                                    color="warning"
                                                >
                                                    <Avatar className="h-5 w-5">
                                                        <Avatar.Image src={`https://a.ppy.sh/${uid}`} alt={p?.name || `#${uid}`}/>
                                                        <Avatar.Fallback>{p?.name?.[0] ?? "?"}</Avatar.Fallback>
                                                    </Avatar>
                                                    {p?.name || `#${uid}`}
                                                </Chip>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {myTeam.members.length > 0 && (
                                <div>
                                    <span className="text-xs font-bold text-default-500 uppercase mb-2 block">队员</span>
                                    <div className="flex flex-wrap gap-2">
                                        {myTeam.members.map(uid => {
                                            const p = members.find(m => m.uid === uid);
                                            return (
                                                <Chip
                                                    key={uid}
                                                    variant="soft"
                                                >
                                                    <Avatar className="h-5 w-5">
                                                        <Avatar.Image src={`https://a.ppy.sh/${uid}`} alt={p?.name || `#${uid}`}/>
                                                        <Avatar.Fallback>{p?.name?.[0] ?? "?"}</Avatar.Fallback>
                                                    </Avatar>
                                                    {p?.name || `#${uid}`}
                                                </Chip>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card.Content>
                </Card>
            )}

            {/* 队伍信息编辑模态框 */}
            <Modal state={iconModalState}>
                <Modal.Backdrop variant="blur">
                    <Modal.Container>
                        <Modal.Dialog>
                            <Modal.Header>
                                <Modal.Heading>编辑队伍信息</Modal.Heading>
                            </Modal.Header>
                            <Separator />
                            <Modal.Body className="py-6 flex flex-col gap-4">
                                <div className="flex justify-center">
                                    <Avatar className="h-24 w-24 border-2 border-default-200 text-large">
                                        <Avatar.Image src={iconUrl || undefined} alt={teamName}/>
                                        <Avatar.Fallback>{teamName.charAt(0) || "?"}</Avatar.Fallback>
                                    </Avatar>
                                </div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="font-bold text-zinc-700 dark:text-zinc-300">队伍名称</span>
                                    <Input value={teamName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeamName(e.target.value)} />
                                </label>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="font-bold text-zinc-700 dark:text-zinc-300">头像图片链接 (URL)</span>
                                    <Input placeholder="https://..." value={iconUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIconUrl(e.target.value)} />
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">请填写图片的直链地址</span>
                                </label>
                                {iconErrMsg && (
                                    <Alert status="danger" className={`${alertToneClass.danger} rounded-lg border-l-[3px] px-4 py-3`}>
                                        <Alert.Content>
                                            <Alert.Title>{iconErrMsg}</Alert.Title>
                                        </Alert.Content>
                                    </Alert>
                                )}
                            </Modal.Body>
                            <Separator />
                            <Modal.Footer>
                                <Button variant="danger-soft" onPress={onIconClose}>取消</Button>
                                <Button
                                    variant="primary"
                                    className="font-bold"
                                    isPending={isUpdatingIcon}
                                    onPress={async () => {
                                        if (!teamName.trim()) {
                                            setIconErrMsg('队伍名称不能为空');
                                            return;
                                        }
                                        setIsUpdatingIcon(true);
                                        setIconErrMsg('');
                                        try {
                                            const res = await fetch(
                                                siteConfig.backend_url + `/api/update-team-icon?tournament_name=${encodeURIComponent(tournament_info.abbreviation)}&team_name=${encodeURIComponent(myTeam!.name)}`,
                                                {
                                                    method: 'PATCH',
                                                    body: JSON.stringify({icon_url: iconUrl, name: teamName.trim()}),
                                                    headers: {'Content-Type': 'application/json'},
                                                    credentials: 'include'
                                                }
                                            );
                                            if (!res.ok) {
                                                setIconErrMsg(await res.text());
                                            } else {
                                                setTeams(prev => prev.map(t =>
                                                    t.name === myTeam!.name
                                                        ? {...t, icon_url: iconUrl, name: teamName.trim()}
                                                        : t
                                                ));
                                                onIconClose();
                                                alert('队伍信息更新成功');
                                            }
                                        } catch {
                                            setIconErrMsg('网络请求失败');
                                        } finally {
                                            setIsUpdatingIcon(false);
                                        }
                                    }}
                                >
                                    保存
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>

            {/* Staff 模态框保持不变 */}
             <Modal state={staffModalState}>
                 <Modal.Backdrop variant="blur">
                    <Modal.Container size="lg" scroll="inside">
                        <Modal.Dialog>
                            <Modal.Header className="flex flex-col gap-1 text-xl">
                                <Modal.Heading>报名 Staff - {tournament_info.abbreviation}</Modal.Heading>
                            </Modal.Header>
                            <Separator />
                            <Modal.Body className="py-6 flex flex-col gap-6">
                                <Alert status="default" className={`${alertToneClass.default} rounded-lg border-l-[3px] px-4 py-3`}>
                                    <Alert.Content>
                                        <Alert.Title>请务必填写真实有效的信息，以便我们与您联系。</Alert.Title>
                                    </Alert.Content>
                                </Alert>

                                <div className="flex flex-col gap-4">
                                    <label className="flex flex-col gap-1 text-sm">
                                        <span className="font-bold text-zinc-700 dark:text-zinc-300">QQ号</span>
                                        <Input required placeholder="请输入您的QQ号码"
                                               onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, qqNumber: e.target.value})}/>
                                    </label>

                                    <div className="flex flex-col gap-2">
                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">是否第一次担任 Staff？</span>
                                        <RadioGroup
                                            orientation="horizontal"
                                            isRequired
                                            className="ml-1 flex flex-wrap gap-3"
                                            onChange={(value: string) => setFormData({...formData, isFirstTimeStaff: (value !== "")})}
                                        >
                                            <Radio value="1" className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                                                <Radio.Control><Radio.Indicator /></Radio.Control>
                                                <Radio.Content>是</Radio.Content>
                                            </Radio>
                                            <Radio value="" className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                                                <Radio.Control><Radio.Indicator /></Radio.Control>
                                                <Radio.Content>否</Radio.Content>
                                            </Radio>
                                        </RadioGroup>
                                    </div>
                                </div>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="font-bold text-zinc-700 dark:text-zinc-300">赛事经验</span>
                                    <TextArea rows={3} placeholder="请简述您参与过的比赛及担任的职位..."
                                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, tournamentExperience: e.target.value})} />
                                </label>
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">选择意向职位</span>
                                    <CheckboxGroup isRequired className="flex flex-wrap gap-4"
                                        onChange={(value: string[]) => setFormData({...formData, selectedPositions: value})}>
                                        {tournament_info.streamer && <Checkbox value="直播" className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200"><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Content>直播</Checkbox.Content></Checkbox>}
                                        {tournament_info.referee && <Checkbox value="裁判" className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200"><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Content>裁判</Checkbox.Content></Checkbox>}
                                        {tournament_info.commentator && <Checkbox value="解说" className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200"><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Content>解说</Checkbox.Content></Checkbox>}
                                        {tournament_info.mappooler && <Checkbox value="选图" className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200"><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Content>选图</Checkbox.Content></Checkbox>}
                                        {tournament_info.custom_mapper && <Checkbox value="作图" className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200"><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Content>作图</Checkbox.Content></Checkbox>}
                                        {tournament_info.designer && <Checkbox value="设计" className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200"><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Content>设计</Checkbox.Content></Checkbox>}
                                        {tournament_info.scheduler && <Checkbox value="赛程安排" className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200"><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Content>赛程安排</Checkbox.Content></Checkbox>}
                                        {tournament_info.map_tester && <Checkbox value="测图" className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200"><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Content>测图</Checkbox.Content></Checkbox>}
                                    </CheckboxGroup>
                                </div>
                                <div className="flex flex-col gap-4">
                                     <label className="flex flex-col gap-1 text-sm">
                                         <span className="font-bold text-zinc-700 dark:text-zinc-300">其他说明 (选填)</span>
                                         <TextArea rows={2} placeholder="例如：擅长Mania 4K/7K，有作图经验等..."
                                                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, otherDetails: e.target.value})} />
                                     </label>
                                     <label className="flex flex-col gap-1 text-sm">
                                         <span className="font-bold text-zinc-700 dark:text-zinc-300">补充信息 (选填)</span>
                                         <TextArea rows={2}
                                                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, additionalComments: e.target.value})} />
                                     </label>
                                </div>
                                {errMsg && (
                                    <Alert status="danger" className={`${alertToneClass.danger} rounded-lg border-l-[3px] px-4 py-3`}>
                                        <Alert.Content>
                                            <Alert.Title>{errMsg}</Alert.Title>
                                        </Alert.Content>
                                    </Alert>
                                )}
                            </Modal.Body>
                            <Separator />
                            <Modal.Footer>
                                <Button variant="danger-soft" onPress={onClose}>取消</Button>
                                <Button variant="primary" onPress={() => handleRegistration(onClose)} className="font-bold">提交报名</Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </div>
    );
}

export type TournamentStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'hidden';


export interface TournamentInfo {
    name: string;
    abbreviation: string;
    start_date: string
    end_date: string
    pic_url: string;
    theme_color?: string;
    links: Link[];
    is_group: boolean;
    description?: string;
    staff_registration_info?: string;
    tournament_schedule_info?: string;
    registration_info?: string;
    prize_info?: string;
    rules_info?: string;
    rank_min?: number;
    rank_max?: number;
    referee: boolean;
    streamer: boolean;
    commentator: boolean;
    mappooler: boolean;
    custom_mapper: boolean;
    donator: boolean;
    designer: boolean;
    scheduler: boolean;
    map_tester: boolean;
    mode: string;
    challonge_api_key?: string;
    challonge_tournament_url?: string;
    is_verified?: boolean;
    qq_group?: number;
    status: TournamentStatus;
    reject_reason?: string;
}

type Link = {
    name: string;
    url: string;
}

export type RegistrationInfo = {
    tournament: string;
    uid?: number;
    qqNumber: string;
    isFirstTimeStaff?: boolean;
    tournamentExperience: string;
    selectedPositions: string[];
    otherDetails: string;
    additionalComments: string;
}

async function getPlayers(tournament_name: string, revalidate_time: number = 0): Promise<TournamentPlayers> {
    const res = await fetch(siteConfig.backend_url + '/api/players?tournament_name=' + tournament_name,
        {next: {revalidate: revalidate_time}})
    return await res.json()
}

