"use client"
import {useState} from "react";
import {TournamentInfo} from "@/components/homepage";
import {TournamentInfoForm} from "@/components/tournament_info_form";
import {Button} from "@heroui/button";
import {useRouter} from "next/navigation";
import {siteConfig} from "@/config/site";
import {Card, CardBody} from "@heroui/card";
import {Spinner} from "@heroui/spinner";

// 图标
const CreateIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
);

export default function CreateTournamentPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<TournamentInfo>({
        // ... (保持原有的初始值不变)
        name: '', abbreviation: '', pic_url: '', start_date: '', end_date: '', is_group: false, mode: 'osu',
        rank_min: undefined, rank_max: undefined, description: '', rules_info: '', staff_registration_info: '',
        tournament_schedule_info: '', registration_info: '', challonge_api_key: undefined, challonge_tournament_url: undefined,
        referee: true, commentator: true, streamer: true, mappooler: true, custom_mapper: true, designer: true,
        donator: true, scheduler: true, map_tester: true, links: [],
    });
    const [errMsg, setErrMsg] = useState('');

    const handleCreateTournament = async () => {
        setErrMsg('');
        if (!formData.name || !formData.abbreviation || !formData.mode || !formData.description || !formData.rules_info) {
            setErrMsg('请填写所有带 * 的必填字段');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(siteConfig.backend_url + '/api/create-tournament', {
                'method': 'POST',
                'body': JSON.stringify(formData),
                'headers': {'Content-Type': 'application/json'},
                credentials: 'include'
            });

            if (res.status != 200) {
                const msg = await res.json();
                setErrMsg(msg['detail'] || "创建失败，请重试");
            } else {
                alert('创建成功！即将跳转...');
                router.push('/');
            }
        } catch (e) {
            setErrMsg("网络请求失败，请检查连接");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-10 flex flex-col gap-8 animate-appearance-in">
            {/* Header */}
            <div className="flex flex-col gap-2">
                {/* 修复：text-white -> text-foreground */}
                <h1 className="text-4xl font-black tracking-tight text-foreground">创建新比赛</h1>
                <p className="text-default-500">填写下方信息以发起一场全新的 osu! 赛事。创建后需经管理员审核才会对外展示。</p>
            </div>

            {/* Form */}
            {/* 注意：TournamentInfoForm 内部也需要确保使用了语义化颜色 (如 bg-content1) 而不是写死 bg-zinc-900 */}
            <TournamentInfoForm formData={formData} setFormData={setFormData} errMsg={errMsg}/>

            {/* Footer Action */}
            <Card
                // 修复：背景色、边框适配亮/暗模式
                // 亮色: bg-background/90 border-default-200
                // 暗色: dark:bg-zinc-900/90 dark:border-white/10
                className="sticky bottom-6 z-50 border border-default-200 dark:border-white/10 bg-background/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-2xl"
            >
                <CardBody className="flex flex-row justify-between items-center py-4 px-6">

                    {/* 左侧：取消按钮 + 错误信息 */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="light"
                            color="danger"
                            onPress={() => router.back()}
                            className="font-medium"
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
                        startContent={!isLoading && <CreateIcon />}
                        isLoading={isLoading}
                        onPress={handleCreateTournament}
                    >
                        {isLoading ? "正在提交..." : "立即创建比赛"}
                    </Button>
                </CardBody>
            </Card>
        </div>
    );
}