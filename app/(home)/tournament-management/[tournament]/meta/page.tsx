"use client"
import React, {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {TournamentInfo} from "@/components/homepage";
import {TournamentInfoForm} from "@/components/tournament_info_form";
import {Button} from "@heroui/button";
import {useRouter} from "next/navigation";
import {siteConfig} from "@/config/site";
import {Card, CardBody} from "@heroui/card";
import {Spinner} from "@heroui/spinner";

// --- 图标 (继承 currentColor，无需修改) ---
const SaveIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
    </svg>
);
const EditIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);

export default function EditTournamentMetaPage(props: { params: Promise<{ tournament: string }> }) {
    const params = React.use(props.params);
    const tournament_name = decodeURIComponent(params.tournament);
    const currentUser = useContext(CurrentUserContext);
    const router = useRouter();

    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errMsg, setErrMsg] = useState('');

    const [formData, setFormData] = useState<TournamentInfo>({
        name: '',
        abbreviation: '',
        pic_url: '',
        start_date: '',
        end_date: '',
        is_group: false,
        mode: 'osu',
        rank_min: undefined,
        rank_max: undefined,
        description: '',
        rules_info: '',
        staff_registration_info: '',
        tournament_schedule_info: '',
        registration_info: '',
        challonge_api_key: undefined,
        challonge_tournament_url: undefined,
        referee: true,
        commentator: true,
        streamer: true,
        mappooler: true,
        custom_mapper: true,
        designer: true,
        donator: true,
        scheduler: true,
        map_tester: true,
        links: [],
    });

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                try {
                    const data = await getTournamentInfo(tournament_name);
                    setFormData(data);
                } catch (e) {
                    setErrMsg("无法加载赛事信息，请刷新重试");
                } finally {
                    setIsLoadingData(false);
                }
            }
        };
        fetchData();
    }, [currentUser, tournament_name]);

    const handleUpdateTournament = async () => {
        setErrMsg('');
        if (!formData.name || !formData.abbreviation || !formData.mode || !formData.description || !formData.rules_info) {
            setErrMsg('请填写所有带 * 的必填字段');
            window.scrollTo({top: 0, behavior: 'smooth'});
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(siteConfig.backend_url + '/api/update-tournament', {
                'method': 'POST',
                'body': JSON.stringify(formData),
                'headers': {'Content-Type': 'application/json'},
                credentials: 'include'
            });

            if (res.status != 200) {
                setErrMsg(await res.text());
            } else {
                alert('修改成功');
                router.push(`/tournament-management/${formData.abbreviation}`);
                router.refresh();
            }
        } catch (e) {
            setErrMsg("保存失败，请检查网络连接");
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoadingData) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
                <Spinner size="lg" color="primary"/>
                <p className="text-default-500">正在加载赛事信息...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-10 flex flex-col gap-8 animate-appearance-in">

            {/* Header: 修复边框和文字颜色 */}
            {/* border-white/5 -> border-default-200 dark:border-white/5 */}
            <div className="flex flex-col gap-2 border-b border-default-200 dark:border-white/5 pb-6">
                <div className="flex items-center gap-3 text-default-500 text-sm mb-1">
                    <span>管理控制台</span>
                    <span>/</span>
                    <span>{tournament_name}</span>
                </div>
                {/* text-white -> text-foreground (自动适配黑/白) */}
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                    <EditIcon/>
                    编辑赛事信息
                </h1>
                <p className="text-default-500">修改比赛的基本设置、规则、介绍等元数据。</p>
            </div>

            {/* Form */}
            <TournamentInfoForm formData={formData} setFormData={setFormData} errMsg={errMsg}/>

            {/* Sticky Footer Action Bar: 修复背景和边框 */}
            <Card
                className="sticky bottom-6 z-50 border border-default-200 dark:border-white/10 bg-background/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-2xl">
                <CardBody className="flex flex-row justify-between items-center py-4 px-6">

                    {/* 左侧：取消按钮 + 错误信息 */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="light"
                            color="default"
                            onPress={() => router.back()}
                            // hover:text-white -> hover:text-foreground (防止亮色模式下 hover 变白看不见)
                            className="font-medium text-default-500 hover:text-foreground"
                        >
                            取消
                        </Button>
                        <div className="text-danger font-medium text-sm animate-pulse">
                            {errMsg && <span>⚠️ {errMsg}</span>}
                        </div>
                    </div>

                    {/* 右侧：提交按钮 */}
                    <Button
                        color="primary"
                        size="lg"
                        variant="shadow"
                        className="font-bold px-8 shadow-primary/20"
                        startContent={!isSaving && <SaveIcon/>}
                        isLoading={isSaving}
                        onPress={handleUpdateTournament}
                    >
                        {isSaving ? "正在保存..." : "保存修改"}
                    </Button>
                </CardBody>
            </Card>
        </div>
    );
}

// 获取数据 API
async function getTournamentInfo(tournament_name: string): Promise<TournamentInfo> {
    const res = await fetch(siteConfig.backend_url + '/api/tournament-info?tournament_name=' + tournament_name,
        {next: {revalidate: 0}})
    if (!res.ok) throw new Error("Failed to fetch");
    return await res.json()
}