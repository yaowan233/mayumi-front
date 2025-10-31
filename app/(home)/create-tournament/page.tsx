"use client"
import {useState} from "react";
import {TournamentInfo} from "@/components/homepage";
import {TournamentInfoForm} from "@/components/tournament_info_form";
import {Button} from "@heroui/button";
import {useRouter} from "next/navigation";
import {siteConfig} from "@/config/site";

export default function CreateTournamentPage() {
    const router = useRouter();
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
    const [errMsg, setErrMsg] = useState('');
    const handleCreateTournament = async () => {
        if (!formData.name || !formData.abbreviation || !formData.mode || !formData.description || !formData.rules_info) {
            // 显示错误消息或采取其他适当的操作
            setErrMsg('请填写所有必填字段')
        } else {
            // 执行报名操作或其他相关逻辑
            const res = await fetch(siteConfig.backend_url + '/api/create-tournament', {
                'method': 'POST',
                'body': JSON.stringify(formData),
                'headers': {'Content-Type': 'application/json'},
                credentials: 'include'
            })
            if (res.status != 200) {
                // 失败
                const msg = await res.json();
                setErrMsg(msg['detail']);
            } else {
                // 关闭模态框
                alert('创建成功');
                router.push('/')
            }
        }
    }
    return (
        <div className="flex flex-col gap-5">
            <TournamentInfoForm formData={formData} setFormData={setFormData} errMsg={errMsg}/>
            <h1 className={"text-3xl font-bold"}>
                创建比赛
            </h1>
            当填写所有信息后，点击下方按钮即可创建比赛。请注意，比赛页面将在审核通过后才会被展示。
            <div className="flex flex-row items-center gap-5">
                <Button className="max-w-fit" onPress={handleCreateTournament}>创建比赛</Button>
                <div className="text-red-500">
                    {errMsg}
                </div>
            </div>
        </div>
    );
}
