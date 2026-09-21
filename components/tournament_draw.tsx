"use client";

import {useMemo, useRef, useState} from "react";
import {Avatar, Button, Input, Label, TextField} from "@heroui/react";
import {formatUtcDateTime} from "@/lib/datetime";
import {DRAW_STATUS, drawSlotLabel, formatMatchScore, layoutDraw, visibleDraw, type DrawMatch, type TournamentDraw} from "@/lib/tournament_draw";

export function TournamentDrawBoard({state: savedState, onSelect, selectedId}: {state: TournamentDraw; onSelect?: (match: DrawMatch) => void; selectedId?: string}) {
    const state = useMemo(() => visibleDraw(savedState), [savedState]);
    const [query, setQuery] = useState("");
    const [zoom, setZoom] = useState(1);
    const [detailId, setDetailId] = useState<string | null>(null);
    const viewport = useRef<HTMLDivElement>(null);
    const pan = useRef<{x: number; y: number; left: number; top: number} | null>(null);
    const layout = useMemo(() => layoutDraw(state), [state]);
    const activeId = selectedId ?? detailId;
    const selected = state.matches.find(m => m.id === activeId);
    const champion = state.entrants.find(p => p.id === state.champion);
    const related = new Set<string>(activeId ? [activeId] : []);
    if (activeId) for (const match of state.matches) {
        for (const source of match.sources) if ("match_id" in source && (match.id === activeId || source.match_id === activeId)) {
            related.add(match.id); related.add(source.match_id);
        }
    }
    return <div className="flex w-full flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
                <h2 className="text-xl font-bold">{state.origin ? "赛事对阵图" : state.format === "double" ? "双败淘汰赛" : "单败淘汰赛"}</h2>
                <p className="mt-1 text-sm text-default-500">{state.entrants.length} 个参赛单位{state.format === "double" && state.reset_final ? " · 总决赛支持重置" : ""} · 拖动空白区域或滚动查看，点击比赛查看详情</p>
                {champion && <p className="mt-2 font-bold text-primary">冠军 · {champion.name}</p>}
            </div>
            <div className="flex flex-wrap items-end gap-2">
                <TextField value={query} onChange={setQuery} className="w-44"><Label>查找队伍或选手</Label><Input variant="secondary" placeholder="名称或比赛编号"/></TextField>
                <div className="flex shrink-0 items-center gap-2">
                <Button variant="secondary" aria-label="缩小对阵图" isDisabled={zoom <= 0.5} onPress={() => setZoom(z => Math.max(0.5, z - 0.25))}>−</Button>
                <Button variant="secondary" onPress={() => {setZoom(1); viewport.current?.scrollTo({left: 0, top: 0});}}>{Math.round(zoom * 100)}%</Button>
                <Button variant="secondary" aria-label="放大对阵图" isDisabled={zoom >= 1.5} onPress={() => setZoom(z => Math.min(1.5, z + 0.25))}>＋</Button>
                </div>
            </div>
        </div>
        <div ref={viewport} tabIndex={0} role="region" aria-label="赛事对阵图，可滚动查看" className="max-h-[70vh] min-h-72 select-none overflow-auto rounded-2xl border border-default-200 bg-default-50/50 outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10"
            onDragStart={event => event.preventDefault()}
            onPointerDown={event => {
                if (event.pointerType !== "mouse" || event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
                event.preventDefault();
                event.currentTarget.focus({preventScroll: true});
                pan.current = {x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop};
                event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={event => {if (pan.current) {event.currentTarget.scrollLeft = pan.current.left - event.clientX + pan.current.x; event.currentTarget.scrollTop = pan.current.top - event.clientY + pan.current.y;}}}
            onPointerUp={() => {pan.current = null;}} onPointerCancel={() => {pan.current = null;}} onLostPointerCapture={() => {pan.current = null;}}>
            <div className="relative" style={{width: layout.width * zoom, height: layout.height * zoom}}>
                <div className="absolute left-0 top-0 origin-top-left" style={{width: layout.width, height: layout.height, transform: `scale(${zoom})`}}>
                    <svg aria-hidden="true" width={layout.width} height={layout.height} className="pointer-events-none absolute inset-0 overflow-visible">
                        {state.matches.flatMap(match => match.sources.map((source, index) => {
                            if (!("match_id" in source)) return null;
                            const from = layout.positions[source.match_id], to = layout.positions[match.id];
                            if (!from || !to) return null;
                            const parent = state.matches.find(m => m.id === source.match_id)!;
                            const sameGroup = state.rounds.find(r => r.id === parent.round_id)?.bracket === state.rounds.find(r => r.id === match.round_id)?.bracket;
                            const highlight = activeId === match.id || activeId === source.match_id;
                            if (!sameGroup && !highlight) return null;
                            const x1 = from.x + 264, y1 = from.y + 66, x2 = to.x, y2 = to.y + 48 + index * 36;
                            const path = x2 > x1 ? `M${x1},${y1} H${(x1 + x2) / 2} V${y2} H${x2}` : `M${x1},${y1} H${x1 + 22} V${to.y - 12} H${x2 - 12} V${y2} H${x2}`;
                            return <path key={`${match.id}:${index}`} d={path} fill="none" stroke="currentColor" strokeWidth={highlight ? 2 : 1.5} strokeDasharray={source.kind === "loser" ? "5 4" : undefined} className={highlight ? "text-primary" : "text-default-300"}/>;
                        }))}
                    </svg>
                    {layout.headers.map(({round, x, y}) => <div key={round.id} className="absolute w-64 truncate text-sm font-bold" style={{left: x, top: y}} title={round.name}>{round.name} <span className="ml-2 font-normal text-default-500">{round.best_of === null ? "BO 待定" : `BO${round.best_of}`}</span></div>)}
                    {state.matches.map(match => {
                        const position = layout.positions[match.id];
                        const found = !query.trim() || [match.id, ...[0, 1].map(i => drawSlotLabel(state, match, i))].some(text => text.toLowerCase().includes(query.trim().toLowerCase()));
                        return <button key={match.id} type="button" onClick={() => {setDetailId(match.id); onSelect?.(savedState.matches.find(item => item.id === match.id)!);}} aria-pressed={match.id === activeId}
                            aria-label={`${match.id}：${drawSlotLabel(state, match, 0)} 对 ${drawSlotLabel(state, match, 1)}，${match.scores.map(formatMatchScore).join(' 比 ')}，${DRAW_STATUS[match.status]}`}
                            style={{left: position.x, top: position.y}}
                            className={`absolute h-[132px] w-[264px] overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-zinc-950 ${related.has(match.id) ? "border-primary ring-1 ring-primary/20" : "border-default-200 hover:border-primary/60 dark:border-white/15"} ${found ? "opacity-100" : "opacity-30"}`}>
                            <div className="flex h-8 items-center justify-between px-3 text-xs text-default-500"><span className="font-mono">{match.id}</span><span>{DRAW_STATUS[match.status]}</span></div>
                            {[0, 1].map(index => {
                                const entrant = state.entrants.find(p => p.id === match.teams[index]);
                                const won = Boolean(entrant && match.winner === entrant.id);
                                return <div key={index} className={`flex h-9 items-center gap-2 px-3 ${won ? "bg-primary/10 font-semibold text-primary" : "text-foreground"}`}>
                                    {!state.origin && <span className="w-4 shrink-0 text-center text-[10px] text-default-400">{entrant ? state.entrants.indexOf(entrant) + 1 : "—"}</span>}
                                    <Avatar size="sm" className="!size-6 shrink-0"><Avatar.Image src={entrant?.avatar_url || undefined} alt=""/><Avatar.Fallback>{entrant?.name.slice(0, 1) || "?"}</Avatar.Fallback></Avatar>
                                    <span className="min-w-0 flex-1 truncate text-sm" title={drawSlotLabel(state, match, index)}>{drawSlotLabel(state, match, index)}</span>
                                    <span className="font-mono font-bold">{match.status === "bye" || match.status === "unneeded" ? "—" : formatMatchScore(match.scores[index])}</span>
                                </div>;
                            })}
                            <div className="truncate px-3 pt-1 text-[10px] text-default-500">{formatUtcDateTime(match.datetime) || "时间待定"}</div>
                        </button>;
                    })}
                </div>
            </div>
        </div>
        {!onSelect && selected && <div className="rounded-xl border border-default-200 p-4 text-sm dark:border-white/10" role="status">
            <p className="font-semibold">{selected.id} · {drawSlotLabel(state, selected, 0)} {selected.scores.map(formatMatchScore).join(" : ")} {drawSlotLabel(state, selected, 1)}</p>
            <p className="mt-1 text-default-500">{DRAW_STATUS[selected.status]} · {formatUtcDateTime(selected.datetime) || "时间待定"}</p>
            <div className="mt-2 flex flex-wrap gap-2">{state.matches.flatMap(m => m.sources.map((source, i) => "match_id" in source && source.match_id === selected.id ? <Button key={`${m.id}:${i}`} size="sm" variant="secondary" onPress={() => {setDetailId(m.id); const point = layout.positions[m.id]; viewport.current?.scrollTo({left: Math.max(0, point.x * zoom - 30), top: Math.max(0, point.y * zoom - 80), behavior: "smooth"});}}>{source.kind === "winner" ? "胜者" : "败者"} → {m.id}</Button> : null))}</div>
        </div>}
    </div>;
}
