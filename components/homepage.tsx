"use client"

import {createContext, ReactNode, useCallback, useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {siteConfig} from "@/config/site";
import {Player, Team, TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import NextImage from "next/image";

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

const Alert = ({title, description, color = "default", className = ""}: any) => (
    <div className={`rounded-xl border border-zinc-200 px-4 py-3 text-sm dark:border-white/[0.08] ${colorClass[color] || colorClass.default} ${className}`}>
        {title && <div className="font-bold">{title}</div>}
        {description && <div className="mt-1 text-xs opacity-80">{description}</div>}
    </div>
);

const hasPaddingClass = (className: string) => /\b!?p[trblxy]?-[^\s]+/.test(className);

const Card = ({children, className = ""}: any) => (
    <div className={`relative overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-100 ${className}`}>{children}</div>
);
const CardHeader = ({children, className = ""}: any) => <div className={`${hasPaddingClass(className) ? "" : "p-4"} ${className}`}>{children}</div>;
const CardBody = ({children, className = ""}: any) => <div className={`${hasPaddingClass(className) ? "" : "p-4"} ${className}`}>{children}</div>;
const CardFooter = ({children, className = ""}: any) => <div className={`${hasPaddingClass(className) ? "" : "p-4"} ${className}`}>{children}</div>;
const Divider = ({className = ""}: any) => <div className={`h-px bg-white/[0.08] ${className}`}/>;

const Link = ({children, href, isExternal, className = "", ...props}: any) => (
    <a {...props} href={href} target={isExternal ? "_blank" : props.target} rel={isExternal ? "noreferrer" : props.rel} className={className}>{children}</a>
);

const Button = ({children, href, as, isExternal, onPress, onClick, isDisabled, disabled, className = "", color = "default", variant, size, startContent, endContent, isLoading, ...props}: any) => {
    const classes = `inline-flex items-center justify-center gap-2 rounded-xl px-4 ${size === "lg" ? "py-3 text-base" : "py-2 text-sm"} font-bold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${color === "primary" || color === "secondary" ? "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90" : colorClass[color] || colorClass.default} ${variant === "light" ? "bg-transparent shadow-none hover:bg-white/[0.06]" : ""} ${className}`;
    if (href || as) {
        return <a {...props} href={href} target={isExternal ? "_blank" : props.target} rel={isExternal ? "noreferrer" : props.rel} className={classes} onClick={onPress || onClick}>{startContent}{children}{endContent}</a>;
    }
    return <button {...props} type={props.type || "button"} disabled={disabled || isDisabled || isLoading} className={classes} onClick={onPress || onClick}>{startContent}{children}{endContent}</button>;
};

const Field = ({as: Component = "input", label, description, value, onValueChange, onChange, placeholder, className = "", ...props}: any) => (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
        {label && <span className="font-bold text-zinc-700 dark:text-zinc-300">{label}</span>}
        <Component
            {...props}
            value={value}
            placeholder={placeholder}
            className="min-h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-primary dark:border-white/[0.08] dark:bg-black dark:text-zinc-100 dark:placeholder:text-zinc-600"
            onChange={(event: any) => {
                onValueChange?.(event.target.value);
                onChange?.(event);
            }}
        />
        {description && <span className="text-xs text-zinc-500 dark:text-zinc-400">{description}</span>}
    </label>
);
const Input = (props: any) => <Field {...props}/>;
const Textarea = (props: any) => <Field {...props} as="textarea"/>;

const RadioGroup = ({children, label, value, onValueChange, onChange, className = ""}: any) => (
    <div className={`flex flex-col gap-2 ${className}`}>
        {label && <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{label}</span>}
        <div className="flex flex-wrap gap-3">
            {Array.isArray(children) ? children.map((child: any) => ({...child, props: {...child.props, checked: child.props.value === value, onChange: () => {
                onValueChange?.(child.props.value);
                onChange?.({target: {value: child.props.value}});
            }}})) : children}
        </div>
    </div>
);
const Radio = ({children, value, checked, onChange}: any) => (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
        <input type="radio" value={value} checked={checked} onChange={onChange} className="accent-primary"/>
        {children}
    </label>
);
const CheckboxGroup = ({children, label, value = [], onValueChange, className = ""}: any) => (
    <div className={`flex flex-col gap-2 ${className}`}>
        {label && <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{label}</span>}
        <div className="flex flex-wrap gap-3">
            {Array.isArray(children) ? children.map((child: any) => {
                const checked = value.includes(child.props.value);
                return {...child, props: {...child.props, checked, onChange: () => onValueChange?.(checked ? value.filter((item: string) => item !== child.props.value) : [...value, child.props.value])}};
            }) : children}
        </div>
    </div>
);
const Checkbox = ({children, value, checked, onChange}: any) => (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
        <input type="checkbox" value={value} checked={checked} onChange={onChange} className="accent-primary"/>
        {children}
    </label>
);

const TooltipRoot = ({children, className = ""}: any) => <span className={`group relative inline-flex ${className}`}>{children}</span>;
const TooltipTrigger = ({children, className = ""}: any) => <span className={`inline-flex ${className}`}>{children}</span>;
const TooltipContent = ({children, color = "default", className = ""}: any) => (
    <span role="tooltip" className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium shadow-lg group-hover:block group-focus-within:block ${colorClass[color] || colorClass.default} ${className}`}>
        {children}
    </span>
);
const Tooltip = Object.assign(TooltipRoot, {
    Trigger: TooltipTrigger,
    Content: TooltipContent,
});
const Image = ({as: Component, className = "", src, alt = "", removeWrapper, radius, isZoomed, shadow, fallbackSrc, fill, priority, sizes, quality, ...props}: any) => {
    if (Component) {
        return (
            <Component
                {...props}
                src={src}
                alt={alt}
                className={className}
                fill={fill}
                priority={priority}
                sizes={sizes}
                quality={quality}
            />
        );
    }

    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} src={src} alt={alt} className={className}/>;
};
const Avatar = ({src, name, className = ""}: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name || ""} className={`h-8 w-8 rounded-full object-cover ${className}`}/>
);
const Chip = ({children, color = "default", className = "", startContent, avatar}: any) => (
    <span className={`inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${colorClass[color] || colorClass.default} ${className}`}>
        {startContent}
        {avatar}
        {children}
    </span>
);
const Snippet = ({children, codeString}: any) => (
    <button type="button" className="rounded-lg bg-emerald-500/15 px-2 py-1 text-sm font-bold text-emerald-300 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50" onClick={() => navigator.clipboard.writeText(codeString || String(children))}>
        {children}
    </button>
);

const ModalContext = createContext({onClose: () => {}});
type ModalRenderProps = { close: () => void };
const getModalPlacementClass = (placement?: string) => {
    if (placement === "top-center" || placement === "top") return "items-start pt-16";
    if (placement === "bottom") return "items-end pb-8";
    return "items-center";
};
const getModalWidthClass = (size?: string) => {
    if (size === "5xl") return "max-w-5xl";
    if (size === "4xl") return "max-w-4xl";
    if (size === "3xl") return "max-w-3xl";
    if (size === "2xl") return "max-w-2xl";
    if (size === "xl") return "max-w-xl";
    return "max-w-lg";
};
const ModalRoot = ({isOpen, onOpenChange, children}: any) => {
    if (!isOpen) return null;
    return (
        <ModalContext.Provider value={{onClose: () => onOpenChange?.(false)}}>
            {children}
        </ModalContext.Provider>
    );
};
const ModalBackdrop = ({children, className = "", variant = "opaque", isDismissable = true}: any) => {
    const {onClose} = useContext(ModalContext);

    return (
        <div className={`fixed inset-0 z-[100] flex justify-center bg-zinc-950/40 p-4 dark:bg-black/70 ${variant === "blur" ? "backdrop-blur-sm" : ""} ${className}`} onMouseDown={isDismissable ? onClose : undefined}>
            {children}
        </div>
    );
};
const ModalContainer = ({children, className = "", placement = "center", size = "2xl", scroll = "inside"}: any) => (
    <div className={`flex w-full justify-center ${getModalPlacementClass(placement)} ${className}`}>
        <div className={`w-full ${getModalWidthClass(size)} ${scroll === "inside" ? "max-h-[90vh]" : ""}`}>{children}</div>
    </div>
);
const ModalDialog = ({children, className = ""}: { children?: ReactNode | ((props: ModalRenderProps) => ReactNode); className?: string }) => {
    const {onClose} = useContext(ModalContext);

    return (
        <div className={`overflow-y-auto rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl dark:border-white/[0.08] dark:bg-zinc-950 dark:text-zinc-100 ${className}`} onMouseDown={(event) => event.stopPropagation()}>
            {typeof children === "function" ? children({close: onClose}) : children}
        </div>
    );
};
const ModalHeader = ({children, className = ""}: any) => <div className={`border-b border-zinc-200 p-5 dark:border-white/[0.08] ${className}`}>{children}</div>;
const ModalHeading = ({children, className = ""}: any) => <div className={`font-black ${className}`}>{children}</div>;
const ModalBody = ({children, className = ""}: any) => <div className={`p-5 ${className}`}>{children}</div>;
const ModalFooter = ({children, className = ""}: any) => <div className={`flex justify-end gap-3 border-t border-zinc-200 p-5 dark:border-white/[0.08] ${className}`}>{children}</div>;
type ModalComponent = typeof ModalRoot & {
    Backdrop: typeof ModalBackdrop;
    Container: typeof ModalContainer;
    Dialog: typeof ModalDialog;
    Header: typeof ModalHeader;
    Heading: typeof ModalHeading;
    Body: typeof ModalBody;
    Footer: typeof ModalFooter;
};

const Modal: ModalComponent = Object.assign(ModalRoot, {
    Backdrop: ModalBackdrop,
    Container: ModalContainer,
    Dialog: ModalDialog,
    Header: ModalHeader,
    Heading: ModalHeading,
    Body: ModalBody,
    Footer: ModalFooter,
});
const ModalContent = ({children}: { children: ReactNode | ((onClose: () => void) => ReactNode) }) => {
    const {onClose} = useContext(ModalContext);
    return <ModalDialog>{typeof children === "function" ? ({close}: {close: () => void}) => children(close) : children}</ModalDialog>;
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
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const {isOpen: isIconOpen, onOpen: onIconOpen, onOpenChange: onIconOpenChange} = useDisclosure();
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

            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-white group border border-zinc-200 dark:bg-[#161b24] dark:border-white/15 dark:shadow-[0_18px_45px_rgba(0,0,0,0.45)]">

                <div className="absolute inset-0 z-0">
                    <Image
                        as={NextImage}
                        removeWrapper
                        src={bgSrc}
                        alt=""
                        fill
                        sizes="100vw"
                        className="object-cover blur-[60px] opacity-50 scale-125"
                        quality={10}
                    />
                    {/* 黑色遮罩，增强文字对比度 */}
                    <div className="absolute inset-0 bg-white/10 dark:bg-black/20" />
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
                    bg-white border-t border-zinc-200 dark:bg-[#131821]/95 dark:border-white/10  /* 纯色背景，有顶部分割线 */

                    /* === 电脑端样式 (覆盖手机端) === */
                    md:border-t-0                        /* 移除分割线 */
                    md:bg-transparent md:bg-gradient-to-t md:from-white/95 md:via-white/70 md:to-transparent md:dark:bg-transparent md:dark:from-black/95 md:dark:via-black/70 md:dark:to-transparent /* 渐变背景 */
                    md:absolute md:bottom-0 md:left-0 md:right-0 /* 绝对定位到底部 */
                    md:flex-row md:items-end             /* 左右布局，底部对齐 */
                ">

                    {/* 左侧：标题与信息 */}
                    <div className="flex flex-col gap-2 w-full md:w-auto flex-1 min-w-0">
                        {/* 标题 */}
                        <h1 className="text-xl md:text-4xl font-black text-zinc-950 tracking-tight leading-tight drop-shadow-md dark:text-white">
                            {tournament_info.name}
                        </h1>

                        {/* 标签组 */}
                        <div className="flex flex-wrap gap-2 items-center mt-1">
                            <Chip color="primary" size="sm" variant="shadow" className="uppercase md:text-md">
                                {tournament_info.mode}
                            </Chip>
                            <Chip startContent={<CalendarIcon/>} size="sm" variant="flat" className="text-zinc-700 bg-zinc-100 border border-zinc-200 md:bg-white/70 md:backdrop-blur-md dark:text-zinc-300 dark:bg-white/5 dark:border-white/10 dark:md:text-white/90 dark:md:bg-white/10">
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
                                    border-zinc-200 bg-zinc-100 text-zinc-900
                                    hover:bg-zinc-200 hover:border-zinc-300
                                    dark:border-white/10 dark:bg-white/5 dark:text-white
                                    dark:hover:bg-white/10 dark:hover:border-white/50
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

            <Card className="border border-zinc-200 bg-white shadow-xl dark:border-white/15 dark:bg-[#181f2b] dark:shadow-[0_18px_45px_rgba(0,0,0,0.42)]">
                <CardBody className="p-0">
                    <section className="px-6 py-6 md:px-8 md:py-7">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="font-bold text-lg">Staff 报名</h2>
                        </div>
                        <div className="mt-4 whitespace-pre-wrap text-zinc-600 leading-relaxed dark:text-zinc-300 text-sm sm:text-base">
                            {tournament_info.staff_registration_info}
                        </div>
                        <div className="mt-5">
                            {hasRegistrationEnded ? (
                                <Alert color="warning" title="该比赛报名已结束" />
                            ) : currentUser?.currentUser ? (
                                <Button onPress={handleOpenStaffModal} color="secondary" variant="shadow" className="font-bold w-full sm:w-auto" size="lg">
                                    立即报名 Staff
                                </Button>
                            ) : (
                                <Alert color="warning" title="请登录后进行 Staff 报名" />
                            )}
                        </div>
                    </section>

                    <Divider className="bg-zinc-200 dark:bg-white/10" />

                    <section className="px-6 py-6 md:px-8 md:py-7">
                        <h2 className="font-bold text-lg">赛程</h2>
                        <div className="mt-4 whitespace-pre-wrap text-zinc-600 leading-relaxed dark:text-zinc-300 font-mono">
                            {tournament_info.tournament_schedule_info || "暂无赛程信息"}
                        </div>
                    </section>

                    <Divider className="bg-zinc-200 dark:bg-white/10" />

                    <section className="px-6 py-6 md:px-8 md:py-7">
                        <h2 className="font-bold text-lg">奖金</h2>
                        <div className="mt-4 whitespace-pre-wrap text-zinc-600 leading-relaxed dark:text-zinc-300">
                            {tournament_info.prize_info || "暂无奖金信息"}
                        </div>
                    </section>

                    <Divider className="bg-zinc-200 dark:bg-white/10" />

                    <section className="px-6 py-6 md:px-8 md:py-7">
                        <h2 className="font-bold text-lg">选手报名</h2>

                        <div className="mt-4 flex flex-col gap-4">
                            {(tournament_info.rank_max || tournament_info.rank_min) && (
                                <Alert
                                    color="primary"
                                    variant="faded"
                                    title={`排名限制：${tournament_info.rank_min || 0} - ${tournament_info.rank_max || "∞"}`}
                                />
                            )}

                            {tournament_info.registration_info && (
                                <div className="whitespace-pre-wrap text-zinc-600 leading-relaxed dark:text-zinc-300">
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
                                {hasRegistrationEnded ? (
                                    <Alert color="warning" title="该比赛报名已结束" />
                                ) : !currentUser?.currentUser ? (
                                    <Alert color="warning" variant="faded" title="请点击右上角登录后进行赛事报名" />
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {regNotAvailable ? (
                                            <Alert color="danger" title="您不符合报名条件" description={`当前排名 #${userRank} 不在限制范围内`} />
                                        ) : (
                                            <div className="flex flex-col sm:flex-row gap-4 justify-start">
                                                <Tooltip>
                                                    <Tooltip.Trigger>
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
                                                    </Tooltip.Trigger>
                                                    <Tooltip.Content>排名需符合赛事要求才能报名</Tooltip.Content>
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
                        </div>
                    </section>
                </CardBody>
            </Card>


            {/* 队伍管理 (仅队长可见) */}
            {myTeam && (
                <Card className="border border-zinc-200 bg-white shadow-md dark:border-white/5 dark:bg-zinc-950">
                    <CardHeader className="px-6 py-4 bg-zinc-50 dark:bg-white/5 flex justify-between items-center">
                        <div className="font-bold text-lg">我的队伍</div>
                        <Chip size="sm" color="warning" variant="flat">队长</Chip>
                    </CardHeader>
                    <CardBody className="px-6 py-4 flex flex-col gap-4">
                        {/* 队伍基本信息 */}
                        <div className="flex items-center gap-4">
                            <Avatar
                                src={myTeam.icon_url}
                                name={myTeam.name.charAt(0)}
                                className="w-16 h-16 text-large shrink-0"
                                isBordered
                            />
                            <div className="flex flex-col gap-1 min-w-0">
                                <span className="font-bold text-lg truncate">{myTeam.name}</span>
                                <span className="text-sm text-default-400">
                                    {myTeam.captains.length + myTeam.members.length} 名成员
                                </span>
                            </div>
                            {myTeam.is_verified ? (
                                <Chip size="sm" color="success" variant="flat" className="ml-auto shrink-0">已审核锁定</Chip>
                            ) : (
                                <Button
                                    className="ml-auto shrink-0"
                                    color="primary"
                                    variant="flat"
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

                        <Divider />

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
                                                    variant="flat"
                                                    color="warning"
                                                    avatar={<Avatar src={`https://a.ppy.sh/${uid}`} name={p?.name} />}
                                                >
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
                                                    variant="flat"
                                                    avatar={<Avatar src={`https://a.ppy.sh/${uid}`} name={p?.name} />}
                                                >
                                                    {p?.name || `#${uid}`}
                                                </Chip>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* 队伍信息编辑模态框 */}
            <Modal isOpen={isIconOpen} onOpenChange={onIconOpenChange}>
                <Modal.Backdrop variant="blur">
                    <Modal.Container>
                        <Modal.Dialog>
                            {({close}) => (
                                <>
                                    <Modal.Header>
                                        <Modal.Heading>编辑队伍信息</Modal.Heading>
                                    </Modal.Header>
                            <Divider />
                            <Modal.Body className="py-6 flex flex-col gap-4">
                                <div className="flex justify-center">
                                    <Avatar
                                        src={iconUrl || undefined}
                                        name={teamName.charAt(0)}
                                        className="w-24 h-24 text-large"
                                        isBordered
                                    />
                                </div>
                                <Input
                                    label="队伍名称"
                                    variant="bordered"
                                    value={teamName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeamName(e.target.value)}
                                />
                                <Input
                                    label="头像图片链接 (URL)"
                                    placeholder="https://..."
                                    variant="bordered"
                                    value={iconUrl}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIconUrl(e.target.value)}
                                    description="请填写图片的直链地址"
                                />
                                {iconErrMsg && <Alert color="danger" title={iconErrMsg} />}
                            </Modal.Body>
                            <Divider />
                            <Modal.Footer>
                                <Button color="danger" variant="light" onPress={close}>取消</Button>
                                <Button
                                    color="primary"
                                    className="font-bold"
                                    isLoading={isUpdatingIcon}
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
                                                close();
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
                                </>
                            )}
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>

            {/* Staff 模态框保持不变 */}
             <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
                 <Modal.Backdrop variant="blur">
                    <Modal.Container size="2xl" scroll="inside">
                        <Modal.Dialog>
                            {({close}) => (
                                <>
                                    <Modal.Header className="flex flex-col gap-1 text-xl">
                                        <Modal.Heading>报名 Staff - {tournament_info.abbreviation}</Modal.Heading>
                                    </Modal.Header>
                            <Divider />
                            <Modal.Body className="py-6 flex flex-col gap-6">
                                <Alert color="default" variant="flat" title="请务必填写真实有效的信息，以便我们与您联系。" />

                                <div className="flex flex-col gap-4">
                                    <Input isRequired label="QQ号" placeholder="请输入您的QQ号码" variant="bordered" labelPlacement="outside"
                                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, qqNumber: e.target.value})}/>

                                    <div className="flex flex-col gap-2">
                                        <RadioGroup label="是否第一次担任 Staff？" orientation="horizontal" isRequired className="ml-1"
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, isFirstTimeStaff: (e.target.value !== "")})}>
                                            <Radio value="1">是</Radio>
                                            <Radio value="">否</Radio>
                                        </RadioGroup>
                                    </div>
                                </div>
                                <Textarea minRows={3} label="赛事经验" placeholder="请简述您参与过的比赛及担任的职位..." variant="bordered" labelPlacement="outside"
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, tournamentExperience: e.target.value})} />
                                <div>
                                    <CheckboxGroup label="选择意向职位" isRequired orientation="horizontal" className="gap-4"
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
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, otherDetails: e.target.value})} />
                                     <Textarea minRows={2} label="补充信息 (选填)" variant="bordered" labelPlacement="outside"
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, additionalComments: e.target.value})} />
                                </div>
                                {errMsg && <Alert color="danger" title={errMsg} />}
                            </Modal.Body>
                            <Divider />
                            <Modal.Footer>
                                <Button color="danger" variant="light" onPress={close}>取消</Button>
                                <Button color="primary" onPress={() => handleRegistration(close)} className="font-bold">提交报名</Button>
                            </Modal.Footer>
                                </>
                            )}
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
