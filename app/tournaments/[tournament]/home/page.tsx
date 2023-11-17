"use client"
import { Card, CardBody} from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@nextui-org/modal";
import {useDisclosure} from "@nextui-org/use-disclosure";
import {Button} from "@nextui-org/button";
import {Input, Textarea} from "@nextui-org/input";
import {CheckboxGroup, Checkbox} from "@nextui-org/checkbox";
import {RadioGroup, Radio} from "@nextui-org/radio";


export default function TournamentHomePage({ params }: { params: { tournament: string }}) {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    return (
        <div className="grid grid-cols-1 gap-y-5">
        <Card>
            <CardBody>
                <p>Staff报名</p>
            </CardBody>
            <Divider/>
            <CardBody>
                <p>报名报名报名报名报名报名报名报名报名报名报名报名报名报名报名报名报名报名报名报名报名报名</p>
            </CardBody>
            <div className="flex gap-4 items-center py-2 px-2">
            <Button onPress={onOpen} size="md" radius="full">立刻报名</Button>
            </div>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size={"5xl"} scrollBehavior={"inside"}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">{"报名" + params.tournament}</ModalHeader>
                            <ModalBody>
                                <p>
                                    请务必填写正确的QQ号，以便我们联系您
                                </p>
                                <Input isRequired type={"QQ"} label={"QQ号"} placeholder="请输入QQ号"/>
                                <Divider/>
                                <RadioGroup label={"你是否是第一次做staff？"} isRequired={true}>
                                    <Radio value="是">是</Radio>
                                    <Radio value="否">否</Radio>
                                </RadioGroup>
                                <p>
                                    列举赛事经验（不必详细说明）只需简述在什么比赛做了什么工作即可
                                </p>
                                <Textarea
                                    isRequired={true}
                                    minRows={2}
                                    label="赛事经验"
                                />
                                <Divider/>
                                <CheckboxGroup
                                    isRequired={true}
                                    label="选择想要报名的职位"
                                >
                                    <Checkbox value="直播">直播</Checkbox>
                                    <Checkbox value="裁判">裁判</Checkbox>
                                    <Checkbox value="作图">作图</Checkbox>
                                    <Checkbox value="直播解说">直播解说</Checkbox>
                                    <Checkbox value="选图">选图</Checkbox>
                                    <Checkbox value="赞助">赞助</Checkbox>
                                </CheckboxGroup>
                                <Textarea
                                    minRows={2}
                                    label="其他"
                                />
                                <Divider/>
                                <Textarea
                                    minRows={2}
                                    label="有其他想要补充的？"
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    关闭
                                </Button>
                                <Button color="primary" onPress={onClose}>
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
                <p>赛程赛程赛程赛程赛程赛程赛程赛程赛程赛程赛程赛程赛程赛程赛程赛程赛程</p>
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
