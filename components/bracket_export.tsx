"use client";

import {useContext, useEffect, useMemo, useState} from "react";
import {Button, Card, FieldError, Input, Label, Spinner, TextField} from "@heroui/react";
import {saveAs} from "file-saver";
import CurrentUserContext from "@/app/user_context";
import {canConfigureTournamentBracket, resolveManagedTournament} from "@/lib/tournament_management";
import {getBracketConfiguration, saveBracketConfiguration, type SharedBracketSettings} from "@/lib/bracket_settings";
import {
    BRACKET_ACRONYM_MAX_LENGTH, calculateBracketBestOf, generateBracket,
    getBracketAcronymErrors, getBracketEntrants, getBracketOptionsError, getDefaultBracketAcronyms,
    type BracketExportInput,
} from "@/lib/bracket_export";

interface ExportSettings {
    rounds: Record<string, {bestOf: string; banCount: string}>;
    acronyms: Record<string, string>;
}

function initialSettings(data: BracketExportInput, saved: SharedBracketSettings): ExportSettings {
    const settings: ExportSettings = {
        rounds: Object.fromEntries(data.rounds.filter((round) => !round.is_lobby).map((round) => [round.stage_name, {bestOf: "", banCount: "1"}])),
        acronyms: getDefaultBracketAcronyms(getBracketEntrants(data)),
    };
    for (const name of Object.keys(settings.rounds)) {
        const round = saved.rounds[name];
        if (round) settings.rounds[name] = {bestOf: round.bestOf == null ? "" : String(round.bestOf), banCount: String(round.banCount)};
    }
    for (const key of Object.keys(settings.acronyms)) {
        if (typeof saved.acronyms[key] === "string") settings.acronyms[key] = saved.acronyms[key];
    }
    return settings;
}

export function BracketExport({tournamentName}: {tournamentName: string}) {
    const user = useContext(CurrentUserContext)?.currentUser;
    const [loaded, setLoaded] = useState<{data: BracketExportInput; settings: ExportSettings; revision: number} | null>(null);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);

    useEffect(() => {
        if (!user?.uid) return;
        let cancelled = false;
        const load = async () => {
            setLoaded(null);
            setError("");
            try {
                const tournament = await resolveManagedTournament(user.uid, tournamentName);
                if (!tournament || !canConfigureTournamentBracket(tournament.roles)) throw new Error("仅赛事主办、直播成员和管理员可以配置比赛端导出");
                const {data, settings: saved, revision} = await getBracketConfiguration(tournamentName);
                const settings = initialSettings(data, saved);
                if (!cancelled) setLoaded({data, settings, revision});
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : "加载失败，请重试");
            }
        };
        void load();
        return () => {cancelled = true;};
    }, [user?.uid, tournamentName, reload]);

    if (user === null) return <p className="text-default-500">请先登录后查看比赛端配置。</p>;
    if (error) return <div className="flex flex-col items-start gap-3"><p role="alert" className="text-danger">{error}</p><Button variant="secondary" onPress={() => setReload((value) => value + 1)}>重新加载</Button></div>;
    if (!loaded) return <div className="flex h-48 items-center justify-center"><Spinner aria-label="正在加载比赛端配置"/></div>;
    return <BracketExportEditor key={`${tournamentName}:${user?.uid}:${reload}`} data={loaded.data} initial={loaded.settings} initialRevision={loaded.revision} tournamentName={tournamentName} onReload={() => setReload((value) => value + 1)}/>;
}

function BracketExportEditor({data, initial, initialRevision, tournamentName, onReload}: {
    data: BracketExportInput;
    initial: ExportSettings;
    initialRevision: number;
    tournamentName: string;
    onReload: () => void;
}) {
    const [settings, setSettings] = useState(initial);
    const [error, setError] = useState("");
    const [revision, setRevision] = useState(initialRevision);
    const [pending, setPending] = useState<"save" | "export" | null>(null);
    const [saveMessage, setSaveMessage] = useState("");
    const [result, setResult] = useState<{message: string; warnings: string[]} | null>(null);
    const entrants = useMemo(() => getBracketEntrants(data), [data]);
    const configurableRounds = data.rounds.filter((round) => !round.is_lobby);
    const acronymErrors = getBracketAcronymErrors(entrants, settings.acronyms);
    const roundOptions = Object.fromEntries(configurableRounds.map((round) => {
        const fields = settings.rounds[round.stage_name];
        return [round.stage_name, {
            bestOf: fields.bestOf.trim() ? Number(fields.bestOf) : undefined,
            banCount: fields.banCount.trim() ? Number(fields.banCount) : NaN,
        }];
    }));
    const hasErrors = Object.keys(acronymErrors).length > 0 || Object.values(roundOptions).some((options) => getBracketOptionsError(options));

    const updateSettings = (next: ExportSettings) => {
        setSettings(next);
        setError("");
        setResult(null);
        setSaveMessage("有未保存的配置修改");
    };

    const handleSave = async (exportFile: boolean) => {
        if (hasErrors || pending) return;
        setError("");
        setResult(null);
        setSaveMessage("");
        setPending(exportFile ? "export" : "save");
        let saved = false;
        try {
            const response = await saveBracketConfiguration(tournamentName, revision, roundOptions, settings.acronyms);
            saved = true;
            setRevision(response.revision);
            setSaveMessage("配置已保存，赛事主办和直播成员重新加载后即可使用。");
            if (exportFile) {
                const {bracket, warnings} = generateBracket(data, {rounds: roundOptions, acronyms: settings.acronyms});
                saveAs(new Blob([JSON.stringify(bracket, null, 2)], {type: "application/json;charset=utf-8"}), "bracket.json");
                setResult({message: `已生成 ${bracket.Teams.length} 个参赛单位、${bracket.Rounds.length} 个轮次和 ${bracket.Matches.length} 场对阵`, warnings});
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : "请求失败，请重试";
            setError(saved ? `配置已保存，但导出失败：${message}` : message);
        } finally {
            setPending(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-default-500">使用已保存的赛事数据（含草稿）。BO、Ban 和简称由主办与直播成员共享，修改后请保存。</p>
                <div className="flex flex-wrap gap-3">
                    <Button variant="secondary" isDisabled={pending !== null} onPress={onReload}>重新加载</Button>
                    <Button variant="secondary" isDisabled={Boolean(hasErrors) || pending !== null} isPending={pending === "save"} onPress={() => handleSave(false)}>保存配置</Button>
                    <Button variant="primary" isDisabled={Boolean(hasErrors) || pending !== null || data.rounds.length === 0 || entrants.length === 0} isPending={pending === "export"} onPress={() => handleSave(true)}>保存并导出 bracket.json</Button>
                </div>
            </div>
            {saveMessage && <p role="status" className="text-sm text-default-500">{saveMessage}</p>}
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            {result && <div role="status" className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-default-600">
                <p>{result.message}。首次载入时请登录比赛端，以补全谱面资料。</p>
                {result.warnings.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">{result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
            </div>}

            <Card variant="secondary" className="!gap-0 !p-0">
                <Card.Header className="flex flex-col items-start gap-1 border-b border-default-200 !p-5 dark:border-white/10">
                    <h2 className="text-lg font-bold">轮次设置</h2>
                    <p className="text-sm text-default-500">逐轮设置每方 Ban 数；BO 留空时，按该轮图池张数扣除双方 Ban 数后自动计算。</p>
                </Card.Header>
                <Card.Content className="divide-y divide-default-200 !p-0 dark:divide-white/10">
                    {configurableRounds.map((round) => {
                        const fields = settings.rounds[round.stage_name];
                        const options = roundOptions[round.stage_name];
                        const optionsError = getBracketOptionsError(options);
                        const count = data.maps.filter((map) => map.stage_name === round.stage_name).length;
                        const calculated = optionsError ? null : calculateBracketBestOf(count, options.banCount);
                        const bestOf = options.bestOf ?? calculated?.bestOf;
                        const note = optionsError || (options.bestOf === undefined ? calculated?.warning : count < options.bestOf + 2 * options.banCount ? `当前图池不足以支持 BO${options.bestOf} 和每方 ${options.banCount} Ban，请检查图池。` : null);
                        const updateRound = (field: "bestOf" | "banCount", value: string) => updateSettings({...settings, rounds: {...settings.rounds, [round.stage_name]: {...fields, [field]: value}}});
                        return (
                            <div key={round.stage_name} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_9rem_9rem] sm:items-center">
                                <div className="min-w-0">
                                    <h3 className="break-words font-bold">{round.stage_name}</h3>
                                    <p className="mt-1 text-sm text-default-500">{count} 张谱面{!optionsError && ` · 导出 BO${bestOf} / 每方 ${options.banCount} Ban`}</p>
                                </div>
                                <TextField isDisabled={pending !== null} value={fields.bestOf} onChange={(value) => updateRound("bestOf", value)} aria-label={`${round.stage_name} BO`}>
                                    <Label>BO（留空自动）</Label>
                                    <Input type="number" min={3} max={23} step={2} placeholder={calculated ? `自动：${calculated.bestOf}` : "自动计算"} variant="secondary" fullWidth/>
                                </TextField>
                                <TextField isDisabled={pending !== null} value={fields.banCount} onChange={(value) => updateRound("banCount", value)} aria-label={`${round.stage_name} 每方 Ban 数`}>
                                    <Label>每方 Ban 数</Label>
                                    <Input type="number" min={0} max={5} step={1} variant="secondary" fullWidth/>
                                </TextField>
                                {note && <p role={optionsError ? "alert" : undefined} className={`text-sm sm:col-span-3 ${optionsError ? "text-danger" : "text-default-500"}`}>{note}</p>}
                            </div>
                        );
                    })}
                    {configurableRounds.length === 0 && <p className="p-5 text-default-500">暂无需要配置的对阵轮次。</p>}
                </Card.Content>
            </Card>

            <Card variant="secondary" className="!gap-0 !p-0">
                <Card.Header className="flex flex-col items-start gap-1 border-b border-default-200 !p-5 dark:border-white/10">
                    <h2 className="text-lg font-bold">参赛简称</h2>
                    <p className="text-sm text-default-500">简称用于比赛端对阵显示，最多 {BRACKET_ACRONYM_MAX_LENGTH} 个字符且不能重复。完整队名和用户名会保留。</p>
                </Card.Header>
                <Card.Content className="grid gap-4 !p-5 md:grid-cols-2">
                    {entrants.map((entrant) => <div key={entrant.key} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-default-200 p-4 dark:border-white/10">
                        <div className="min-w-0 flex-1 pt-1">
                            <p className="break-words font-semibold">{entrant.name}</p>
                            <p className="mt-1 text-xs text-default-500">{entrant.kind === "team" ? `${entrant.players.length} 名成员` : `osu! ID ${entrant.players[0].uid}`}</p>
                        </div>
                        <TextField isDisabled={pending !== null} className="w-36" value={settings.acronyms[entrant.key]} isInvalid={Boolean(acronymErrors[entrant.key])} validationBehavior="aria" onChange={(value) => updateSettings({...settings, acronyms: {...settings.acronyms, [entrant.key]: value}})} aria-label={`${entrant.name} 简称`}>
                            <Label>简称</Label>
                            <Input variant="secondary" fullWidth/>
                            <FieldError>{acronymErrors[entrant.key]}</FieldError>
                        </TextField>
                    </div>)}
                    {entrants.length === 0 && <p className="text-default-500">暂无可导出的参赛选手或已审核队伍。</p>}
                </Card.Content>
            </Card>
        </div>
    );
}
