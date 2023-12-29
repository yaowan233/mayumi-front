"use client"

import {useDisclosure} from "@nextui-org/use-disclosure";
import {Card, CardBody} from "@nextui-org/card";
import {Divider} from "@nextui-org/divider";
import {Button} from "@nextui-org/button";
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@nextui-org/modal";
import {Link} from "@nextui-org/link";
import {Input, Textarea} from "@nextui-org/input";
import {Radio, RadioGroup} from "@nextui-org/radio";
import {Checkbox, CheckboxGroup} from "@nextui-org/checkbox";
import {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";

export const HomePage = ({tournament_info}: {tournament_info: TournamentInfo}) => {
    const currentUser  = useContext(CurrentUserContext);
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [errMsg, setErrMsg] = useState('');
    const [formData, setFormData] = useState<RegistrationInfo>({
        tournament: tournament_info.abbreviation,
        uid: currentUser?.currentUser?.uid,
        qqNumber: '',
        isFirstTimeStaff: false,
        tournamentExperience: '',
        selectedPositions: [],
        otherDetails: '',
        additionalComments: ''
    });
    const handleRegistration = async (onClose: () => void) => {
        if (!formData.qqNumber || !formData.isFirstTimeStaff || formData.selectedPositions.length === 0) {
            // 显示错误消息或采取其他适当的操作
            setErrMsg('请填写所有必填字段')
        }
        else if (isNaN(Number(formData.qqNumber))){
            setErrMsg('QQ号必须是数字')
        }
        else {
            // 执行报名操作或其他相关逻辑
            console.log(JSON.stringify(formData))
            const res = await fetch('http://localhost:8421/api/tournament-info', {'method': 'POST', 'body': JSON.stringify(formData), 'headers': {'Content-Type': 'application/json'}})
            if (res.status != 200) {
                // 失败
                setErrMsg(await res.text());
            }
            else {
                // 关闭模态框
                onClose();
            }
        }
    };
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
    }, [isOpen]);
    console.log(formData)
    // 更新表单字段的事件处理程序
    return (
        <div className="grid grid-cols-1 gap-y-5">
            <h1 className={"text-3xl text-center"}>
                {tournament_info.name}
            </h1>
            <h1 className={"text-xl text-center"}>
                {tournament_info.description}
            </h1>
            <div className={"flex justify-center"}>
                {tournament_info.links.map((link) => (
                    <Button isExternal href={link.url} as={Link} size="md" key={link.name}>{link.name}</Button>
                ))}
            </div>
            <Card>
                <CardBody>
                    <p>Staff报名</p>
                </CardBody>
                <Divider/>
                <CardBody>
                    <p>{tournament_info.staff_registration_info}</p>
                </CardBody>
                <div className="flex gap-4 items-center py-2 px-2">
                    <Button onPress={onOpen} size="md">立刻报名</Button>
                </div>
                <Modal isOpen={isOpen} onOpenChange={onOpenChange} size={"5xl"} scrollBehavior={"inside"}>
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">{"报名" + tournament_info.abbreviation}</ModalHeader>
                                <ModalBody>
                                    <p>
                                        请务必填写正确的QQ号，以便我们联系您
                                    </p>
                                    <Input isRequired type={"QQ"} label={"QQ号"} placeholder="请输入QQ号" onChange={(e) => setFormData({...formData, qqNumber: e.target.value})}/>
                                    <Divider/>
                                    <RadioGroup label={"你是否是第一次做staff？"} isRequired={true} onChange={(e) => setFormData({...formData, isFirstTimeStaff: (e.target.value !== "")})}>
                                        <Radio value="1">是</Radio>
                                        <Radio value="">否</Radio>
                                    </RadioGroup>
                                    <p>
                                        列举赛事经验（不必详细说明）只需简述在什么比赛做了什么工作即可
                                    </p>
                                    <Textarea
                                        minRows={2}
                                        label="赛事经验"
                                        onChange={(e) => setFormData({...formData, tournamentExperience: e.target.value})}
                                    />
                                    <Divider/>
                                    <CheckboxGroup
                                        isRequired={true}
                                        label="选择想要报名的职位"
                                        //@ts-ignore
                                        onChange={(value: string[]) => setFormData({...formData, selectedPositions: value})}
                                    >
                                        {tournament_info.streamer? <Checkbox value="直播">直播</Checkbox>: null}
                                        {tournament_info.referee? <Checkbox value="裁判">裁判</Checkbox>: null}
                                        {tournament_info.custom_mapper? <Checkbox value="作图">作图</Checkbox>: null}
                                        {tournament_info.commentator? <Checkbox value="直播解说">直播解说</Checkbox>: null}
                                        {tournament_info.mappooler? <Checkbox value="选图">选图</Checkbox>: null}
                                        {tournament_info.donator? <Checkbox value="赞助">赞助</Checkbox>: null}
                                        {tournament_info.designer? <Checkbox value="设计">设计</Checkbox>: null}
                                        {tournament_info.sheduler? <Checkbox value="赛程安排">赛程安排</Checkbox>: null}
                                        {tournament_info.map_tester? <Checkbox value="测图">测图</Checkbox>: null}
                                    </CheckboxGroup>
                                    <Textarea
                                        minRows={2}
                                        label="其他"
                                        onChange={(e) => setFormData({...formData, otherDetails: e.target.value})}
                                    />
                                    <Divider/>
                                    <Textarea
                                        minRows={2}
                                        label="有其他想要补充的？"
                                        onChange={(e) => setFormData({...formData, additionalComments: e.target.value})}
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
            </Card>
            <Card>
                <CardBody>
                    <p>赛程</p>
                </CardBody>
                <Divider/>
                <CardBody>
                    <p>{tournament_info.tournament_schedule_info}</p>
                </CardBody>
            </Card>
            <Card>
                <CardBody>
                    <p>奖金</p>
                </CardBody>
                <Divider/>
                <CardBody>

                </CardBody>
            </Card>
            <Card>
                <CardBody>
                    <p>报名</p>
                </CardBody>
                <Divider/>
                <CardBody>

                </CardBody>
            </Card>
        </div>
    );
}


export interface TournamentInfo {
    name: string;
    abbreviation: string;
    start_date: Date
    end_date: Date
    pic_url: string;
    links: Link[];
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
    sheduler: boolean;
    map_tester: boolean;
    mode: string;
}

type Link = {
    name: string;
    url: string;
}


type RegistrationInfo = {
    tournament: string;
    uid?: number;
    qqNumber: string;
    isFirstTimeStaff: boolean;
    tournamentExperience: string;
    selectedPositions: string[];
    otherDetails: string;
    additionalComments: string;
}
