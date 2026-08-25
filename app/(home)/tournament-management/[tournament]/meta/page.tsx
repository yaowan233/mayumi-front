"use client"
import React, {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {TournamentInfo} from "@/components/homepage";
import {TournamentInfoForm} from "@/components/tournament_info_form";
import {Button, Card, Spinner} from "@heroui/react";
import {useRouter} from "next/navigation";
import {resolveManagedTournamentName} from "@/lib/tournament_management";
import {getDraftSection, saveDraftSection} from "@/lib/tournament_drafts";

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
    const tournament_abbr = decodeURIComponent(params.tournament);
    const currentUser = useContext(CurrentUserContext);
    const router = useRouter();

    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errMsg, setErrMsg] = useState('');
    const [tournamentName, setTournamentName] = useState(tournament_abbr);

    const [formData, setFormData] = useState<TournamentInfo>({
        name: '',
        abbreviation: '',
        pic_url: '',
        theme_color: '#006FEE',
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
        status: 'pending',
        reject_reason: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                try {
                    const managedTournamentName = await resolveManagedTournamentName(currentUser.currentUser.uid, tournament_abbr);
                    setTournamentName(managedTournamentName);
                    const draft = await getDraftSection<TournamentInfo>(managedTournamentName, "meta");
                    setFormData(draft.data);
                } catch (e) {
                    setErrMsg("无法加载赛事信息，请刷新重试");
                } finally {
                    setIsLoadingData(false);
                }
            }
        };
        fetchData();
    }, [currentUser, tournament_abbr]);

    const handleUpdateTournament = async () => {
        setErrMsg('');
        if (!formData.name || !formData.abbreviation || !formData.mode || !formData.description || !formData.rules_info) {
            setErrMsg('请填写所有带 * 的必填字段');
            window.scrollTo({top: 0, behavior: 'smooth'});
            return;
        }

        setIsSaving(true);
        try {
            await saveDraftSection(tournamentName, "meta", formData);
            alert('草稿已保存，公开页面尚未更新');
        } catch (e) {
            setErrMsg(e instanceof Error ? e.message : "保存失败，请检查网络连接");
            window.scrollTo({top: 0, behavior: 'smooth'});
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoadingData) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
                <Spinner size="lg" color="accent"/>
                <p className="text-default-500">正在加载赛事信息...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-10 flex flex-col gap-8">

            <div className="flex flex-col gap-2 border-b border-default-200 dark:border-white/5 pb-6">
                <div className="flex items-center gap-3 text-default-500 text-sm mb-1">
                    <span>管理控制台</span>
                    <span>/</span>
                    <span>{tournament_abbr}</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                    <EditIcon/>
                    编辑赛事信息
                </h1>
                <p className="text-default-500">修改比赛的基本设置、规则、介绍等元数据。保存后需在管理首页统一发布。</p>
            </div>

            <TournamentInfoForm formData={formData} setFormData={setFormData} errMsg={errMsg}/>

            <Card
                variant="secondary"
                className="border border-default-200 bg-background/90 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/90">
                <Card.Content className="flex flex-row items-center justify-between gap-4 px-6 py-4">

                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onPress={() => router.back()}
                            className="font-medium text-default-500 hover:text-foreground"
                        >
                            取消
                        </Button>
                        <div className="text-danger font-medium text-sm animate-pulse">
                            {errMsg && <span>⚠️ {errMsg}</span>}
                        </div>
                    </div>

                    <Button
                        size="lg"
                        variant="primary"
                        className="font-bold px-8 shadow-primary/20"
                        isPending={isSaving}
                        onPress={handleUpdateTournament}
                    >
                        {({isPending}) => (
                            <>
                                {!isPending && <SaveIcon/>}
                                {isPending ? "正在保存..." : "保存草稿"}
                            </>
                        )}
                    </Button>
                </Card.Content>
            </Card>
        </div>
    );
}
