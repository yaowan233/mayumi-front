"use client"

import {useDisclosure} from "@heroui/use-disclosure";
import {Alert} from "@heroui/alert";
import {Card, CardBody, CardFooter} from "@heroui/card";
import {Divider} from "@heroui/divider";
import {Button} from "@heroui/button";
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/modal";
import {Link} from "@heroui/link";
import {Input, Textarea} from "@heroui/input";
import {Radio, RadioGroup} from "@heroui/radio";
import {Checkbox, CheckboxGroup} from "@heroui/checkbox";
import {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {Tooltip} from "@heroui/tooltip";
import {siteConfig} from "@/config/site";
import {Player, TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {Image} from "@heroui/image";

export const HomePage = ({tournament_info}: {tournament_info: TournamentInfo}) => {
    const currentUser  = useContext(CurrentUserContext);
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [errMsg, setErrMsg] = useState('');
    const [formData, setFormData] = useState<RegistrationInfo>({
        tournament: tournament_info.abbreviation,
        uid: currentUser?.currentUser?.uid,
        qqNumber: '',
        isFirstTimeStaff: undefined,
        tournamentExperience: '',
        selectedPositions: [],
        otherDetails: '',
        additionalComments: ''
    });
    const [members, setMembers] = useState<Player[]>([]);
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                const data = await getPlayers(tournament_info.abbreviation);
                setMembers(data.players);
            }
        };
        fetchData();
    }, [currentUser, tournament_info.abbreviation]);
    const handleRegistration = async (onClose: () => void) => {
        if (formData.qqNumber === '' || formData.isFirstTimeStaff === undefined || formData.selectedPositions.length === 0) {
            // 显示错误消息或采取其他适当的操作
            setErrMsg('请填写所有必填字段')
        }
        else if (isNaN(Number(formData.qqNumber))){
            setErrMsg('QQ号必须是数字')
        }
        else {
            // 执行报名操作或其他相关逻辑
            const res = await fetch(siteConfig.backend_url + '/api/tournament-info', {'method': 'POST', 'body': JSON.stringify(formData), 'headers': {'Content-Type': 'application/json'}})
            if (res.status != 200) {
                // 失败
                setErrMsg(await res.text());
            }
            else {
                // 关闭模态框
                onClose();
                alert('报名成功');
            }
        }
    };
    let userRank: number = 0;
    const currentUserStats = currentUser?.currentUser?.statistics_rulesets;

    if (currentUserStats) {
      switch (tournament_info.mode) {
        case 'fruits':
          userRank = currentUserStats.fruits?.global_rank ?? 0;
          break;
        case 'osu':
          userRank = currentUserStats.osu?.global_rank ?? 0;
          break;
        case 'taiko':
          userRank = currentUserStats.taiko?.global_rank ?? 0;
          break;
        case 'mania':
          userRank = currentUserStats.mania?.global_rank ?? 0;
          break;
      }
    }

    const regNotAvailable = userRank
      && (
        (tournament_info.rank_min && userRank < tournament_info.rank_min) ||
        (tournament_info.rank_max && userRank > tournament_info.rank_max) ||
        (new Date(tournament_info.start_date) < new Date())
      );
    useEffect(() => {
        if (!isOpen) {
            setErrMsg('');
            setFormData({
                tournament: tournament_info.abbreviation,
                uid: currentUser?.currentUser?.uid,
                qqNumber: '',
                isFirstTimeStaff: false,
                tournamentExperience: '',
                selectedPositions: [],
                otherDetails: '',
                additionalComments: ''
            })
        }
    }, [isOpen, currentUser?.currentUser?.uid, tournament_info.abbreviation]);
    // 更新表单字段的事件处理程序
    return (
        <div className="grid grid-cols-1 gap-y-5">
            <Image src={tournament_info.pic_url} alt={tournament_info.name} width="100%" height="auto"/>
            <h1 className={"text-3xl text-center"}>
                {tournament_info.name}
            </h1>
            <h1 className={"text-xl text-center whitespace-pre-wrap"}>
                {tournament_info.description}
            </h1>
            <div className={"flex justify-center gap-3"}>
                {tournament_info.links.map((link) => (
                    <Button isExternal href={link.url} as={Link} size="md" key={link.name}>{link.name}</Button>
                ))}
            </div>
            <Card>
                <CardBody>
                    <p>Staff报名</p>
                </CardBody>
                <Divider/>
                <CardBody className={"whitespace-pre-wrap"}>
                    <p>{tournament_info.staff_registration_info}</p>
                </CardBody>
                {currentUser?.currentUser ?
                    <>
                        <CardFooter>
                            <Button onPress={onOpen} size="md">立刻报名</Button>
                        </CardFooter>
                        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size={"5xl"} scrollBehavior={"inside"}>
                            <ModalContent>
                                {(onClose) => (
                                    <>
                                        <ModalHeader
                                            className="flex flex-col gap-1">{"报名" + tournament_info.abbreviation}</ModalHeader>
                                        <ModalBody>
                                            <p>
                                                请务必填写正确的QQ号，以便我们联系您
                                            </p>
                                            <Input isRequired type={"QQ"} label={"QQ号"} placeholder="请输入QQ号"
                                                   onChange={(e) => setFormData({
                                                       ...formData,
                                                       qqNumber: e.target.value
                                                   })}/>
                                            <Divider/>
                                            <RadioGroup label={"你是否是第一次做staff？"} isRequired={true}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            isFirstTimeStaff: (e.target.value !== "")
                                                        })}>
                                                <Radio value="1">是</Radio>
                                                <Radio value="">否</Radio>
                                            </RadioGroup>
                                            <p>
                                                列举赛事经验（不必详细说明）只需简述在什么比赛做了什么工作即可
                                            </p>
                                            <Textarea
                                                minRows={2}
                                                label="赛事经验"
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    tournamentExperience: e.target.value
                                                })}
                                            />
                                            <Divider/>
                                            <CheckboxGroup
                                                isRequired={true}
                                                label="选择想要报名的职位"
                                                //@ts-ignore
                                                onChange={(value: string[]) => setFormData({
                                                    ...formData,
                                                    selectedPositions: value
                                                })}
                                            >
                                                {tournament_info.streamer ?
                                                    <Checkbox value="直播">直播</Checkbox> : null}
                                                {tournament_info.referee ?
                                                    <Checkbox value="裁判">裁判</Checkbox> : null}
                                                {tournament_info.custom_mapper ?
                                                    <Checkbox value="作图">作图</Checkbox> : null}
                                                {tournament_info.commentator ?
                                                    <Checkbox value="解说">解说</Checkbox> : null}
                                                {tournament_info.mappooler ?
                                                    <Checkbox value="选图">选图</Checkbox> : null}
                                                {tournament_info.donator ?
                                                    <Checkbox value="赞助">赞助</Checkbox> : null}
                                                {tournament_info.designer ?
                                                    <Checkbox value="设计">设计</Checkbox> : null}
                                                {tournament_info.scheduler ?
                                                    <Checkbox value="赛程安排">赛程安排</Checkbox> : null}
                                                {tournament_info.map_tester ?
                                                    <Checkbox value="测图">测图</Checkbox> : null}
                                            </CheckboxGroup>
                                            <Textarea
                                                minRows={2}
                                                label="其他"
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    otherDetails: e.target.value
                                                })}
                                            />
                                            <Divider/>
                                            <Textarea
                                                minRows={2}
                                                label="有其他想要补充的？"
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    additionalComments: e.target.value
                                                })}
                                            />
                                        </ModalBody>
                                        <ModalFooter>
                                            <p className="text-red-500">{errMsg}</p>
                                            <Button color="danger" variant="light" onPress={onClose}>
                                                关闭
                                            </Button>
                                            <Button color="primary" onPress={() => handleRegistration(onClose)}>
                                                报名
                                            </Button>
                                        </ModalFooter>
                                    </>
                                )}
                            </ModalContent>
                        </Modal>
                    </>
                    : <CardFooter><Alert color={'warning'} title="请点击右上角登录后进行报名" /></CardFooter>}
            </Card>
            <Card>
                <CardBody>
                    <p>赛程</p>
                </CardBody>
                <Divider/>
                <CardBody className="whitespace-pre-wrap">
                    {tournament_info.tournament_schedule_info}
                </CardBody>
            </Card>
            <Card>
                <CardBody>
                    <p>奖金</p>
                </CardBody>
                <Divider/>
                <CardBody className="whitespace-pre-wrap">
                    {tournament_info.prize_info}
                </CardBody>
            </Card>
            {(new Date(tournament_info.start_date) < new Date())?
                <Alert color={'warning'} title="该比赛已结束报名" />
                :currentUser?.currentUser?
            <Card>
                <CardBody>
                    <p>报名</p>
                </CardBody>
                <Divider/>
                <CardBody className="gap-3">
                    {tournament_info.rank_max || tournament_info.rank_min ?
                        <div>
                            本比赛有排名限制
                            {tournament_info.rank_max ? <div>最高排名：{tournament_info.rank_max}</div>: null}
                            {tournament_info.rank_min ? <div>最低排名：{tournament_info.rank_min}</div>: null}
                        </div>:null
                    }
                    <div>
                        {tournament_info.registration_info}
                    </div>
                    {regNotAvailable ?
                        <Alert color={'danger'} title="您不符合报名条件" />
                        :
                        <div className="flex flex-row gap-3">
                            <Tooltip content="排名需符合赛事要求才能报名">
                                <Button color="primary"
                                        isDisabled={regNotAvailable || members.some((member) => {
                                    return member.player && member.uid === currentUser?.currentUser?.uid
                                })}
                                        onPress={async () => {
                                            const res = await fetch(siteConfig.backend_url + `/api/reg?tournament_name=${tournament_info.abbreviation}`, {'method': 'GET', 'headers': {'Content-Type': 'application/json'}, credentials: 'include'})
                                            if (res.status != 200) {
                                                // 失败
                                                alert(await res.text());
                                            }
                                            else {
                                                // 关闭模态框
                                                alert('报名成功');
                                                setMembers(await res.json())
                                            }
                                        }}
                                >
                                    报名比赛
                                </Button>
                            </Tooltip>
                            <Button color="danger" isDisabled={
                                !members.some((member) => {
                                    return member.player && member.uid === currentUser?.currentUser?.uid
                                }) || (new Date(tournament_info.start_date) < new Date())
                            }
                                onPress={async () => {
                                    const res = await fetch(siteConfig.backend_url + `/api/del_reg?tournament_name=${tournament_info.abbreviation}`, {'method': 'GET', 'headers': {'Content-Type': 'application/json'}, credentials: 'include'})
                                    if (res.status != 200) {
                                        // 失败
                                        alert(await res.text());
                                    }
                                    else {
                                        // 关闭模态框
                                        alert('取消报名成功');
                                        setMembers(await res.json())
                                    }
                                }}
                            >
                                取消报名
                            </Button>
                        </div>
                    }
                    {(members.some((member) => {
                        return member.player && member.uid === currentUser?.currentUser?.uid
                    }))?
                        <Alert color={'success'} title="您已成功报名" description={tournament_info.qq_group?`报名后请务必加群${tournament_info.qq_group}`: null} />
                        : null
                    }
                </CardBody>
            </Card>:
                <Alert color={'warning'} title="请点击右上角登录后进行赛事报名" />
            }
        </div>
    );
}


export interface TournamentInfo {
    name: string;
    abbreviation: string;
    start_date: string
    end_date: string
    pic_url: string;
    links: Link[];
    is_group: boolean;
    description?: string;
    staff_registration_info?: string;
    tournament_schedule_info?: string;
    registration_info?: string;
    prize_info?: string;
    rules_info?: string;
    rank_min?: number;
    rank_max?: number;
    referee: boolean;
    streamer: boolean;
    commentator: boolean;
    mappooler: boolean;
    custom_mapper: boolean;
    donator: boolean;
    designer: boolean;
    scheduler: boolean;
    map_tester: boolean;
    mode: string;
    challonge_api_key?: string;
    challonge_tournament_url?: string;
    is_verified?: boolean;
    qq_group?: number;
}

type Link = {
    name: string;
    url: string;
}


export type RegistrationInfo = {
    tournament: string;
    uid?: number;
    qqNumber: string;
    isFirstTimeStaff?: boolean;
    tournamentExperience: string;
    selectedPositions: string[];
    otherDetails: string;
    additionalComments: string;
}

async function getPlayers(tournament_name: string, revalidate_time: number = 0): Promise<TournamentPlayers> {
    const res = await fetch(siteConfig.backend_url + '/api/players?tournament_name=' + tournament_name,
        { next: { revalidate: revalidate_time }})
    return await res.json()
}
