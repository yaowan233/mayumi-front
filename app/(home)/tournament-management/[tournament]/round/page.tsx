"use client";
import {Button} from "@heroui/button";
import {Input} from "@heroui/input";
import {Switch} from "@heroui/switch";
import React, {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {siteConfig} from "@/config/site";


export default function EditRoundPage(props: { params: Promise<{ tournament: string }> }) {
    const params = React.use(props.params);
    const tournament_name = decodeURIComponent(params.tournament);
    const initialFormData: TournamentRoundInfo = {
        tournament_name: tournament_name,
        stage_name: '',
        start_time: undefined,
        end_time: undefined,
        is_lobby: false
    };
    const currentUser = useContext(CurrentUserContext);
    const [errMsg, setErrMsg] = useState('');
    const [formData, setFormData] = useState<TournamentRoundInfo[]>([]);
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                const data = await getRoundInfo(tournament_name);
                setFormData(data);
            }
        };
        fetchData();
    }, [currentUser, tournament_name]);
    const handleUpdateTournament = async () => {
        if (!formData.every(round => round.stage_name && round.start_time)) {
            // 显示错误消息或采取其他适当的操作
            setErrMsg('请填写所有必填字段')
        }
        else {
            // 执行报名操作或其他相关逻辑
            const res = await fetch(siteConfig.backend_url + '/api/update-tournament-round-info', {'method': 'POST', 'body': JSON.stringify(formData), 'headers': {'Content-Type': 'application/json'}, credentials: 'include'})
            if (res.status != 200) {
                // 失败
                setErrMsg(await res.text());
            }
            else {
                // 关闭模态框
                alert('修改成功');
            }
        }
    }

    return (
        <div className="flex flex-col gap-5">
            <h1 className="text-3xl font-bold">轮次管理</h1>
            <div>
                <Button color="primary" onPress={() => { setFormData([...formData, initialFormData]) }}>
                    添加轮次
                </Button>
            </div>
            {
                formData.map((round, index) => (
                    <RoundInfoForm
                        roundData={round}
                        key={index}
                        setFormData={(updatedFormData) => {
                            const newFormData = [...formData];
                            newFormData[index] = updatedFormData;
                            setFormData(newFormData);
                        }}
                        deleteRound={() => {
                            const newFormData = [...formData];
                            newFormData.splice(index, 1);
                            setFormData(newFormData);
                        }}
                        errMsg={errMsg}
                    />
                ))
            }
            <Button className="max-w-fit" onPress={handleUpdateTournament}>更新轮次信息</Button>
            <div className="text-red-500">
                {errMsg}
            </div>
        </div>
    );
}

interface RoundInfoFormProps {
    roundData: TournamentRoundInfo;
    setFormData: (updatedFormData: TournamentRoundInfo) => void;
    deleteRound: () => void;
    errMsg?: string;
}

const RoundInfoForm = ({ roundData, setFormData, deleteRound, errMsg }: RoundInfoFormProps) => {


    return (
        <div className="flex flex-row gap-3 items-center space-x-4">
            <Input
                label="轮次名"
                value={roundData.stage_name}
                isRequired
                isInvalid={!!errMsg && !roundData.stage_name}
                onChange={e => setFormData({ ...roundData, stage_name: e.target.value })}
            />
            <Input
                label="开始日期"
                value={roundData.start_time || ''}
                isRequired
                placeholder="Enter your email"
                type="date"
                isInvalid={!!errMsg && !roundData.start_time}
                onChange={e => setFormData({ ...roundData, start_time: e.target.value })}
            />
            <Input
                label="结束日期"
                value={roundData.end_time || ''}
                placeholder="Enter your email"
                type="date"
                onChange={e => setFormData({ ...roundData, end_time: e.target.value })}
            />
            <Switch
                defaultSelected={roundData.is_lobby}
                className="min-w-fit"
                onChange={e => setFormData({ ...roundData, is_lobby: e.target.checked })}
            >
                小组赛
            </Switch>
            <Button color="danger" onPress={deleteRound}>删除</Button>
        </div>
    );
}

export interface TournamentRoundInfo {
    tournament_name: string;
    stage_name: string;
    start_time?: string;
    end_time?: string;
    is_lobby: boolean;
}

async function getRoundInfo(tournament_name: string): Promise<TournamentRoundInfo[]> {
    const data = await fetch(siteConfig.backend_url + `/api/tournament-round-info?tournament_name=${tournament_name}`,
        { next: { revalidate: 10 }});
    return await data.json();
}
