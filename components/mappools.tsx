"use client"
import {Tab, Tabs} from "@heroui/tabs";
import {Card} from "@heroui/card";
import {Link} from "@heroui/link";
import {Image} from "@heroui/image";
import React, {useState} from 'react';
import {Button} from "@heroui/button";
import {Tooltip} from "@heroui/tooltip";
import {useSearchParams, useRouter, useParams} from "next/navigation";
import {Chip} from "@heroui/chip";
import JSZip from "jszip";
import { saveAs } from "file-saver"
import {Modal, ModalBody, ModalContent, ModalHeader} from "@heroui/modal";
import {Progress} from "@heroui/progress";
import {Dropdown, DropdownItem, DropdownMenu, DropdownTrigger} from "@heroui/dropdown";

// --- 1. 统一风格的图标组件 ---
const IconWrapper = ({children, className}: {children: React.ReactNode, className?: string}) => (
    <svg className={className} width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
);

export const CopyIcon = ({className}: {className?: string}) => (
    <IconWrapper className={className}>
        <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </IconWrapper>
);

export const DownloadIcon = ({className}: {className?: string}) => (
    <IconWrapper className={className}>
        <path d="M21 15V19C21 19.5304 20.7893 20.0609 20.4142 20.4142C20.0609 20.7893 19.5304 21 19 21H5C4.46957 21 3.93914 20.7893 3.58579 20.4142C3.21071 20.0609 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </IconWrapper>
);
// 批量下载图标
export const MultiDownloadIcon = ({className}: {className?: string}) => (
    <IconWrapper className={className}>
         <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
         <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
         <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
         <path d="M16.5 21h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </IconWrapper>
);

const ChevronDownIcon = ({className}: {className?: string}) => (
    <IconWrapper className={className}>
        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </IconWrapper>
);

const getModColor = (mod: string) => {
    // 提取 Mod 前缀 (比如 RC1 -> RC)
    const key = mod.replace(/[0-9]/g, '').trim().toUpperCase();

    const map: Record<string, { color: "default" | "primary" | "secondary" | "success" | "warning" | "danger", hex: string }> = {
        "RC": { color: "primary", hex: "#006FEE" },   // Blue (Rice)
        "SV": { color: "secondary", hex: "#9353d3" }, // Purple (Long Note)
        "HB": { color: "warning", hex: "#f5a524" },   // Orange/Gold (Hybrid)
        "LN": { color: "success", hex: "#17c964" },   // Green (Slider Velocity)
        "TB": { color: "danger", hex: "#f31260" },    // Red (Tiebreaker)
        "NM": { color: "default", hex: "#a1a1aa" },
        "HD": { color: "warning", hex: "#f5a524" },
        "HR": { color: "primary", hex: "#006FEE" },
        "DT": { color: "secondary", hex: "#9353d3" },
        "FM": { color: "success", hex: "#17c964" },
    };

    // 如果找不到匹配，返回默认灰色
    return map[key] || { color: "default", hex: "#71717a" };
};

// --- 主组件 ---
export const MappoolsComponents = ({tabs}: { tabs: Stage[] }) => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const params = useParams();
    const tournamentAbbr = params?.tournament ? decodeURIComponent(params.tournament as string) : "Tournament";
    const [downloadState, setDownloadState] = useState({
        isOpen: false,        // 是否打开弹窗
        progress: 0,          // 进度百分比 (0-100)
        text: "",             // 当前状态文字
        currentCount: 0,      // 当前下载数量
        totalCount: 0         // 总数量
    });

    const sanitizeFilename = (name: string) => name.replace(/[\\/:*?"<>|]/g, "_");

    // 延时函数 (依然保留，用于让出主线程给 UI 渲染)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleDownloadAll = async (stage: Stage, source: "sayobot" | "beatconnect" | "osu-direct" | "official-txt") => {

        // 1. 准备任务列表
        const mapsToDownload: { map_set_id: string; filename: string }[] = [];
        stage.mod_bracket.forEach(bracket => {
            bracket.maps.forEach((map, index) => {
                if (!map.map_set_id || map.map_set_id === "0") return;
                const modCode = `${bracket.mod} ${index + 1}`;
                const safeTitle = sanitizeFilename(map.map_name || `Map_${map.map_id}`);
                const filename = `[${modCode}] ${safeTitle}.osz`;
                mapsToDownload.push({
                    map_set_id: map.map_set_id,
                    filename: filename
                });
            });
        });

        if (mapsToDownload.length === 0) {
            alert("没有可下载的地图");
            return;
        }

        // --- TXT 导出逻辑 (保持不变) ---
        if (source === "official-txt") {
            let content = `Type: ${tournamentAbbr} - ${stage.stage_name} Mappool\n`;
            content += `Generated at: ${new Date().toLocaleString()}\n\n`;
            mapsToDownload.forEach(task => {
                content += `${task.filename}\n`;
                content += `https://osu.ppy.sh/beatmapsets/${task.map_set_id}/download\n\n`;
            });
            const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
            saveAs(blob, `[${tournamentAbbr}] ${stage.stage_name} Official_Links.txt`);
            return;
        }

        // --- 并发下载池逻辑 ---

        let sourceName = "Sayobot";
        if (source === "osu-direct") sourceName = "osu.direct";
        if (source === "beatconnect") sourceName = "Beatconnect";

        setDownloadState({
            isOpen: true,
            progress: 0,
            text: `准备开始下载... (源: ${sourceName})`,
            currentCount: 0,
            totalCount: mapsToDownload.length
        });

        const zip = new JSZip();

        // --- 核心变化：并发控制变量 ---
        const MAX_CONCURRENCY = 5;
        let currentIndex = 0;      // 当前取到了第几个任务
        let completedCount = 0;    // 已完成数量

        // 定义单个工人的工作逻辑
        const worker = async () => {
            while (currentIndex < mapsToDownload.length) {
                // 1. 领取任务（原子操作：取值并自增）
                const taskIndex = currentIndex++;
                const task = mapsToDownload[taskIndex];

                if (!task) break; // 防止越界

                // 更新状态文本 (不频繁更新 React 状态以免卡顿，只更新文字提示)
                // 注意：这里如果多个线程同时更新，文字可能会跳动，但在高速下载时是可以接受的
                // 也可以选择不显示具体的“正在下载哪一张”，只显示进度

                let url = "";
                if (source === "sayobot") {
                    url = `https://dl.sayobot.cn/beatmaps/download/novideo/${task.map_set_id}`;
                } else if (source === "osu-direct") {
                    url = `https://osu.direct/api/d/${task.map_set_id}`;
                } else if (source === "beatconnect") {
                    url = `https://beatconnect.io/b/${task.map_set_id}/${task.map_set_id}/`;
                }

                try {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`Status ${res.status}`);
                    const blob = await res.blob();
                    zip.file(task.filename, blob);
                } catch (err) {
                    console.error(`Download failed: ${task.filename}`, err);
                    zip.file(`ERROR_${task.filename}.txt`, `Failed to download from ${sourceName}.\nTry: https://osu.ppy.sh/beatmapsets/${task.map_set_id}/download`);
                } finally {
                    completedCount++;
                    // 计算进度 (下载阶段占 80%)
                    const percent = Math.round((completedCount / mapsToDownload.length) * 80);

                    setDownloadState(prev => ({
                        ...prev,
                        progress: percent,
                        currentCount: completedCount,
                        text: `正在下载... (${completedCount}/${mapsToDownload.length})`
                    }));
                }
            }
        };

        try {
            await delay(100); // 等待 UI 渲染弹窗

            // 2. 启动并发池
            // 创建 4 个 Worker Promise，它们会并行运行，直到任务队列被抢光
            const workers = Array(Math.min(MAX_CONCURRENCY, mapsToDownload.length))
                .fill(null)
                .map(() => worker());

            await Promise.all(workers);

            // 3. 打包阶段 (保持不变)
            setDownloadState(prev => ({ ...prev, text: "所有文件下载完毕，正在压缩打包...", progress: 85 }));
            // 给 UI 一点时间喘息
            await delay(100);

            const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
                setDownloadState(prev => ({
                    ...prev,
                    progress: 80 + (metadata.percent * 0.2)
                }));
            });

            const zipFileName = `[${tournamentAbbr}] ${stage.stage_name} Pack_${source}.zip`;
            saveAs(content, zipFileName);

            setDownloadState(prev => ({ ...prev, text: "下载完成！", progress: 100 }));
            await delay(1000);
            setDownloadState(prev => ({ ...prev, isOpen: false }));

        } catch (e) {
            console.error(e);
            alert("下载过程中出现错误");
            setDownloadState(prev => ({ ...prev, isOpen: false }));
        }
    };

    return (
        <div className="w-full flex flex-col items-center">
            <Modal
                isOpen={downloadState.isOpen}
                onOpenChange={(open) => !open && setDownloadState(prev => ({ ...prev, isOpen: false }))}
                isDismissable={false} // 禁止点击背景关闭
                hideCloseButton={true} // 隐藏关闭按钮，防止误触
                backdrop="blur"
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">图池批量下载中</ModalHeader>
                    <ModalBody className="pb-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between text-small text-default-500">
                                <span>{downloadState.text}</span>
                                <span>{downloadState.progress.toFixed(2)}%</span>
                            </div>
                            <Progress
                                size="md"
                                value={downloadState.progress}
                                color={downloadState.progress === 100 ? "success" : "secondary"}
                                showValueLabel={true}
                                className="max-w-full"
                                aria-label="progress"
                            />
                            <p className="text-xs text-default-400 text-center">
                                当前并发下载数: 5 | 请不要关闭此页面
                            </p>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
            <Tabs
                aria-label="Mappool Stages"
                items={tabs}
                variant="underlined"
                color="primary"
                className="w-full"
                classNames={{
                    tabList: [
                        "gap-6 relative rounded-none p-0 border-b border-divider",
                        "w-full overflow-x-auto scrollbar-hide",
                        "flex justify-start px-6",
                        "md:justify-center md:px-0"
                    ].join(" "),
                    cursor: "w-full bg-primary",
                    tab: "max-w-fit px-0 h-12 flex-shrink-0",
                    tabContent: "text-default-500 group-data-[selected=true]:text-primary group-data-[selected=true]:font-bold text-lg",
                    panel: "w-full py-8 max-w-7xl mx-auto px-4",
                }}
                defaultSelectedKey={searchParams.get('stage') || tabs.at(-1)?.stage_name}
                onSelectionChange={(key) => {
                    router.replace(`?stage=${key}`)
                }}
            >
                {(stage) => (
                    <Tab key={stage.stage_name} title={stage.stage_name}>
                        <div className="flex justify-end w-full mb-6">
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        color="secondary"
                                        variant="shadow"
                                        className="font-bold text-white min-w-[200px]"
                                        isDisabled={downloadState.isOpen}
                                        startContent={<MultiDownloadIcon className="text-xl" />}
                                        endContent={<ChevronDownIcon className="text-small" />}
                                    >
                                        下载图池 ({stage.mod_bracket.reduce((acc, cur) => acc + cur.maps.length, 0)})
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    aria-label="Download Options"
                                    onAction={(key) => handleDownloadAll(stage, key as any)}
                                >
                                    <DropdownItem key="sayobot" description="国内首选，速度极快">
                                        Sayobot 镜像 (推荐)
                                    </DropdownItem>

                                    <DropdownItem key="osu-direct" description="覆盖率高，速度较快">
                                        osu.direct 镜像
                                    </DropdownItem>

                                    <DropdownItem key="beatconnect" description="老牌镜像，缺图时尝试">
                                        Beatconnect 镜像
                                    </DropdownItem>

                                    <DropdownItem key="official-txt" description="生成链接列表，手动下载">
                                        导出官网链接 (.txt)
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>

                        <div className="flex flex-col gap-12 w-full">
                            {stage.mod_bracket.map((mod_bracket) => {
                                const modStyle = getModColor(mod_bracket.mod);
                                return (
                                    <div key={mod_bracket.mod} className="flex flex-col gap-4 w-full">
                                        {/* Mod 标题栏 */}
                                        <div className="flex items-center gap-3">
                                            {/* 左侧颜色指示条 */}
                                            <div className="h-8 w-1.5 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: modStyle.hex, color: modStyle.hex }}></div>
                                            <h2 className="text-3xl font-black tracking-wider italic text-foreground uppercase">
                                                {mod_bracket.mod} POOL
                                            </h2>
                                            <div className="h-[1px] flex-grow bg-divider/50"></div>
                                        </div>

                                        <div className="flex flex-wrap justify-center gap-6 w-full">
                                            {mod_bracket.maps.map((map, index) => (
                                                <MapComponent
                                                    key={map.map_id}
                                                    map={map}
                                                    index={index}
                                                    mod={mod_bracket.mod}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </Tab>
                )}
            </Tabs>
        </div>
    );
}

// --- 地图卡片组件 ---
const MapComponent = ({map, index, mod}: { map: Map, index: number, mod: string }) => {
    const modStyle = getModColor(mod);
    const modCode = `${mod}${index + 1}`;
    const [showOverlay, setShowOverlay] = useState(false);

    // 3. 处理点击逻辑：手机上点击切换显示状态
    const toggleOverlay = () => {
        setShowOverlay(!showOverlay);
    };

    return (
        <Card
            onPress={toggleOverlay}
            onMouseEnter={() => setShowOverlay(true)}
            onMouseLeave={() => setShowOverlay(false)}
            className="w-full sm:w-[380px] h-[210px] group border-none bg-zinc-900 overflow-hidden relative shadow-md hover:shadow-2xl transition-all duration-500"
            radius="lg"
        >
            {/* 1. 背景图层 */}
            <Image
                removeWrapper
                alt={map.map_name}
                className={`z-0 w-full h-full object-cover absolute top-0 left-0 transition-all duration-500 ${showOverlay ? 'scale-110 blur-md' : 'scale-100 blur-0'}`}
                src={`https://assets.ppy.sh/beatmaps/${map.map_set_id}/covers/cover.jpg`}
            />

            {/* 2. 默认遮罩 */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10 transition-opacity duration-300 ${showOverlay ? 'opacity-0' : 'opacity-100'}`} />

            {/* 3. 强力遮罩 */}
            <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm z-10 transition-opacity duration-300 ${showOverlay ? 'opacity-100' : 'opacity-0'}`} />

            {/* 4. [正常状态] 信息层 */}
            <div className={`absolute inset-0 z-20 flex flex-col justify-between p-4 transition-all duration-300 ${showOverlay ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                {/* 顶部信息 */}
                <div className="flex justify-between items-start">
                    <Chip
                        size="md"
                        variant="shadow"
                        classNames={{
                            base: "font-black border border-white/10 shadow-lg",
                            content: "drop-shadow-md"
                        }}
                        style={{ backgroundColor: modStyle.hex, color: '#fff' }}
                    >
                        {modCode}
                    </Chip>
                    <div className="flex items-center gap-1 text-yellow-400 font-bold bg-black/50 px-2 py-1 rounded-lg backdrop-blur-md border border-white/5 text-sm shadow-sm">
                        <span>★</span> {map.star_rating}
                    </div>
                </div>

                {/* 底部信息 */}
                <div className="flex flex-col gap-1">
                    <div className="text-white font-black leading-tight line-clamp-1 text-xl drop-shadow-md" title={map.map_name}>
                        {map.map_name}
                    </div>
                    <div className="flex justify-between items-center text-sm mb-1">
                        <span className="truncate max-w-[60%] text-white font-bold drop-shadow-sm">[{map.diff_name}]</span>
                        <span className="truncate max-w-[35%] text-zinc-300 text-xs text-right">{map.mapper}</span>
                    </div>

                    {map.extra && map.extra.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-1">
                            {map.extra.map((tag, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-[2px] rounded text-[10px] font-bold uppercase tracking-wide bg-white/10 text-zinc-100 border border-white/10 shadow-sm backdrop-blur-md"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* 维数面板 */}
                    <div className="grid grid-cols-4 gap-1 mt-auto text-[11px] text-zinc-200 font-mono bg-black/40 rounded-md py-1 px-1 backdrop-blur-md border border-white/5">
                        <span className="text-center">CS {map.cs}</span>
                        <span className="text-center">AR {map.ar}</span>
                        <span className="text-center">OD {map.od}</span>
                        <span className="text-center">HP {map.hp}</span>
                    </div>
                </div>
            </div>

            {/* 5. [悬停状态] 交互层 (保持不变) */}
            <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 transition-all duration-300 ${showOverlay ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <div
                    className="text-5xl font-black tracking-widest drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
                    style={{ color: modStyle.hex }}
                >
                    {modCode}
                </div>

                <div className="flex items-center gap-4">
                    <Tooltip content="Copy ID" closeDelay={0} offset={10}>
                        <Button isIconOnly radius="full" className="bg-white/10 hover:bg-white/30 text-white backdrop-blur-md w-12 h-12 border border-white/20 shadow-lg"
                            onPress={() => navigator.clipboard.writeText(map.map_id)}>
                            <CopyIcon className="text-xl" />
                        </Button>
                    </Tooltip>

                    <Tooltip content="Copy !mp map" closeDelay={0} offset={10}>
                        <Button isIconOnly radius="full" className="bg-white/10 hover:bg-white/30 text-white backdrop-blur-md w-12 h-12 border border-white/20 shadow-lg"
                            onPress={() => navigator.clipboard.writeText(`!mp map ${map.map_id}`)}>
                            <span className="font-bold text-sm">MP</span>
                        </Button>
                    </Tooltip>

                    <Tooltip content="Download" closeDelay={0} offset={10}>
                        <Button isIconOnly radius="full" className="bg-white/10 hover:bg-white/30 text-white backdrop-blur-md w-12 h-12 border border-white/20 shadow-lg"
                            as={Link} isExternal href={`https://dl.sayobot.cn/beatmaps/download/novideo/${map.map_set_id}`}>
                            <DownloadIcon className="text-xl" />
                        </Button>
                    </Tooltip>
                </div>

                <Link isExternal href={`https://osu.ppy.sh/b/${map.map_id}`} className="group/link">
                    <div className="text-xs font-bold tracking-widest text-white/50 group-hover/link:text-white transition-colors border-b border-transparent group-hover/link:border-white/50 pb-0.5 uppercase">
                        View on osu! website
                    </div>
                </Link>
            </div>

            <div className="absolute left-0 top-0 bottom-0 w-1 z-20 transition-all duration-300 group-hover:w-1.5" style={{ backgroundColor: modStyle.hex }}></div>
        </Card>
    )
}

// 类型定义保持不变
export interface Stage {
    stage_name: string;
    mod_bracket: {
        mod: string;
        maps: Map[]
    }[]
}

interface Map {
    map_id: string;
    map_set_id: string;
    map_name: string;
    mapper: string;
    star_rating: string;
    ar: string;
    od: string;
    cs: string;
    hp: string;
    bpm: string;
    length: string;
    drain_time: string;
    number: string;
    diff_name: string;
    extra?: string[];
}