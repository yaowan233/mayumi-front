"use client";

import {DrawManagementSkeleton} from "@/components/page_skeleton";
import {useContext, useState} from "react";
import useSWR from "swr";
import NextLink from "next/link";
import {Button, Input, Label, Modal, TextField} from "@heroui/react";
import CurrentUserContext from "@/app/user_context";
import {siteConfig} from "@/config/site";
import {formatLocalDateTime, localDateTimeInputToUtc, utcDateTimeToLocalInput} from "@/lib/datetime";
import {DRAW_STATUS, DrawRequestError, drawRoundGroups, drawSlotLabel, requestDraw, visibleDraw, type DrawManagementResponse, type DrawResponse, type DrawMatch, type DrawRound, type TournamentDraw} from "@/lib/tournament_draw";
import {TournamentDrawBoard} from "@/components/tournament_draw";
import {isScheduleVisible} from "@/lib/schedule_possibilities";

const validBo = (value: string) => !value.trim() || (Number.isInteger(Number(value)) && Number(value) >= 3 && Number(value) <= 23 && Number(value) % 2 === 1);

type SchedulePreview = {
    revision: number;
    matches: {id: string; stage_name: string; team1: string; team2: string; datetime: string | null; exists: boolean; moved?: boolean; removed?: boolean; conditional?: boolean; is_future_pending?: boolean; possible_pairings?: {team1: string; team2: string; match_time?: string | null}[]}[];
};

export function DrawManagement({tournamentName}: {tournamentName: string}) {
    const user = useContext(CurrentUserContext)?.currentUser;
    const url = `${siteConfig.backend_url}/api/tournament-draw/${encodeURIComponent(tournamentName)}`;
    const {data, error, mutate} = useSWR(user?.uid ? [url, user.uid] : null, ([endpoint]: [string, number]) => requestDraw<DrawManagementResponse>(endpoint), {refreshInterval: 15000});
    if (user === null) return <p>请先登录。</p>;
    if (error) return <div className="flex items-center gap-3"><p role="alert">{error.message}</p><Button variant="secondary" onPress={() => void mutate()}>重试</Button></div>;
    if (!data) return <DrawManagementSkeleton/>;
    return <DrawEditor key={`${tournamentName}:${user?.uid}`} data={data} url={url} tournamentName={tournamentName} onChange={async response => {await mutate({...data, ...response}, {revalidate: false});}} onReload={async () => {await mutate();}}/>;
}

function DrawEditor({data, url, tournamentName, onChange, onReload}: {
    data: DrawManagementResponse; url: string; tournamentName: string;
    onChange: (response: DrawResponse) => Promise<void>; onReload: () => Promise<void>;
}) {
    const [order, setOrder] = useState(data.entrants.map(p => p.id));
    const [excluded, setExcluded] = useState<string[]>(data.saved_schedule?.entrant_ids?.length ? data.entrants.filter(p => !data.saved_schedule!.entrant_ids!.includes(p.id)).map(p => p.id) : []);
    const [format, setFormat] = useState<"single" | "double">("double");
    const [bestOf, setBestOf] = useState("");
    const [mode, setMode] = useState<"seed" | "ongoing" | "completed">((data.saved_schedule?.match_count ?? 0) > 0 ? "ongoing" : "seed");
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [selectedId, setSelectedId] = useState<string>();
    const [confirmation, setConfirmation] = useState<{path: string; body: Record<string, unknown>; message: string} | null>(null);
    const [schedulePreview, setSchedulePreview] = useState<SchedulePreview | null>(null);
    const available = data.entrants.map(p => p.id);
    const ordered = [...order.filter(id => available.includes(id)), ...available.filter(id => !order.includes(id))];
    const selected = ordered.filter(id => !excluded.includes(id));
    const match = data.state?.matches.find(m => m.id === selectedId);
    const hasSavedSchedule = (data.saved_schedule?.match_count ?? 0) > 0;
    const visibleRounds = data.state ? visibleDraw(data.state).rounds : [];
    const stages = data.state ? [...new Set(data.state.rounds.map(round => round.stage_name ?? round.name))] : [];

    const execute = async (path: string, body: Record<string, unknown>, method = "POST") => {
        setPending(true); setError(""); setMessage(""); setConfirmation(null);
        try {
            const response = await requestDraw<DrawResponse>(`${url}/${path}`, {...body, revision: data.revision}, method);
            await onChange(response);
            setMessage(path === "to-schedule" ? "赛程草稿已生成。请到赛程管理确认比赛时间和待定选手，再发布。" : path.endsWith("/stage") ? "所属阶段已保存。生成赛程草稿时，这一轮比赛会归入所选阶段，已有比赛的时间和人员会保留。" : path === "publish" ? "对阵图已发布，公开赛程页会自动更新。" : "草稿已保存，晋级关系已更新。发布后观众即可看到。" );
            setSchedulePreview(null);
            if (path === "to-schedule") await onReload();
        } catch (e) {
            if (e instanceof DrawRequestError && e.dependentMatches.length) setConfirmation({path, body, message: `${e.message}（${e.dependentMatches.join("、")}）`});
            else setError(e instanceof Error ? e.message : "操作失败，请重试");
        } finally {setPending(false);}
    };

    const previewSchedule = async () => {
        setPending(true); setError(""); setMessage("");
        try {
            setSchedulePreview(await requestDraw<SchedulePreview>(`${url}/schedule-preview`, {revision: data.revision}));
        } catch (e) {
            setError(e instanceof Error ? e.message : "预览生成失败，请重试");
        } finally {setPending(false);}
    };

    const move = (id: string, delta: number) => {
        const next = [...ordered], from = next.indexOf(id), to = from + delta;
        if (to >= 0 && to < next.length) {[next[from], next[to]] = [next[to], next[from]]; setOrder(next);}
    };

    return <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-default-500">{data.state ? data.has_changes ? "有未发布的对阵更改" : "对阵图已发布" : hasSavedSchedule ? "可直接使用已保存的赛事信息生成对阵图。" : "选择参赛名单和赛制，生成对阵草稿。"}</p>
            <div className="flex flex-wrap items-center gap-2">
                <NextLink href={`/tournaments/${encodeURIComponent(tournamentName)}/schedule?view=bracket`} className="mr-2 text-sm text-primary">查看公开对阵图</NextLink>
                <Button variant="secondary" isDisabled={pending} onPress={() => {setConfirmation(null); void onReload().catch(() => setError("重新加载失败，请重试"));}}>重新加载</Button>
                {data.state && <Button variant="secondary" isDisabled={pending} onPress={() => void previewSchedule()}>生成赛程草稿</Button>}
                {data.can_publish && <Button variant="primary" isDisabled={pending || !data.state || !data.has_changes} onPress={() => void execute("publish", {})}>发布对阵图</Button>}
            </div>
        </div>
        {message && <p role="status" className="text-sm text-default-600">{message}</p>}
        {message.startsWith("赛程草稿已生成") && <NextLink href={`/tournament-management/${encodeURIComponent(tournamentName)}/scheduler`} className="self-start text-sm text-primary">前往赛程管理确认时间</NextLink>}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <Modal isOpen={schedulePreview !== null} onOpenChange={open => {if (!open && !pending) setSchedulePreview(null);}}>
            <Modal.Backdrop><Modal.Container size="lg"><Modal.Dialog>
                <Modal.CloseTrigger isDisabled={pending}/>
                <Modal.Header><Modal.Heading>确认生成赛程草稿</Modal.Heading></Modal.Header>
                <Modal.Body className="flex flex-col gap-4">
                    <p className="text-sm text-default-600">前置轮次全部结束后，才显示下一轮比赛。同一轮内只显示已确定比赛和直接下一场的候选，可分别安排时间。赛果确定后只保留实际对阵，并沿用对应时间。已生成的必然轮空会在确认后从草稿中移除。</p>
                    <p className="rounded-xl bg-warning/10 p-3 text-sm">比赛时间需要你确认：已有时间会保留，未设置时间的比赛保持“时间待定”。请到赛程管理确认时间和人员后再发布，待定对手会随赛果自动更新。</p>
                    {schedulePreview && <>
                        <p className="text-sm">新增 {schedulePreview.matches.filter(m => isScheduleVisible(m) && !m.exists && !m.removed).length} 场 · 保留 {schedulePreview.matches.filter(m => isScheduleVisible(m) && m.exists && !m.removed).length} 场 · 调整阶段 {schedulePreview.matches.filter(m => isScheduleVisible(m) && m.moved).length} 场 · 清理轮空 {schedulePreview.matches.filter(m => m.removed).length} 场</p>
                        <div className="max-h-80 overflow-auto rounded-xl border border-default-200">
                            <table className="w-full text-left text-sm"><thead><tr className="bg-default-100"><th className="p-3">轮次 / 对阵</th><th className="p-3">比赛时间</th></tr></thead><tbody>
                                {schedulePreview.matches.filter(isScheduleVisible).flatMap(item => (item.possible_pairings?.length ? item.possible_pairings : [{team1: item.team1, team2: item.team2}]).map((pair, index) => <tr key={`${item.id}:${index}`} className="border-t border-default-200"><td className="p-3"><span className="text-xs text-default-500">{item.stage_name} · {item.id} · {item.removed ? "移除轮空 / 无需进行" : item.moved ? "移入此阶段" : item.exists ? "已存在" : "新增"}{item.possible_pairings?.length ? " · 可能对阵" : ""}</span><p>{pair.team1} 对 {pair.team2}</p>{item.conditional && <p className="text-xs text-warning">条件比赛：败者组冠军赢得首场总决赛后进行</p>}</td><td className="p-3">{formatLocalDateTime(pair.match_time !== undefined ? pair.match_time : item.datetime) || "时间待定"}</td></tr>))}
                            </tbody></table>
                        </div>
                        {schedulePreview.revision !== data.revision && <p role="alert" className="text-sm text-danger">对阵图已更新，请关闭并重新生成预览。</p>}
                    </>}
                </Modal.Body>
                <Modal.Footer><Button variant="ghost" isDisabled={pending} onPress={() => setSchedulePreview(null)}>取消</Button><Button variant="primary" isDisabled={pending || !schedulePreview?.matches.length || schedulePreview.revision !== data.revision} isPending={pending} onPress={() => void execute("to-schedule", {})}>确认生成草稿</Button></Modal.Footer>
            </Modal.Dialog></Modal.Container></Modal.Backdrop>
        </Modal>
        {data.state?.warnings?.length ? <details className="rounded-xl border border-warning/30 p-4"><summary className="cursor-pointer text-sm font-medium">导入提示（{data.state.warnings.length}）</summary><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-default-500">{data.state.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul></details> : null}
        {confirmation && <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-4">
            <p>{confirmation.message}</p><div className="mt-3 flex gap-2"><Button variant="danger" isDisabled={pending} onPress={() => void execute(confirmation.path, {...confirmation.body, reset_dependents: true}, "PUT")}>确认修改并清除后续比分</Button><Button variant="secondary" onPress={() => setConfirmation(null)}>取消</Button></div>
        </div>}
        <details open={!data.state} className="rounded-2xl border border-default-200 dark:border-white/10">
            <summary className="cursor-pointer p-5 font-bold">生成对阵图</summary>
            <div className="flex flex-col gap-5 px-5 pb-5">
                <label className="flex flex-col gap-2 text-sm font-medium">生成方式<select value={mode} disabled={pending} onChange={e => setMode(e.target.value as typeof mode)} className="h-10 self-start rounded-xl border border-default-200 bg-surface px-3"><option value="seed">新建完整赛程</option>{hasSavedSchedule && <><option value="ongoing">补全未完赛赛程</option><option value="completed">导入已完赛赛事</option></>}</select></label>
                <p className="text-sm text-default-500">{mode === "completed" ? "读取已保存赛程，按历史比分推算未配置的 BO，恢复赛果与晋级线。" : mode === "ongoing" ? "保留已有对阵、比分和时间，补齐未来赛程。请确认下方包含所有淘汰赛选手；BO 可留空待定。" : "提前生成完整单败或双败赛程，未来席位显示对应比赛的胜者或败者，BO 可留空待定。"}</p>
                {mode !== "completed" && <>
                <div className="flex flex-wrap items-end gap-4">
                    <label className="flex flex-col gap-2 text-sm font-medium">赛制<select value={format} disabled={pending} onChange={e => setFormat(e.target.value as "single" | "double")} className="h-10 rounded-xl border border-default-200 bg-surface px-3"><option value="double">双败淘汰（总决赛可重置）</option><option value="single">单败淘汰</option></select></label>
                    <TextField value={bestOf} onChange={setBestOf} isDisabled={pending} className="w-36"><Label>默认 BO（可留空）</Label><Input placeholder="待定" type="number" min={3} max={23} step={2} variant="secondary"/></TextField>
                    <Button variant="secondary" isDisabled={pending} onPress={() => {const shuffled = [...ordered]; for (let i = shuffled.length - 1; i > 0; i--) {const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];} setOrder(shuffled);}}>随机排种子</Button>
                </div>
                <p className="text-sm text-default-500">已选择 {selected.length} 个参赛单位。{mode === "ongoing" ? "已有对阵优先，其余席位按列表顺序安排。" : "列表顺序即种子顺序，可上下调整；人数不足时高种子优先轮空。"}各轮 BO 可在生成后单独修改。</p>
                <div className="grid max-h-80 gap-2 overflow-auto md:grid-cols-2">
                    {ordered.map((id, index) => {const entrant = data.entrants.find(p => p.id === id)!; return <div key={id} className="flex items-center gap-2 rounded-xl border border-default-200 p-2 dark:border-white/10">
                        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"><input type="checkbox" disabled={pending} checked={!excluded.includes(id)} onChange={e => setExcluded(e.target.checked ? excluded.filter(value => value !== id) : [...excluded, id])} className="size-4 accent-primary"/><span className="w-6 text-center text-xs text-default-500">{selected.includes(id) ? selected.indexOf(id) + 1 : "—"}</span><span className="truncate text-sm" title={entrant.name}>{entrant.name}</span></label>
                        <Button size="sm" variant="secondary" aria-label={`${entrant.name} 种子上移`} isDisabled={pending || index === 0} onPress={() => move(id, -1)}>↑</Button><Button size="sm" variant="secondary" aria-label={`${entrant.name} 种子下移`} isDisabled={pending || index === ordered.length - 1} onPress={() => move(id, 1)}>↓</Button>
                    </div>;})}
                    {!ordered.length && <p className="text-default-500">暂无已报名选手或已审核队伍。</p>}
                </div>
                </>}
                <Button variant="primary" className="self-start" isDisabled={pending || (mode !== "completed" && (selected.length < 2 || selected.length > 128 || !validBo(bestOf)))} onPress={() => {
                    if (data.state && !window.confirm("重新生成会替换当前对阵草稿中的修改。原赛程不受影响，已发布对阵图在再次发布前不会改变。确认生成？")) return;
                    setSelectedId(undefined); void execute(mode === "seed" ? "generate" : "from-schedule", mode === "completed" ? {mode} : {mode, entrants: selected, format, reset_final: true, best_of: bestOf.trim() ? Number(bestOf) : null});
                }}>{mode === "ongoing" ? "生成完整赛程" : mode === "completed" ? "导入已完赛赛程" : "生成对阵草稿"}</Button>
            </div>
        </details>
        {data.state && <>
            <details open className="rounded-2xl border border-default-200 dark:border-white/10">
                <summary className="cursor-pointer p-5 font-bold">每轮所属阶段</summary>
                <p className="px-5 pb-4 text-sm text-default-500">胜败者组可分别选择阶段，例如把败者组第 1 轮安排在 RO16。同一阶段共用 BO；轮空列已隐藏。保存后点击「生成赛程草稿」核对并确认。</p>
                <div className="grid gap-3 px-5 pb-5 lg:grid-cols-2">
                    {visibleRounds.map(round => <RoundStageEditor key={`${round.id}:${data.revision}`} round={round} number={visibleRounds.filter(item => item.bracket === round.bracket).findIndex(item => item.id === round.id) + 1} stages={stages} pending={pending} onSave={stage_name => void execute(`rounds/${round.id}/stage`, {stage_name}, "PUT")}/>)}
                </div>
            </details>
            <TournamentDrawBoard state={data.state} selectedId={selectedId} onSelect={item => {setSelectedId(item.id); setConfirmation(null);}}/>
            {match && <MatchEditor key={`${match.id}:${data.revision}`} match={match} state={data.state} pending={pending} onSave={body => void execute(`matches/${match.id}`, body, "PUT")}/>}
            <details className="rounded-2xl border border-default-200 dark:border-white/10"><summary className="cursor-pointer p-5 font-bold">轮次名称与 BO</summary><div className="grid gap-4 px-5 pb-5 lg:grid-cols-2">
                {drawRoundGroups(data.state.rounds).map(rounds => <RoundEditor key={`${rounds[0].id}:${data.revision}`} rounds={rounds} pending={pending} onSave={body => void execute(`rounds/${rounds[0].id}`, body, "PUT")}/>)}
            </div></details>
        </>}
    </div>;
}

function MatchEditor({match, state, pending, onSave}: {match: DrawMatch; state: TournamentDraw; pending: boolean; onSave: (body: Record<string, unknown>) => void}) {
    const [scores, setScores] = useState(match.scores.map(String));
    const [time, setTime] = useState(utcDateTimeToLocalInput(match.datetime));
    const canScore = ["ready", "playing", "completed"].includes(match.status);
    const bestOf = state.rounds.find(r => r.id === match.round_id)!.best_of;
    const validScores = scores.every(s => s.trim() && Number.isInteger(Number(s)) && Number(s) >= -1) && !scores.every(s => Number(s) === -1);
    return <div className="rounded-2xl border border-primary/30 p-5">
        <h3 className="font-bold">{match.id} · {DRAW_STATUS[match.status]} · {bestOf === null ? "BO 待定" : `BO${bestOf}`}</h3>
        <p className="mt-1 text-sm text-default-500">保存比分后，分数高的一方自动获胜并晋级；平分时保持未结束。弃权填 -1。BO 不影响胜负判定，比赛时间按本机时区填写。</p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
            {[0, 1].map(index => <TextField key={index} isDisabled={pending || !canScore} value={scores[index]} onChange={value => {setScores(prev => prev.map((s, i) => i === index ? value : s));}} className="w-48"><Label className="max-w-full truncate" title={drawSlotLabel(state, match, index)}>{drawSlotLabel(state, match, index)}</Label><Input type="number" min={-1} step={1} variant="secondary"/></TextField>)}
            <TextField value={time} onChange={setTime} isDisabled={pending}><Label>比赛时间（可留空）</Label><Input type="datetime-local" variant="secondary"/></TextField>
            <Button variant="primary" isDisabled={pending || (canScore && !validScores) || Boolean(time && !localDateTimeInputToUtc(time))} onPress={() => onSave({scores: canScore ? scores.map(Number) : null, datetime: time ? localDateTimeInputToUtc(time) : null})}>保存比赛</Button>
        </div>
    </div>;
}

function RoundStageEditor({round, number, stages, pending, onSave}: {round: DrawRound; number: number; stages: string[]; pending: boolean; onSave: (stage: string) => void}) {
    const current = round.stage_name ?? round.name;
    const [stage, setStage] = useState(current);
    return <div className="flex flex-wrap items-end gap-3 rounded-xl border border-default-200 p-3 dark:border-white/10">
        <div className="w-full"><p className="text-sm font-medium">{round.bracket === "winner" ? "胜者组" : round.bracket === "loser" ? "败者组" : "总决赛"}第 {number} 轮 · {round.id}</p><p className="text-xs text-default-500">当前：{round.name}</p></div>
        <label className="flex flex-1 flex-col gap-2 text-sm">所属阶段<select value={stage} disabled={pending} onChange={event => setStage(event.target.value)} className="h-10 rounded-xl border border-default-200 bg-surface px-3">{stages.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
        <Button variant="secondary" isDisabled={pending || stage === current} onPress={() => onSave(stage)}>保存阶段</Button>
    </div>;
}

function RoundEditor({rounds, pending, onSave}: {rounds: DrawRound[]; pending: boolean; onSave: (body: Record<string, unknown>) => void}) {
    const round = rounds[0];
    const [name, setName] = useState(round.stage_name ?? round.name);
    const [bo, setBo] = useState(round.best_of?.toString() ?? "");
    return <div className="flex flex-wrap items-end gap-2 rounded-xl border border-default-200 p-3 dark:border-white/10">
        <p className="w-full text-xs text-default-500">{rounds.map(item => item.name).join("、")} · 共用 BO</p>
        <TextField value={name} onChange={setName} isDisabled={pending} className="min-w-36 flex-1"><Label>轮次名称</Label><Input maxLength={80} variant="secondary"/></TextField>
        <TextField value={bo} onChange={setBo} isDisabled={pending} className="w-24"><Label>BO（可留空）</Label><Input type="number" placeholder="待定" min={3} max={23} step={2} variant="secondary"/></TextField>
        <Button variant="secondary" isDisabled={pending || !name.trim() || !validBo(bo)} onPress={() => onSave({name, best_of: bo.trim() ? Number(bo) : null})}>保存</Button>
    </div>;
}
