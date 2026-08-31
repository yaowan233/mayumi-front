"use client"
import React, {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {TournamentInfo} from "@/components/homepage";
import {TournamentInfoForm} from "@/components/tournament_info_form";
import {Button, Card, Spinner} from "@heroui/react";
import {useRouter} from "next/navigation";
import {canPublishManagedTournament, resolveManagedTournament} from "@/lib/tournament_management";
import {getDraftSection, publishTournamentDraft, saveDraftSection} from "@/lib/tournament_drafts";
import {DraftAction, DraftSaveActions} from "@/components/draft_save_actions";
import {ManagementBackLink} from "@/components/management_back_link";
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
    const [pendingAction, setPendingAction] = useState<DraftAction | null>(null);
    const [errMsg, setErrMsg] = useState('');
    const [tournamentName, setTournamentName] = useState(tournament_abbr);
    const [canPublish, setCanPublish] = useState(false);
    const [isApproved, setIsApproved] = useState(false);

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
                    const managedTournament = await resolveManagedTournament(currentUser.currentUser.uid, tournament_abbr);
                    const managedTournamentName = managedTournament?.abbreviation ?? tournament_abbr;
                    setTournamentName(managedTournamentName);
                    setCanPublish(canPublishManagedTournament(managedTournament, currentUser.currentUser.uid));
                    setIsApproved(managedTournament?.status === "approved");
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

    const handleUpdateTournament = async (action: DraftAction) => {
        setErrMsg('');
        if (!formData.name || !formData.abbreviation || !formData.mode || !formData.description || !formData.rules_info) {
            setErrMsg('请填写所有带 * 的必填字段');
            window.scrollTo({top: 0, behavior: 'smooth'});
            return;
        }

        const shouldPublish = action === "publish";
        let draftSaved = false;
        setPendingAction(action);
        try {
            await saveDraftSection(tournamentName, "meta", formData);
            draftSaved = true;
            if (!shouldPublish) {
                alert('草稿已保存，公开页面尚未更新');
                return;
            }

            const result = await publishTournamentDraft(tournamentName, {sections: ["meta"]});
            alert(result.message);
            if (result.new_abbr !== tournament_abbr) {
                router.replace(`/tournament-management/${encodeURIComponent(result.new_abbr)}/meta`);
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : "请检查网络连接";
            setErrMsg(draftSaved ? `草稿已保存，但发布失败：${message}` : `保存失败：${message}`);
            window.scrollTo({top: 0, behavior: 'smooth'});
        } finally {
            setPendingAction(null);
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
                    <ManagementBackLink tournament={tournament_abbr}/>
                    <span>/</span>
                    <span>{tournament_abbr}</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                    <EditIcon/>
                    编辑赛事信息
                </h1>
                <p className="text-default-500">修改比赛的基本设置、规则、介绍等元数据，可保存为草稿或直接发布。</p>
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

                    <DraftSaveActions
                        pendingAction={pendingAction}
                        canPublish={canPublish}
                        publishLabel={isApproved ? "保存并发布" : "保存并提交审核"}
                        onSave={() => handleUpdateTournament("save")}
                        onPublish={() => handleUpdateTournament("publish")}
                    />
                </Card.Content>
            </Card>
        </div>
    );
}
