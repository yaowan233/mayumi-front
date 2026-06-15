"use client";

import React, {useContext, useEffect, useState} from "react";
import NextImage from "next/image";
import {Button, Card, Input, Label, Spinner, Tabs, TextField} from "@heroui/react";
import CurrentUserContext from "@/app/user_context";
import {TournamentRoundInfo} from "@/app/(home)/tournament-management/[tournament]/round/page";
import {siteConfig} from "@/config/site";
import {TournamentInfo} from "@/components/homepage";
import {resolveManagedTournamentName} from "@/lib/tournament_management";

const MapIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
        <line x1="8" y1="2" x2="8" y2="18"/>
        <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
);

const PlusIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);

const SaveIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
    </svg>
);

const TrashIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
);

export default function EditTournamentMapPoolPage(props: { params: Promise<{ tournament: string }> }) {
    const params = React.use(props.params);
    const tournament_abbr = decodeURIComponent(params.tournament);
    const currentUser = useContext(CurrentUserContext);
    const [tournamentName, setTournamentName] = useState(tournament_abbr);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [errMsg, setErrMsg] = useState("");

    const [roundInfo, setRoundInfo] = useState<TournamentRoundInfo[]>([]);
    const [tournamentMaps, setTournamentMaps] = useState<TournamentMap[]>([]);
    const [tournamentInfo, setTournamentInfo] = useState<TournamentInfo | null>(null);
    const [selectedRound, setSelectedRound] = useState<string | undefined>();

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                try {
                    const managedTournamentName = await resolveManagedTournamentName(currentUser.currentUser.uid, tournament_abbr);
                    setTournamentName(managedTournamentName);
                    const [rounds, maps, info] = await Promise.all([
                        getRoundInfo(managedTournamentName),
                        getTournamentMaps(managedTournamentName),
                        getTournamentInfo(managedTournamentName),
                    ]);
                    setRoundInfo(rounds);
                    setTournamentMaps(maps);
                    setTournamentInfo(info);

                    if (rounds.length > 0) setSelectedRound(rounds[rounds.length - 1].stage_name);
                } catch {
                    setErrMsg("加载失败，请刷新重试");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [currentUser, tournament_abbr]);

    const handleUpdateTournament = async () => {
        setErrMsg("");
        const currentMaps = tournamentMaps.filter((m) => m.stage_name === selectedRound);
        if (!currentMaps.every((m) => m.map_id && m.mod && m.number)) {
            setErrMsg("请填写当前轮次所有地图的 ID、Mod 和序号");
            return;
        }
        if (validateModOrder(tournamentMaps)) {
            setErrMsg("同一轮次下 Mod 序号不能重复");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(siteConfig.backend_url + "/api/update-tournament-maps", {
                method: "POST",
                body: JSON.stringify(tournamentMaps),
                headers: {"Content-Type": "application/json"},
                credentials: "include",
            });
            if (res.status !== 200) {
                setErrMsg(await res.text());
            } else {
                alert("保存成功");
            }
        } catch {
            setErrMsg("保存失败，网络错误");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSyncTournamentMaps = async () => {
        setErrMsg("");
        setIsSyncing(true);
        try {
            const res = await fetch(
                siteConfig.backend_url + `/api/sync-tournament-maps?tournament_name=${encodeURIComponent(tournamentName)}`,
                {
                    method: "POST",
                    credentials: "include",
                },
            );
            if (res.status !== 200) {
                setErrMsg(await res.text());
            } else {
                const data = await res.json();
                alert(`已开始同步 ${data.count} 张图池谱面`);
            }
        } catch {
            setErrMsg("同步失败，网络错误");
        } finally {
            setIsSyncing(false);
        }
    };

    const updateMap = (index: number, newMap: TournamentMap) => {
        const newMaps = [...tournamentMaps];
        newMaps[index] = newMap;
        setTournamentMaps(newMaps);
    };

    const removeMap = (index: number) => {
        const newMaps = [...tournamentMaps];
        newMaps.splice(index, 1);
        setTournamentMaps(newMaps);
    };

    const addMap = () => {
        if (!selectedRound || !tournamentInfo) return;
        setTournamentMaps([
            ...tournamentMaps,
            {
                tournament_name: tournamentName,
                stage_name: selectedRound,
                mod: "",
                map_id: undefined,
                number: undefined,
                mode: tournamentInfo.mode,
                extra: [],
            },
        ]);
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Spinner size="lg" color="accent"/>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-32 py-8">
            <div className="flex flex-col gap-2 border-b border-default-200 pb-6 dark:border-white/5">
                <div className="mb-1 flex items-center gap-3 text-sm text-default-500">
                    <span>管理控制台</span>
                    <span>/</span>
                    <span>{tournament_abbr}</span>
                </div>
                <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-foreground">
                    <MapIcon/>
                    图池管理
                </h1>
                <p className="text-default-500">为每个比赛轮次配置地图池 (Mappool)。</p>
            </div>

            {roundInfo.length > 0 ? (
                <div className="flex flex-col gap-6">
                    <div className="w-fit max-w-full">
                        <Tabs selectedKey={selectedRound ?? undefined} onSelectionChange={(key) => setSelectedRound(key as string)}>
                            <Tabs.ListContainer className="w-fit max-w-full">
                                <Tabs.List aria-label="Rounds" className="w-fit max-w-full">
                                    {roundInfo.map((item) => (
                                        <Tabs.Tab key={item.stage_name} id={item.stage_name} className="whitespace-nowrap">
                                            <span>{item.stage_name}</span>
                                            <Tabs.Indicator/>
                                        </Tabs.Tab>
                                    ))}
                                </Tabs.List>
                            </Tabs.ListContainer>

                            {roundInfo.map((item) => {
                                const mapsForRound = tournamentMaps
                                    .map((map, index) => ({...map, originalIndex: index}))
                                    .filter((map) => map.stage_name === item.stage_name);

                                return (
                                    <Tabs.Panel key={item.stage_name} id={item.stage_name} className="pt-6">
                                        <div className="grid grid-cols-1 justify-items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
                                            {mapsForRound.map((mapWrapper) => (
                                                <MapEditCard
                                                    key={mapWrapper.originalIndex}
                                                    map={mapWrapper}
                                                    index={mapWrapper.originalIndex}
                                                    onChange={(newMap: TournamentMap) => updateMap(mapWrapper.originalIndex, newMap)}
                                                    onDelete={() => removeMap(mapWrapper.originalIndex)}
                                                />
                                            ))}

                                            <Button onPress={addMap} variant="secondary" className="h-[320px] w-full min-w-[320px] max-w-[420px]">
                                                <PlusIcon/>
                                                添加地图
                                            </Button>
                                        </div>
                                    </Tabs.Panel>
                                );
                            })}
                        </Tabs>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-default-200 py-20">
                    <p className="text-default-500">暂无轮次信息，请先前往“轮次管理”添加。</p>
                    <Button variant="primary" className="mt-4" onPress={() => window.location.assign(`/tournament-management/${tournament_abbr}/round`)}>
                        去添加轮次
                    </Button>
                </div>
            )}

            <Card variant="secondary" className="sticky bottom-6 z-50 border border-default-200 bg-background/90 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/90">
                <Card.Content className="flex flex-row items-center justify-between px-6 py-4">
                    <div className="text-sm font-medium text-danger animate-pulse">
                        {errMsg && <span>⚠️ {errMsg}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button size="lg" variant="secondary" className="px-6 font-bold" isPending={isSyncing} onPress={handleSyncTournamentMaps}>
                            {({isPending}) => (
                                <>
                                    {isPending ? "正在同步..." : "同步图池数据"}
                                </>
                            )}
                        </Button>
                        <Button size="lg" variant="primary" className="px-8 font-bold shadow-primary/20" isPending={isSaving} onPress={handleUpdateTournament}>
                            {({isPending}) => (
                                <>
                                    {!isPending && <SaveIcon/>}
                                    {isPending ? "正在保存..." : "保存图池"}
                                </>
                            )}
                        </Button>
                    </div>
                </Card.Content>
            </Card>
        </div>
    );
}

const MapEditCard = ({map, index, onChange, onDelete}: any) => {
    return (
        <Card className="group w-full max-w-[420px] overflow-hidden rounded-2xl !p-0 !gap-0">
            <Card.Header className="relative z-0 h-32 overflow-hidden rounded-t-2xl p-0">
                {map.map_id ? (
                    <NextImage
                        src={`https://osu.direct/api/media/background/${map.map_id}`}
                        alt="bg"
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="h-full w-full rounded-t-2xl object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-t-2xl bg-default-100 text-default-400">
                        请输入 Map ID 加载封面
                    </div>
                )}

                <div className="absolute inset-0 z-10 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-4">
                    <span className="text-lg font-bold text-white">
                        {map.mod || "Mod?"} {map.number || "?"}
                    </span>
                </div>

                <Button
                    isIconOnly
                    size="sm"
                    variant="danger"
                    onPress={onDelete}
                    className="absolute right-2 top-2 z-20 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                >
                    <TrashIcon/>
                </Button>
            </Card.Header>

            <Card.Content className="flex flex-col gap-4 p-0">
                <div className="grid grid-cols-2 gap-3 px-4 pt-4">
                    <TextField name={`map-id-${index}`}>
                        <Label>Map ID (不是Set ID)</Label>
                        <Input
                            variant="secondary"
                            fullWidth
                            value={map.map_id?.toString() || ""}
                            onChange={(e) => onChange({...map, map_id: Number(e.target.value)})}
                        />
                    </TextField>

                    <div className="flex gap-2">
                        <TextField name={`mod-${index}`} className="flex-1">
                            <Label>Mod</Label>
                            <Input
                                variant="secondary"
                                fullWidth
                                placeholder="NM"
                                value={map.mod}
                                onChange={(e) => onChange({...map, mod: e.target.value.toUpperCase()})}
                            />
                        </TextField>

                        <TextField name={`number-${index}`} className="flex-1">
                            <Label>No.</Label>
                            <Input
                                variant="secondary"
                                fullWidth
                                placeholder="1"
                                value={map.number?.toString() || ""}
                                onChange={(e) => onChange({...map, number: Number(e.target.value)})}
                            />
                        </TextField>
                    </div>
                </div>

                <div className="flex flex-col gap-2 px-4 pb-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-default-500">额外信息 (可选)</span>
                        <Button size="sm" variant="ghost" onPress={() => {
                            const newExtra = [...(map.extra || []), ""];
                            onChange({...map, extra: newExtra});
                        }}>
                            + 添加
                        </Button>
                    </div>

                    {map.extra?.map((info: string, i: number) => (
                        <div key={i} className="flex gap-2">
                            <Input
                                variant="secondary"
                                fullWidth
                                value={info}
                                onChange={(e) => {
                                    const newExtra = [...map.extra];
                                    newExtra[i] = e.target.value;
                                    onChange({...map, extra: newExtra});
                                }}
                            />
                            <Button isIconOnly size="sm" variant="danger" onPress={() => {
                                const newExtra = map.extra.filter((_: any, idx: number) => idx !== i);
                                onChange({...map, extra: newExtra});
                            }}>
                                <span className="text-lg">-</span>
                            </Button>
                        </div>
                    ))}

                    {(!map.extra || map.extra.length === 0) && (
                        <span className="text-[11px] italic text-default-400 opacity-70">暂无额外描述 (如: Speed, low AR)</span>
                    )}
                </div>
            </Card.Content>
        </Card>
    );
};

async function getTournamentMaps(tournament_name: string): Promise<TournamentMap[]> {
    const data = await fetch(siteConfig.backend_url + `/api/get_tournament_maps?tournament_name=${tournament_name}`, {
        next: {revalidate: 10},
    });
    return await data.json();
}

function validateModOrder(tournamentMaps: TournamentMap[]): boolean {
    for (let i = 0; i < tournamentMaps.length; i++) {
        for (let j = i + 1; j < tournamentMaps.length; j++) {
            const map1 = tournamentMaps[i];
            const map2 = tournamentMaps[j];

            if (
                map1.stage_name === map2.stage_name &&
                map1.mod === map2.mod &&
                map1.number === map2.number
            ) {
                return true;
            }
        }
    }

    return false;
}

interface TournamentMap {
    tournament_name: string;
    stage_name: string;
    mod?: string;
    map_id?: number;
    number?: number;
    mode?: string;
    extra?: string[];
}

async function getRoundInfo(tournament_name: string): Promise<TournamentRoundInfo[]> {
    const data = await fetch(siteConfig.backend_url + `/api/tournament-round-info?tournament_name=${tournament_name}`, {
        next: {revalidate: 10},
    });
    return await data.json();
}

async function getTournamentInfo(tournament_name: string): Promise<TournamentInfo> {
    const res = await fetch(siteConfig.backend_url + "/api/tournament-info?tournament_name=" + tournament_name, {
        next: {revalidate: 10},
    });
    return await res.json();
}
