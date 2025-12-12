"use client";
import React, { useContext, useEffect, useState } from "react";
import CurrentUserContext from "@/app/user_context";
import { TournamentRoundInfo } from "@/app/(home)/tournament-management/[tournament]/round/page";
import { Image } from "@heroui/image";
import { Input } from "@heroui/input";
import { siteConfig } from "@/config/site";
import { TournamentInfo } from "@/components/homepage";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Tab, Tabs } from "@heroui/tabs";
import { Spinner } from "@heroui/spinner";
import { Link } from "@heroui/link";

// --- 图标 ---
const MapIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>);
const PlusIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const SaveIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>);
const TrashIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);

export default function EditTournamentMapPoolPage(props: { params: Promise<{ tournament: string }> }) {
    const params = React.use(props.params);
    const tournament_name = decodeURIComponent(params.tournament);
    const currentUser = useContext(CurrentUserContext);

    // 状态管理
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errMsg, setErrMsg] = useState('');

    const [roundInfo, setRoundInfo] = useState<TournamentRoundInfo[]>([]);
    const [tournamentMaps, setTournamentMaps] = useState<TournamentMap[]>([]);
    const [tournamentInfo, setTournamentInfo] = useState<TournamentInfo | null>(null);
    const [selectedRound, setSelectedRound] = useState<string | null>(null);

    // 获取数据
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                try {
                    const [rounds, maps, info] = await Promise.all([
                        getRoundInfo(tournament_name),
                        getTournamentMaps(tournament_name),
                        getTournamentInfo(tournament_name)
                    ]);
                    setRoundInfo(rounds);
                    setTournamentMaps(maps);
                    setTournamentInfo(info);

                    // 默认选中最后一个轮次
                    if (rounds.length > 0) setSelectedRound(rounds[rounds.length - 1].stage_name);
                } catch (e) {
                    setErrMsg("加载失败，请刷新重试");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [currentUser, tournament_name]);

    // 保存逻辑
    const handleUpdateTournament = async () => {
        setErrMsg('');
        // 简单校验：当前显示的地图是否有空的
        const currentMaps = tournamentMaps.filter(m => m.stage_name === selectedRound);
        if (!currentMaps.every(m => m.map_id && m.mod && m.number)) {
            setErrMsg('请填写当前轮次所有地图的 ID、Mod 和序号');
            return;
        }
        if (validateModOrder(tournamentMaps)) { // 注意：这里校验的是全局，可能需要改为只校验当前轮次
             setErrMsg('同一轮次下 Mod 序号不能重复');
             return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(siteConfig.backend_url + '/api/update-tournament-maps', {
                'method': 'POST',
                'body': JSON.stringify(tournamentMaps),
                'headers': {'Content-Type': 'application/json'},
                credentials: 'include'
            })
            if (res.status != 200) {
                setErrMsg(await res.text());
            } else {
                alert('保存成功');
            }
        } catch (e) {
            setErrMsg("保存失败，网络错误");
        } finally {
            setIsSaving(false);
        }
    }

    // 更新地图列表
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
        setTournamentMaps([...tournamentMaps, {
            tournament_name: tournament_name,
            stage_name: selectedRound,
            mod: '',
            map_id: undefined,
            number: undefined,
            mode: tournamentInfo.mode,
            extra: []
        }]);
    };

    if (isLoading) return <div className="w-full h-[50vh] flex justify-center items-center"><Spinner size="lg" color="primary" /></div>;

    // 过滤当前轮次的地图
    const currentMapsWithIndex = tournamentMaps
        .map((map, index) => ({ ...map, originalIndex: index })) // 保留原始索引以便更新
        .filter(map => map.stage_name === selectedRound);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8 animate-appearance-in pb-32">

            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-default-200 dark:border-white/5 pb-6">
                <div className="flex items-center gap-3 text-default-500 text-sm mb-1">
                    <span>管理控制台</span>
                    <span>/</span>
                    <span>{tournament_name}</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                    <MapIcon />
                    图池管理
                </h1>
                <p className="text-default-500">为每个比赛轮次配置地图池 (Mappool)。</p>
            </div>

            {/* Round Selection Tabs */}
            {roundInfo.length > 0 ? (
                <div className="flex flex-col gap-6">
                    <Tabs
                        aria-label="Rounds"
                        items={roundInfo}
                        selectedKey={selectedRound}
                        onSelectionChange={(key) => setSelectedRound(key as string)}
                        variant="underlined"
                        color="primary"
                        classNames={{
                            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-default-200 dark:border-white/10",
                            cursor: "w-full bg-primary",
                            tab: "max-w-fit px-0 h-12",
                            tabContent: "group-data-[selected=true]:text-primary font-bold text-lg"
                        }}
                    >
                        {(item) => <Tab key={item.stage_name} title={item.stage_name} />}
                    </Tabs>

                    {/* Map Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {currentMapsWithIndex.map((mapWrapper) => (
                            <MapEditCard
                                key={mapWrapper.originalIndex} // 使用原始索引作为 key 并不是最佳实践，如果有唯一ID更好，但这里没有
                                map={mapWrapper}
                                index={mapWrapper.originalIndex}
                                onChange={(newMap: TournamentMap) => updateMap(mapWrapper.originalIndex, newMap)}
                                onDelete={() => removeMap(mapWrapper.originalIndex)}
                            />
                        ))}

                        {/* Add Button */}
                        <button
                            onClick={addMap}
                            className="h-[320px] border-2 border-dashed border-default-300 rounded-2xl flex flex-col items-center justify-center gap-4 text-default-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all duration-300 group"
                        >
                            <div className="p-4 rounded-full bg-default-100 group-hover:bg-primary/10 transition-colors">
                                <PlusIcon />
                            </div>
                            <span className="font-bold">添加地图</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-default-200 rounded-xl">
                    <p className="text-default-500">暂无轮次信息，请先前往“轮次管理”添加。</p>
                    <Button as={Link} href={`/tournament-management/${tournament_name}/round`} color="primary" className="mt-4">
                        去添加轮次
                    </Button>
                </div>
            )}

            {/* Sticky Footer */}
            <Card className="sticky bottom-6 z-50 border border-default-200 dark:border-white/10 bg-background/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-2xl">
                <CardBody className="flex flex-row justify-between items-center py-4 px-6">
                    <div className="text-danger font-medium text-sm animate-pulse">
                        {errMsg && <span>⚠️ {errMsg}</span>}
                    </div>
                    <Button
                        color="primary"
                        size="lg"
                        variant="shadow"
                        className="font-bold px-8 shadow-primary/20"
                        startContent={!isSaving && <SaveIcon />}
                        isLoading={isSaving}
                        onPress={handleUpdateTournament}
                    >
                        {isSaving ? "正在保存..." : "保存图池"}
                    </Button>
                </CardBody>
            </Card>
        </div>
    );
}

// --- 子组件：地图编辑卡片 ---
const MapEditCard = ({ map, index, onChange, onDelete }: any) => {
    // 动态背景图

    return (
        <Card className="border border-default-200 dark:border-white/5 bg-content1 dark:bg-zinc-900 overflow-visible">
            {/* Header: 图片预览区域 */}
            <CardHeader className="p-0 relative h-32 z-0 group overflow-hidden rounded-t-xl">
                {map.map_id ? (
                    <Image
                        removeWrapper
                        src={`https://osu.direct/api/media/background/${map.map_id}`}
                        alt="bg"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        fallbackSrc="https://nextui.org/images/card-example-4.jpeg"
                    />
                ) : (
                    <div className="w-full h-full bg-default-100 flex items-center justify-center text-default-400">
                        请输入 Map ID 加载封面
                    </div>
                )}

                {/* 遮罩 & 标题 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 flex flex-col justify-end p-4">
                    <span className="text-white font-bold text-lg">
                        {map.mod || "Mod?"} {map.number || "?"}
                    </span>
                </div>

                {/* 删除按钮 (悬浮) */}
                <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    // 修改 1: 改为实心按钮 (solid)，带有阴影，背景对比度最强
                    variant="solid"
                    onPress={onDelete}
                    // 修改 2: 响应式透明度
                    // opacity-100: 默认（手机端）一直显示
                    // md:opacity-0: 电脑端默认隐藏
                    // md:group-hover:opacity-100: 电脑端悬停显示
                    className="absolute top-2 right-2 z-20 shadow-lg border border-white/20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                >
                    <TrashIcon />
                </Button>
            </CardHeader>

            <CardBody className="p-4 gap-4">
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label="Map ID (不是Set ID)"
                        size="sm"
                        variant="bordered"
                        value={map.map_id?.toString() || ''}
                        onChange={e => onChange({...map, map_id: Number(e.target.value)})}
                    />
                    <div className="flex gap-2">
                        <Input
                            label="Mod"
                            size="sm"
                            variant="bordered"
                            placeholder="NM"
                            value={map.mod}
                            onChange={e => onChange({...map, mod: e.target.value.toUpperCase()})}
                        />
                        <Input
                            label="No."
                            size="sm"
                            variant="bordered"
                            placeholder="1"
                            value={map.number?.toString() || ''}
                            onChange={e => onChange({...map, number: Number(e.target.value)})}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-default-500 font-bold">额外信息 (可选)</span>
                        <Button size="sm" variant="light" color="primary" className="h-6 min-w-0 px-2" onPress={() => {
                            const newExtra = [...(map.extra || []), ""];
                            onChange({...map, extra: newExtra});
                        }}>+ 添加</Button>
                    </div>

                    {map.extra?.map((info: string, i: number) => (
                        <div key={i} className="flex gap-2">
                            <Input
                                size="sm"
                                variant="flat"
                                value={info}
                                onChange={e => {
                                    const newExtra = [...map.extra];
                                    newExtra[i] = e.target.value;
                                    onChange({...map, extra: newExtra});
                                }}
                            />
                            <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => {
                                const newExtra = map.extra.filter((_: any, idx: number) => idx !== i);
                                onChange({...map, extra: newExtra});
                            }}>
                                <span className="text-lg">-</span>
                            </Button>
                        </div>
                    ))}
                    {(!map.extra || map.extra.length === 0) && (
                        <span className="text-tiny text-default-400 italic">暂无额外描述 (如: Speed, low AR)</span>
                    )}
                </div>
            </CardBody>
        </Card>
    )
}


async function getTournamentMaps(tournament_name: string): Promise<TournamentMap[]> {
    const data = await fetch(siteConfig.backend_url + `/api/get_tournament_maps?tournament_name=${tournament_name}`,
        {next: {revalidate: 10}});
    return await data.json();
}


function validateModOrder(tournamentMaps: TournamentMap[]): boolean {
    for (let i = 0; i < tournamentMaps.length; i++) {
        for (let j = i + 1; j < tournamentMaps.length; j++) {
            const map1 = tournamentMaps[i];
            const map2 = tournamentMaps[j];

            // 在同一轮次下的不同对象进行比较
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
    const data = await fetch(siteConfig.backend_url + `/api/tournament-round-info?tournament_name=${tournament_name}`,
        {next: {revalidate: 10}});
    return await data.json();
}

async function getTournamentInfo(tournament_name: string): Promise<TournamentInfo> {
    const res = await fetch(siteConfig.backend_url + '/api/tournament-info?tournament_name=' + tournament_name,
        {next: {revalidate: 10}})
    return await res.json()
}
