"use client";

import {useState} from "react";
import {Button, TextArea} from "@heroui/react";
import {siteConfig} from "@/config/site";
import {normalizeMatchUrls} from "@/lib/match-links";
import {requestDraw} from "@/lib/tournament_draw";
import {selectedResultScores, type MatchResultDetails, type ResultPreview} from "@/lib/match-result";

export function MatchResultEditor({tournament, stage, matchId, onSaved}: {
    tournament: string; stage: string; matchId: string; onSaved: () => Promise<void>;
}) {
    const [open, setOpen] = useState(false);
    const [record, setRecord] = useState<MatchResultDetails | null>(null);
    const [links, setLinks] = useState("");
    const [preview, setPreview] = useState<ResultPreview | null>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const query = new URLSearchParams({tournament_name: tournament, stage_name: stage, match_id: matchId});
    const endpoint = `${siteConfig.backend_url}/api/schedule-match-result`;
    const scores = selectedResultScores(preview?.games ?? [], selected);
    const load = async () => {
        setBusy(true); setError(""); setMessage(""); setOpen(true); setPreview(null); setSelected([]); setRecord(null);
        try {
            const data = await requestDraw<MatchResultDetails>(`${endpoint}?${query}`);
            setRecord(data); setLinks(data.match_urls.join("\n"));
        } catch (e) { setError(e instanceof Error ? e.message : "加载失败，请重试"); }
        finally { setBusy(false); }
    };
    const previewScores = async () => {
        setBusy(true); setError(""); setMessage(""); setPreview(null);
        try {
            const match_urls = normalizeMatchUrls(links.split("\n"));
            const data = await requestDraw<ResultPreview>(`${endpoint}/preview?${query}`, {match_urls});
            setRecord(data); setPreview(data); setSelected(data.games.filter(game => game.selected).map(game => game.id));
        } catch (e) { setError(e instanceof Error ? e.message : "预览失败"); }
        finally { setBusy(false); }
    };
    const save = async (includeScores: boolean) => {
        if (!record) return;
        setBusy(true); setError(""); setMessage("");
        try {
            const match_urls = normalizeMatchUrls(links.split("\n"));
            await requestDraw(`${endpoint}?${query}`, {version: record.version, match_urls,
                ...(includeScores ? {selected_game_ids: selected, expected_scores: scores, preview_version: preview?.preview_version} : {})});
            setOpen(false); setPreview(null); setRecord(null);
            setMessage(includeScores ? "MP 链接和比分已保存" : "MP 链接已保存");
            try { await onSaved(); } catch { setMessage("已保存，赛程刷新失败，请刷新页面查看"); }
        } catch (e) { setError(e instanceof Error ? e.message : "保存失败"); }
        finally { setBusy(false); }
    };
    return <section className="rounded-xl border border-default-200 bg-default-50 p-3" aria-label="裁判录入比赛结果">
        {!open && <Button size="sm" variant="secondary" onPress={load} isDisabled={busy}>录入 MP / 比分</Button>}
        {open && <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2"><h4 className="font-bold">比赛链接与比分</h4><Button size="sm" variant="ghost" isDisabled={busy} onPress={() => setOpen(false)}>收起</Button></div>
            {!record && <Button size="sm" isPending={busy} onPress={load}>重新加载</Button>}
            {record && <>
                <TextArea aria-label="MP 链接，每行一个" placeholder="https://osu.ppy.sh/community/matches/123" rows={3} value={links} disabled={busy}
                    onChange={event => {setLinks(event.target.value); setPreview(null); setSelected([]); setError("");}}/>
                <p className="text-xs text-default-500">每行一个 MP 链接，可填写多个房间。仅保存链接不会修改比分。</p>
                <div className="flex flex-wrap gap-2"><Button size="sm" isDisabled={busy} onPress={() => save(false)}>仅保存链接</Button>
                    {record.can_calculate && <Button size="sm" variant="primary" isPending={busy} onPress={previewScores}>预览计算比分</Button>}</div>
                {!record.can_calculate && <p className="text-xs text-default-500">大厅或双方尚未确定的比赛仅支持保存链接。</p>}
            </>}
            {preview && <>
                <p className="text-sm">{preview.teams[0]} <strong>{scores[0]} : {scores[1]}</strong> {preview.teams[1]}{preview.best_of ? ` · BO${preview.best_of}` : ""}</p>
                <p className="text-xs text-default-500">每张图按双方总分判胜，一图一分。默认排除非图池、未结束、缺少一方成绩及同分对局；同图重赛默认只计最后一局，请逐项核对。</p>
                {!preview.best_of && <p className="text-xs text-warning">本场未配置 BO，请确认比赛已全部打完再保存比分。</p>}
                <div className="max-h-80 overflow-auto rounded-lg border border-default-200">
                    {preview.games.length === 0 && <p className="p-3 text-sm">没有找到可核算的对局。</p>}
                    {preview.games.map(game => <label key={game.id} className="flex items-start gap-3 border-b border-default-100 p-3 text-sm last:border-b-0">
                        <input type="checkbox" className="mt-1" aria-label={`计入对局 ${game.id}`} checked={selected.includes(game.id)} disabled={busy || !game.eligible}
                            onChange={event => setSelected(current => event.target.checked ? [...current, game.id] : current.filter(id => id !== game.id))}/>
                        <span className="min-w-0"><a className="text-primary underline" href={`https://osu.ppy.sh/b/${game.beatmap_id}`} target="_blank" rel="noreferrer">谱面 {game.beatmap_id}</a>
                            <span className="ml-2">{game.scores[0].toLocaleString()} : {game.scores[1].toLocaleString()}</span>
                            <span className="block text-xs text-default-500">MP {game.room_id} · 对局 {game.id}{game.ended_at ? ` · ${game.ended_at}` : ""}</span>
                            {(game.reason || game.note) && <span className="block text-xs text-warning">{game.reason || game.note}</span>}</span>
                    </label>)}
                </div>
                <Button variant="primary" isDisabled={busy || selected.length === 0} onPress={() => save(true)}>确认保存比分 {scores[0]} : {scores[1]}</Button>
            </>}
        </div>}
        {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
        {message && <p role="status" className="mt-2 text-sm text-success">{message}</p>}
    </section>;
}
