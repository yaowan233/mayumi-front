"use client";

import JSZip from "jszip";
import {saveAs} from "file-saver";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import React, {useEffect, useMemo, useRef, useState} from "react";

const IconWrapper = ({children, className}: { children: React.ReactNode; className?: string }) => (
    <svg className={className} width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
);

export const CopyIcon = ({className}: { className?: string }) => (
    <IconWrapper className={className}>
        <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </IconWrapper>
);

export const DownloadIcon = ({className}: { className?: string }) => (
    <IconWrapper className={className}>
        <path d="M21 15V19C21 19.5304 20.7893 20.0609 20.4142 20.4142C20.0609 20.7893 19.5304 21 19 21H5C4.46957 21 3.93914 20.7893 3.58579 20.4142C3.21071 20.0609 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </IconWrapper>
);

export const MultiDownloadIcon = ({className}: { className?: string }) => (
    <IconWrapper className={className}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16.5 21h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </IconWrapper>
);

const ChevronDownIcon = ({className}: { className?: string }) => (
    <IconWrapper className={className}>
        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </IconWrapper>
);

const getModColor = (mod: string) => {
    const key = mod.replace(/[0-9]/g, "").trim().toUpperCase();
    const map: Record<string, { hex: string }> = {
        RC: {hex: "#006FEE"},
        SV: {hex: "#9353d3"},
        HB: {hex: "#f5a524"},
        LN: {hex: "#17c964"},
        TB: {hex: "#f31260"},
        NM: {hex: "#a1a1aa"},
        HD: {hex: "#f5a524"},
        HR: {hex: "#006FEE"},
        DT: {hex: "#9353d3"},
        FM: {hex: "#17c964"},
    };

    return map[key] || {hex: "#71717a"};
};

const IconButton = ({
    children,
    label,
    onClick,
    href,
}: {
    children: React.ReactNode;
    label: string;
    onClick?: () => void;
    href?: string;
}) => {
    const className = "inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-md transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/30 hover:shadow-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60";

    if (href) {
        return (
            <a className={className} href={href} target="_blank" rel="noreferrer" title={label} aria-label={label} onClick={(event) => event.stopPropagation()}>
                {children}
            </a>
        );
    }

    return (
        <button
            type="button"
            className={className}
            title={label}
            aria-label={label}
            onClick={(event) => {
                event.stopPropagation();
                onClick?.();
            }}
        >
            {children}
        </button>
    );
};

const DownloadMenu = ({
    stage,
    disabled,
    onDownload,
}: {
    stage: Stage;
    disabled: boolean;
    onDownload: (source: DownloadSource) => void;
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
    const mapCount = stage.mod_bracket.reduce((acc, cur) => acc + cur.maps.length, 0);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (event: PointerEvent) => {
            if (!ref.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [open]);

    const options: { key: DownloadSource; title: string; desc: string }[] = [
        {key: "sayobot", title: "Sayobot 镜像（推荐）", desc: "国内首选，速度较快"},
        {key: "osu-direct", title: "osu.direct 镜像", desc: "覆盖率较高"},
        {key: "beatconnect", title: "Beatconnect 镜像", desc: "缺图时可尝试"},
        {key: "official-txt", title: "导出官网链接 (.txt)", desc: "生成链接列表，手动下载"},
    ];

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                disabled={disabled}
                className="inline-flex min-w-[210px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
                onClick={() => setOpen((value) => !value)}
            >
                <MultiDownloadIcon className="text-xl"/>
                下载图池 ({mapCount})
                <ChevronDownIcon className="text-sm"/>
            </button>
            {open && (
                <div className="absolute right-0 top-12 z-40 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white/95 py-2 text-zinc-900 shadow-2xl backdrop-blur-md dark:border-white/[0.08] dark:bg-zinc-950/95 dark:text-zinc-100">
                    {options.map((option) => (
                        <button
                            key={option.key}
                            type="button"
                            className="block w-full px-4 py-3 text-left transition-all duration-150 hover:bg-zinc-100 active:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 dark:hover:bg-white/[0.06] dark:active:bg-white/[0.10]"
                            onClick={() => {
                                setOpen(false);
                                onDownload(option.key);
                            }}
                        >
                            <span className="block text-sm font-bold">{option.title}</span>
                            <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">{option.desc}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

type DownloadSource = "sayobot" | "beatconnect" | "osu-direct" | "official-txt";

export const MappoolsComponents = ({tabs}: { tabs: Stage[] }) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const params = useParams();
    const tournamentAbbr = params?.tournament ? decodeURIComponent(params.tournament as string) : "Tournament";
    const initialStage = searchParams.get("stage") || tabs.at(-1)?.stage_name || tabs[0]?.stage_name;
    const [selectedStage, setSelectedStage] = useState(initialStage);
    const [downloadState, setDownloadState] = useState({
        isOpen: false,
        progress: 0,
        text: "",
        currentCount: 0,
        totalCount: 0,
    });

    const activeStage = useMemo(
        () => tabs.find((stage) => stage.stage_name === selectedStage) || tabs.at(-1) || tabs[0],
        [selectedStage, tabs]
    );

    const sanitizeFilename = (name: string) => name.replace(/[\\/:*?"<>|]/g, "_");
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const handleStageChange = (stageName: string) => {
        setSelectedStage(stageName);
        router.replace(`?stage=${encodeURIComponent(stageName)}`);
    };

    const handleDownloadAll = async (stage: Stage, source: DownloadSource) => {
        const mapsToDownload: { map_set_id: string; filename: string }[] = [];

        stage.mod_bracket.forEach((bracket) => {
            bracket.maps.forEach((map, index) => {
                if (!map.map_set_id || map.map_set_id === "0") return;
                mapsToDownload.push({
                    map_set_id: map.map_set_id,
                    filename: `[${bracket.mod} ${index + 1}] ${sanitizeFilename(map.map_name || `Map_${map.map_id}`)}.osz`,
                });
            });
        });

        if (mapsToDownload.length === 0) {
            alert("没有可下载的地图");
            return;
        }

        if (source === "official-txt") {
            let content = `Type: ${tournamentAbbr} - ${stage.stage_name} Mappool\n`;
            content += `Generated at: ${new Date().toLocaleString()}\n\n`;
            mapsToDownload.forEach((task) => {
                content += `${task.filename}\n`;
                content += `https://osu.ppy.sh/beatmapsets/${task.map_set_id}/download\n\n`;
            });
            saveAs(new Blob([content], {type: "text/plain;charset=utf-8"}), `[${tournamentAbbr}] ${stage.stage_name} Official_Links.txt`);
            return;
        }

        let sourceName = "Sayobot";
        if (source === "osu-direct") sourceName = "osu.direct";
        if (source === "beatconnect") sourceName = "Beatconnect";

        setDownloadState({
            isOpen: true,
            progress: 0,
            text: `准备开始下载...（源：${sourceName}）`,
            currentCount: 0,
            totalCount: mapsToDownload.length,
        });

        const zip = new JSZip();
        const maxConcurrency = 5;
        let currentIndex = 0;
        let completedCount = 0;

        const worker = async () => {
            while (currentIndex < mapsToDownload.length) {
                const taskIndex = currentIndex++;
                const task = mapsToDownload[taskIndex];
                if (!task) break;

                let url = "";
                if (source === "sayobot") url = `https://dl.sayobot.cn/beatmaps/download/novideo/${task.map_set_id}`;
                if (source === "osu-direct") url = `https://osu.direct/api/d/${task.map_set_id}`;
                if (source === "beatconnect") url = `https://beatconnect.io/b/${task.map_set_id}/${task.map_set_id}/`;

                try {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`Status ${res.status}`);
                    zip.file(task.filename, await res.blob());
                } catch (err) {
                    console.error(`Download failed: ${task.filename}`, err);
                    zip.file(`ERROR_${task.filename}.txt`, `Failed to download from ${sourceName}.\nTry: https://osu.ppy.sh/beatmapsets/${task.map_set_id}/download`);
                } finally {
                    completedCount++;
                    const percent = Math.round((completedCount / mapsToDownload.length) * 80);
                    setDownloadState((prev) => ({
                        ...prev,
                        progress: percent,
                        currentCount: completedCount,
                        text: `正在下载... (${completedCount}/${mapsToDownload.length})`,
                    }));
                }
            }
        };

        try {
            await delay(100);
            await Promise.all(Array(Math.min(maxConcurrency, mapsToDownload.length)).fill(null).map(() => worker()));
            setDownloadState((prev) => ({...prev, text: "所有文件下载完毕，正在压缩打包...", progress: 85}));
            await delay(100);

            const content = await zip.generateAsync({type: "blob"}, (metadata) => {
                setDownloadState((prev) => ({...prev, progress: 80 + metadata.percent * 0.2}));
            });

            saveAs(content, `[${tournamentAbbr}] ${stage.stage_name} Pack_${source}.zip`);
            setDownloadState((prev) => ({...prev, text: "下载完成！", progress: 100}));
            await delay(1000);
            setDownloadState((prev) => ({...prev, isOpen: false}));
        } catch (e) {
            console.error(e);
            alert("下载过程中出现错误");
            setDownloadState((prev) => ({...prev, isOpen: false}));
        }
    };

    return (
        <div className="flex w-full flex-col items-center">
            {downloadState.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl dark:border-white/[0.08] dark:bg-zinc-950 dark:text-zinc-100">
                        <h3 className="text-lg font-black">图池批量下载中</h3>
                        <div className="mt-5 flex flex-col gap-4">
                            <div className="flex justify-between gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                                <span>{downloadState.text}</span>
                                <span>{downloadState.progress.toFixed(2)}%</span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-white/10">
                                <div
                                    className="h-full rounded-full bg-primary transition-[width]"
                                    style={{width: `${Math.min(100, Math.max(0, downloadState.progress))}%`}}
                                />
                            </div>
                            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">当前并发下载数：5 | 请不要关闭此页面</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full border-b border-zinc-200 dark:border-white/[0.08]">
                <div className="mx-auto flex max-w-7xl justify-start gap-6 overflow-x-auto px-6 md:justify-center md:px-0">
                    {tabs.map((stage) => {
                        const active = activeStage?.stage_name === stage.stage_name;
                        return (
                            <button
                                key={stage.stage_name}
                                type="button"
                                className={`relative h-12 shrink-0 cursor-pointer rounded-md px-1 text-lg font-bold transition-all duration-150 hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${active ? "text-primary" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
                                onClick={() => handleStageChange(stage.stage_name)}
                            >
                                {stage.stage_name}
                                {active && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"/>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeStage && (
                <div className="mx-auto w-full max-w-7xl px-4 py-8">
                    <div className="mb-6 flex w-full justify-end">
                        <DownloadMenu
                            stage={activeStage}
                            disabled={downloadState.isOpen}
                            onDownload={(source) => handleDownloadAll(activeStage, source)}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-12">
                        {activeStage.mod_bracket.map((modBracket) => {
                            const modStyle = getModColor(modBracket.mod);
                            return (
                                <div key={modBracket.mod} className="flex w-full flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-1.5 rounded-full shadow-[0_0_10px_currentColor]" style={{backgroundColor: modStyle.hex, color: modStyle.hex}}/>
                                        <h2 className="text-3xl font-black italic tracking-normal text-zinc-900 uppercase dark:text-zinc-100">
                                            {modBracket.mod} POOL
                                        </h2>
                                        <div className="h-px flex-grow bg-zinc-200 dark:bg-white/[0.08]"/>
                                    </div>
                                    <div className="flex w-full flex-wrap justify-center gap-6">
                                        {modBracket.maps.map((map, index) => (
                                            <MapComponent key={map.map_id} map={map} index={index} mod={modBracket.mod}/>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const MapComponent = ({map, index, mod}: { map: Map; index: number; mod: string }) => {
    const modStyle = getModColor(mod);
    const modCode = `${mod}${index + 1}`;
    const [showOverlay, setShowOverlay] = useState(false);
    const [copiedAction, setCopiedAction] = useState<"id" | "mp" | null>(null);

    const handleCopy = async (value: string, action: "id" | "mp") => {
        await navigator.clipboard.writeText(value);
        setCopiedAction(action);
        window.setTimeout(() => setCopiedAction((current) => current === action ? null : current), 1200);
    };

    return (
        <div
            role="button"
            tabIndex={0}
            className="group relative h-[210px] w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md transition-shadow duration-300 hover:shadow-2xl dark:border-white/[0.06] dark:bg-zinc-950 sm:w-[380px]"
            onClick={() => setShowOverlay((value) => !value)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") setShowOverlay((value) => !value);
            }}
            onMouseEnter={() => setShowOverlay(true)}
            onMouseLeave={() => setShowOverlay(false)}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                alt={map.map_name}
                className={`absolute left-0 top-0 z-0 h-full w-full object-cover transition-all duration-300 ${showOverlay ? "scale-110 blur-md" : "scale-100 blur-0"}`}
                src={`https://assets.ppy.sh/beatmaps/${map.map_set_id}/covers/cover.jpg`}
            />
            <div className={`absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-300 ${showOverlay ? "opacity-0" : "opacity-100"}`}/>
            <div className={`absolute inset-0 z-10 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${showOverlay ? "opacity-100" : "opacity-0"}`}/>

            <div className={`absolute inset-0 z-20 flex flex-col justify-between p-4 transition-opacity duration-300 ${showOverlay ? "opacity-0" : "opacity-100"}`}>
                <div className="flex items-start justify-between">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-sm font-black text-white shadow-lg" style={{backgroundColor: modStyle.hex}}>
                        {modCode}
                    </span>
                    <div className="rounded-lg border border-white/5 bg-black/50 px-2 py-1 text-sm font-bold text-yellow-400 shadow-sm backdrop-blur-md">
                        ★ {map.star_rating}
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="line-clamp-1 text-xl font-black leading-tight text-white drop-shadow-md" title={map.map_name}>
                        {map.map_name}
                    </div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="max-w-[60%] truncate font-bold text-white drop-shadow-sm">[{map.diff_name}]</span>
                        <span className="max-w-[35%] truncate text-right text-xs text-zinc-300">{map.mapper}</span>
                    </div>
                    {map.extra && map.extra.length > 0 && (
                        <div className="mb-1 flex flex-wrap gap-1.5">
                            {map.extra.map((tag) => (
                                <span key={tag} className="rounded border border-white/10 bg-white/10 px-2 py-[2px] text-[10px] font-bold uppercase tracking-wide text-zinc-100 shadow-sm backdrop-blur-md">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="mt-auto grid grid-cols-4 gap-1 rounded-md border border-white/5 bg-black/40 px-1 py-1 font-mono text-[11px] text-zinc-200 backdrop-blur-md">
                        <span className="text-center">CS {map.cs}</span>
                        <span className="text-center">AR {map.ar}</span>
                        <span className="text-center">OD {map.od}</span>
                        <span className="text-center">HP {map.hp}</span>
                    </div>
                </div>
            </div>

            <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 transition-opacity duration-300 ${showOverlay ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
                <div className="text-5xl font-black tracking-widest drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]" style={{color: modStyle.hex}}>
                    {modCode}
                </div>
                <div className="flex items-center gap-4">
                    <IconButton
                        label={copiedAction === "id" ? "地图 ID 已复制" : "复制地图 ID"}
                        onClick={() => handleCopy(map.map_id, "id")}
                    >
                        {copiedAction === "id" ? <span className="text-xs font-black">已复制</span> : <CopyIcon className="text-xl"/>}
                    </IconButton>
                    <IconButton
                        label={copiedAction === "mp" ? "MP 指令已复制" : "复制 MP 指令"}
                        onClick={() => handleCopy(`!mp map ${map.map_id}`, "mp")}
                    >
                        <span className="text-sm font-bold">{copiedAction === "mp" ? "已复制" : "MP"}</span>
                    </IconButton>
                    <IconButton label="Download" href={`https://dl.sayobot.cn/beatmaps/download/novideo/${map.map_set_id}`}>
                        <DownloadIcon className="text-xl"/>
                    </IconButton>
                </div>
                <a
                    href={`https://osu.ppy.sh/b/${map.map_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="border-b border-transparent pb-0.5 text-xs font-bold uppercase tracking-widest text-white/50 transition-colors hover:border-white/50 hover:text-white"
                    onClick={(event) => event.stopPropagation()}
                >
                    View on osu! website
                </a>
            </div>
            <div className="absolute bottom-0 left-0 top-0 z-20 w-1 transition-all duration-300 group-hover:w-1.5" style={{backgroundColor: modStyle.hex}}/>
        </div>
    );
};

export interface Stage {
    stage_name: string;
    mod_bracket: {
        mod: string;
        maps: Map[];
    }[];
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
