"use client"

import {useDisclosure} from "@heroui/use-disclosure";
import {Alert} from "@heroui/alert";
import {Card, CardBody, CardFooter, CardHeader} from "@heroui/card";
import {Divider} from "@heroui/divider";
import {Button} from "@heroui/button";
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/modal";
import {Link} from "@heroui/link";
import {Input, Textarea} from "@heroui/input";
import {Radio, RadioGroup} from "@heroui/radio";
import {Checkbox, CheckboxGroup} from "@heroui/checkbox";
import {useCallback, useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {Tooltip} from "@heroui/tooltip";
import {siteConfig} from "@/config/site";
import {Player, TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {Image} from "@heroui/image";
import NextImage from "next/image";
import {Chip} from "@heroui/chip";
import {Snippet} from "@heroui/snippet";


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
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [errMsg, setErrMsg] = useState('');
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
        }
    }

    const regNotAvailable = userRank
        && (
            (tournament_info.rank_min && userRank < tournament_info.rank_min) ||
            (tournament_info.rank_max && userRank > tournament_info.rank_max) ||
            (new Date(tournament_info.start_date) < new Date())
        );

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('zh-CN');
    const isRegistered = members.some((member) => member.player && member.uid === currentUser?.currentUser?.uid);
    const fallbackImage = "https://nextui.org/images/card-example-4.jpeg";
    const bgSrc = tournament_info.pic_url || fallbackImage;
    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto px-2 pb-10">
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
                            variant="solid"
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

            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-zinc-950 group border border-white/10">

                <div className="absolute inset-0 z-0">
                    <Image
                        as={NextImage}
                        removeWrapper
                        src={bgSrc}
                        alt="Background"
                        fill
                        className="object-cover blur-[60px] opacity-50 scale-125"
                        quality={10}
                        priority
                    />
                    {/* 黑色遮罩，增强文字对比度 */}
                    <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* --- 主体层 --- */}
                <div className="relative z-10 w-full aspect-video md:aspect-[21/9] flex items-center justify-center">
                    <Image
                        as={NextImage}
                        removeWrapper
                        src={bgSrc}
                        alt={tournament_info.name}
                        width={1200}
                        height={600}
                        style={{ width: '100%', height: '100%' }}
                        className="w-full h-full object-contain drop-shadow-2xl z-10"
                        priority
                    />
                </div>

                <div className="
                    relative z-30 flex flex-col justify-between gap-4
                    p-5 md:p-8

                    /* === 手机端样式 === */
                    bg-zinc-900 border-t border-white/5  /* 纯色背景，有顶部分割线 */

                    /* === 电脑端样式 (覆盖手机端) === */
                    md:border-t-0                        /* 移除分割线 */
                    md:bg-transparent md:bg-gradient-to-t md:from-black/95 md:via-black/70 md:to-transparent /* 渐变背景 */
                    md:absolute md:bottom-0 md:left-0 md:right-0 /* 绝对定位到底部 */
                    md:flex-row md:items-end             /* 左右布局，底部对齐 */
                ">

                    {/* 左侧：标题与信息 */}
                    <div className="flex flex-col gap-2 w-full md:w-auto flex-1 min-w-0">
                        {/* 标题 */}
                        <h1 className="text-xl md:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                            {tournament_info.name}
                        </h1>

                        {/* 标签组 */}
                        <div className="flex flex-wrap gap-2 items-center mt-1">
                            <Chip color="primary" size="sm" variant="shadow" className="font-bold uppercase md:text-md">
                                {tournament_info.mode}
                            </Chip>
                            <Chip startContent={<CalendarIcon/>} size="sm" variant="flat" className="text-zinc-300 bg-white/5 border border-white/10 md:text-white/90 md:bg-white/10 md:backdrop-blur-md">
                                {formatDate(tournament_info.start_date)} - {formatDate(tournament_info.end_date)}
                            </Chip>
                        </div>
                    </div>

                    {/* 右侧：按钮组 */}
                    {/* 手机端 Grid (两列)，电脑端 Flex */}
                    <div className="grid grid-cols-2 gap-3 w-full md:w-auto md:flex md:flex-wrap shrink-0 mt-2 md:mt-0">
                        {tournament_info.links.map((link) => (
                            <Button
                                key={link.name}
                                as={Link}
                                href={link.url}
                                isExternal
                                size="md"
                                className="
                                    w-full md:w-auto sm:h-10 md:h-11
                                    border-white/10 bg-white/5 text-white
                                    hover:bg-white/10 hover:border-white/50
                                    font-medium backdrop-blur-md
                                    md:text-base
                                "
                                variant="bordered"
                                startContent={<LinkIcon />}
                            >
                                {link.name}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. Staff 报名卡片 (保持之前修复的左对齐样式) */}
            <Card className="border border-white/5 bg-content1 shadow-md">
                <CardHeader className="flex justify-between items-center px-6 py-4 bg-default-50/50">
                    <div className="font-bold text-lg">Staff 报名</div>
                </CardHeader>

                <CardBody className="px-6 pt-4 pb-2 gap-4">
                    <div className="whitespace-pre-wrap text-default-600 leading-relaxed text-sm sm:text-base">
                        {tournament_info.staff_registration_info}
                    </div>
                </CardBody>

                {currentUser?.currentUser ? (
                    <CardFooter className="px-6 pb-6 pt-2 flex justify-start">
                                                <Button onPress={handleOpenStaffModal} color="secondary" variant="shadow" className="font-bold w-full sm:w-auto" size="lg">
                            立即报名 Staff
                        </Button>
                    </CardFooter>
                ) : (
                    <CardFooter className="px-6 py-3 bg-warning/10 justify-start">
                         <p className="text-warning text-sm">请登录后进行 Staff 报名</p>
                    </CardFooter>
                )}
            </Card>

            {/* 4. 赛程 */}
            <Card className="border border-white/5 bg-content1 shadow-md">
                <CardHeader className="px-6 py-4 bg-default-50/50">
                    <div className="font-bold text-lg">赛程</div>
                </CardHeader>
                <CardBody className="px-6 py-4">
                    <div className="whitespace-pre-wrap text-default-600 leading-relaxed font-mono">
                        {tournament_info.tournament_schedule_info || "暂无赛程信息"}
                    </div>
                </CardBody>
            </Card>

            {/* 5. 奖金 */}
            <Card className="border border-white/5 bg-content1 shadow-md">
                <CardHeader className="px-6 py-4 bg-default-50/50">
                    <div className="font-bold text-lg">奖金</div>
                </CardHeader>
                <CardBody className="px-6 py-4">
                    <div className="whitespace-pre-wrap text-default-600 leading-relaxed">
                        {tournament_info.prize_info || "暂无奖金信息"}
                    </div>
                </CardBody>
            </Card>

            <Card className="border border-white/5 bg-content1 shadow-md">
                <CardHeader className="px-6 py-4 bg-default-50/50">
                    <div className="font-bold text-lg">选手报名</div>
                </CardHeader>
                {/* 移除 Divider */}

                <CardBody className="px-6 py-4 gap-4">
                     {(tournament_info.rank_max || tournament_info.rank_min) && (
                        <Alert
                            color="primary"
                            variant="faded"
                            title={`排名限制：${tournament_info.rank_min || 0} - ${tournament_info.rank_max || "∞"}`}
                        />
                    )}

                    {tournament_info.registration_info && (
                        <div className="whitespace-pre-wrap text-default-600 leading-relaxed">
                            {tournament_info.registration_info}
                        </div>
                    )}

                    {tournament_info.qq_group && isRegistered && (
                        <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
                            <span className="text-success font-bold text-sm">QQ群:</span>
                            <Snippet symbol="" codeString={tournament_info.qq_group.toString()} color="success" size="sm" variant="flat">
                                {tournament_info.qq_group.toString()}
                            </Snippet>
                            <span className="text-xs text-success-600">(报名后请务必加群)</span>
                        </div>
                    )}

                    <div className="mt-2">
                        {(new Date(tournament_info.start_date) < new Date()) ? (
                            <Alert color="warning" title="该比赛报名已结束" />
                        ) : !currentUser?.currentUser ? (
                            <Alert color="warning" variant="faded" title="请点击右上角登录后进行赛事报名" />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {regNotAvailable ? (
                                    <Alert color="danger" title="您不符合报名条件" description={`当前排名 #${userRank} 不在限制范围内`} />
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-4 justify-start">
                                        <Tooltip content="排名需符合赛事要求才能报名">
                                            <Button
                                                color="primary"
                                                variant="shadow"
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
                                        </Tooltip>

                                        {isRegistered && (
                                            <Button
                                                color="danger"
                                                variant="ghost"
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
                                    <Alert color="success" variant="flat" title="您已成功报名" />
                                )}
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>


            {/* Staff 模态框保持不变 */}
             <Modal isOpen={isOpen} onOpenChange={handleOpenChange} size="2xl" scrollBehavior="inside" backdrop="blur">
                 <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 text-xl">
                                报名 Staff - {tournament_info.abbreviation}
                            </ModalHeader>
                            <Divider />
                            <ModalBody className="py-6 flex flex-col gap-6">
                                <Alert color="default" variant="flat" title="请务必填写真实有效的信息，以便我们与您联系。" />

                                <div className="flex flex-col gap-4">
                                    <Input isRequired label="QQ号" placeholder="请输入您的QQ号码" variant="bordered" labelPlacement="outside"
                                           onChange={(e) => setFormData({...formData, qqNumber: e.target.value})}/>

                                    <div className="flex flex-col gap-2">
                                        <p className="text-small text-foreground-500">是否第一次担任 Staff？ <span className="text-danger">*</span></p>
                                        <RadioGroup orientation="horizontal" isRequired className="ml-1"
                                            onChange={(e) => setFormData({...formData, isFirstTimeStaff: (e.target.value !== "")})}>
                                            <Radio value="1">是</Radio>
                                            <Radio value="">否</Radio>
                                        </RadioGroup>
                                    </div>
                                </div>
                                <Textarea minRows={3} label="赛事经验" placeholder="请简述您参与过的比赛及担任的职位..." variant="bordered" labelPlacement="outside"
                                    onChange={(e) => setFormData({...formData, tournamentExperience: e.target.value})} />
                                <div>
                                    <p className="text-small text-foreground-500 mb-3">选择意向职位 <span className="text-danger">*</span></p>
                                    <CheckboxGroup orientation="horizontal" className="gap-4"
                                        //@ts-ignore
                                        onChange={(value: string[]) => setFormData({...formData, selectedPositions: value})}>
                                        {tournament_info.streamer && <Checkbox value="直播">直播</Checkbox>}
                                        {tournament_info.referee && <Checkbox value="裁判">裁判</Checkbox>}
                                        {tournament_info.commentator && <Checkbox value="解说">解说</Checkbox>}
                                        {tournament_info.mappooler && <Checkbox value="选图">选图</Checkbox>}
                                        {tournament_info.custom_mapper && <Checkbox value="作图">作图</Checkbox>}
                                        {tournament_info.designer && <Checkbox value="设计">设计</Checkbox>}
                                        {tournament_info.scheduler && <Checkbox value="赛程安排">赛程安排</Checkbox>}
                                        {tournament_info.map_tester && <Checkbox value="测图">测图</Checkbox>}
                                    </CheckboxGroup>
                                </div>
                                <div className="flex flex-col gap-4">
                                     <Textarea minRows={2} label="其他说明 (选填)" variant="bordered" labelPlacement="outside" placeholder="例如：擅长Mania 4K/7K，有作图经验等..."
                                        onChange={(e) => setFormData({...formData, otherDetails: e.target.value})} />
                                     <Textarea minRows={2} label="补充信息 (选填)" variant="bordered" labelPlacement="outside"
                                        onChange={(e) => setFormData({...formData, additionalComments: e.target.value})} />
                                </div>
                                {errMsg && <Alert color="danger" title={errMsg} />}
                            </ModalBody>
                            <Divider />
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>取消</Button>
                                <Button color="primary" onPress={() => handleRegistration(onClose)} className="font-bold">提交报名</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
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
