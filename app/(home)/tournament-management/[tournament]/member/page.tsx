"use client";

import {Divider} from "@nextui-org/divider";
import React, {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {Chip} from "@nextui-org/chip";
import {Avatar} from "@nextui-org/avatar";
import {Autocomplete, AutocompleteItem} from "@nextui-org/autocomplete";
import {Button} from "@nextui-org/button";
import {useFilter} from "@react-aria/i18n";
import {Spinner} from "@nextui-org/spinner";
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@nextui-org/modal";
import {RegistrationInfo} from "@/components/homepage";
import {getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@nextui-org/table";
import {siteConfig} from "@/config/site";

const columns = [
    {name: "uid", key: "uid"},
    {name: "qq号", key: "qqNumber"},
    {name: "是否第一次当staff", key: "isFirstTimeStaff"},
    {name: "赛事经验", key: "tournamentExperience"},
    {name: "选择的职位", key: "selectedPositions"},
    {name: "其他职位", key: "otherDetails"},
    {name: "其他想说的", key: "additionalComments"},
];

export default function EditMemberPage({params}: { params: { tournament: string } }) {
    const currentUser = useContext(CurrentUserContext);
    const [members, setMembers] = useState<TournamentMember[]>([]);
    const [registrationInfo, setRegistrationInfo] = useState<RegistrationInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const {isOpen, onOpen, onOpenChange} = useDisclosure();

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                const data = await getTournamentMembers(params.tournament);
                const registrationInfo = await getRegistrationInfo(params.tournament);
                setMembers(data);
                setRegistrationInfo(registrationInfo);
            }
        };
        fetchData();
    }, [currentUser]);
    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-row justify-between">
                <h1 className="text-3xl font-bold">成员管理</h1>
                <Button color="success" className="" onPress={onOpen}>查看staff申请</Button>
                <Modal size="5xl" isOpen={isOpen} onOpenChange={onOpenChange}>
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">目前的staff申请</ModalHeader>
                                <ModalBody>
                                    <Table>
                                        <TableHeader columns={columns}>
                                            {
                                                (column) => (
                                                    <TableColumn key={column.key}>
                                                        {column.name}
                                                    </TableColumn>
                                                )
                                            }
                                        </TableHeader>
                                        <TableBody
                                            items={registrationInfo}
                                        >
                                            {(item) => (
                                                <TableRow key={item.uid}>
                                                    {(columnKey) => {
                                                        if (columnKey === 'acc_max' || columnKey === 'acc_min' || columnKey === 'acc_avg') {
                                                            return <TableCell>{getKeyValue(item, columnKey) ? (getKeyValue(item, columnKey) * 100).toFixed(2) + "%" : null}</TableCell>
                                                        }
                                                        return (<TableCell>{getKeyValue(item, columnKey)}</TableCell>)
                                                    }}
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="danger" variant="light" onPress={onClose}>
                                        关闭
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>

            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">主办</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        members.map((member, index) => {
                            if (!member.host) {
                                return null;
                            }
                            return(
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        if (member.uid === currentUser?.currentUser?.uid.toString()) {
                                            alert('不能删除自己');
                                            return;
                                        }
                                        const updatedMembers = [...members];
                                        updatedMembers[index].host = false;
                                        setMembers(updatedMembers);
                                    }}
                                    avatar={
                                        <Avatar
                                            size="lg"
                                            name={member.name}
                                            src={`https://a.ppy.sh/${member.uid}`}
                                        />
                                    }
                                >
                                    {member.name}
                                </Chip>
                            )
                        })
                    }
                </div>
                <AddMember members={members} setMembers={setMembers} tournamentName={params.tournament} position={"host"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">选手</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        members.map((member, index) => {
                            if (!member.player) {
                                return null;
                            }
                            return(
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...members];
                                        updatedMembers[index].player = false;
                                        setMembers(updatedMembers);
                                    }}
                                    avatar={
                                        <Avatar
                                            size="lg"
                                            name={member.name}
                                            src={`https://a.ppy.sh/${member.uid}`}
                                        />
                                    }
                                >
                                    {member.name}
                                </Chip>
                            )
                        })
                    }
                </div>
                <AddMember members={members} setMembers={setMembers} tournamentName={params.tournament} position={"player"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">裁判</h1>
            <div className="grid grid-cols-2 justify-evenly">
                <div className="flex flex-wrap gap-5">
                    {
                        members.map((member, index) => {
                            if (!member.referee) {
                                return null;
                            }
                            return(
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...members];
                                        updatedMembers[index].referee = false;
                                        setMembers(updatedMembers);
                                    }}
                                    avatar={
                                        <Avatar
                                            size="lg"
                                            name={member.name}
                                            src={`https://a.ppy.sh/${member.uid}`}
                                        />
                                    }
                                >
                                    {member.name}
                                </Chip>
                            )
                        })
                    }
                </div>
                <AddMember members={members} setMembers={setMembers} tournamentName={params.tournament} position={"referee"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">直播</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        members.map((member, index) => {
                            if (!member.streamer) {
                                return null;
                            }
                            return(
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                    const updatedMembers = [...members];
                                    updatedMembers[index].streamer = false;
                                    setMembers(updatedMembers);
                                }}
                                    avatar={
                                        <Avatar
                                            size="lg"
                                            name={member.name}
                                            src={`https://a.ppy.sh/${member.uid}`}
                                        />
                                    }
                                >
                                    {member.name}
                                </Chip>
                            )
                        })
                    }
                </div>
                <AddMember members={members} setMembers={setMembers} tournamentName={params.tournament} position={"streamer"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">解说</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        members.map((member, index) => {
                            if (!member.commentator) {
                                return null;
                            }
                            return(
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...members];
                                        updatedMembers[index].commentator = false;
                                        setMembers(updatedMembers);
                                    }}
                                    avatar={
                                        <Avatar
                                            size="lg"
                                            name={member.name}
                                            src={`https://a.ppy.sh/${member.uid}`}
                                        />
                                    }
                                >
                                    {member.name}
                                </Chip>
                            )
                        })
                    }
                </div>
                <AddMember members={members} setMembers={setMembers} tournamentName={params.tournament} position={"commentator"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">选图</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        members.map((member, index) => {
                            if (!member.mappooler) {
                                return null;
                            }
                            return(
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...members];
                                        updatedMembers[index].mappooler = false;
                                        setMembers(updatedMembers);
                                    }}
                                    avatar={
                                        <Avatar
                                            size="lg"
                                            name={member.name}
                                            src={`https://a.ppy.sh/${member.uid}`}
                                        />
                                    }
                                >
                                    {member.name}
                                </Chip>
                            )
                        })
                    }
                </div>
                <AddMember members={members} setMembers={setMembers} tournamentName={params.tournament} position={"mappooler"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">赞助</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        members.map((member, index) => {
                            if (!member.donator) {
                                return null;
                            }
                            return(
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...members];
                                        updatedMembers[index].donator = false;
                                        setMembers(updatedMembers);
                                    }}
                                    avatar={
                                        <Avatar
                                            size="lg"
                                            name={member.name}
                                            src={`https://a.ppy.sh/${member.uid}`}
                                        />
                                    }
                                >
                                    {member.name}
                                </Chip>
                            )
                        })
                    }
                </div>
                <AddMember members={members} setMembers={setMembers} tournamentName={params.tournament} position={"donator"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">设计</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        members.map((member, index) => {
                            if (!member.graphic_designer) {
                                return null;
                            }
                            return(
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...members];
                                        updatedMembers[index].graphic_designer = false;
                                        setMembers(updatedMembers);
                                    }}
                                    avatar={
                                        <Avatar
                                            size="lg"
                                            name={member.name}
                                            src={`https://a.ppy.sh/${member.uid}`}
                                        />
                                    }
                                >
                                    {member.name}
                                </Chip>
                            )
                        })
                    }
                </div>
                <AddMember members={members} setMembers={setMembers} tournamentName={params.tournament} position={"graphic_designer"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">时间安排</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        members.map((member, index) => {
                            if (!member.scheduler) {
                                return null;
                            }
                            return(
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...members];
                                        updatedMembers[index].scheduler = false;
                                        setMembers(updatedMembers);
                                    }}
                                    avatar={
                                        <Avatar
                                            size="lg"
                                            name={member.name}
                                            src={`https://a.ppy.sh/${member.uid}`}
                                        />
                                    }
                                >
                                    {member.name}
                                </Chip>
                            )
                        })
                    }
                </div>
                <AddMember members={members} setMembers={setMembers} tournamentName={params.tournament} position={"scheduler"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">测图</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        members.map((member, index) => {
                            if (!member.map_tester) {
                                return null;
                            }
                            return(
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...members];
                                        updatedMembers[index].map_tester = false;
                                        setMembers(updatedMembers);
                                    }}
                                    avatar={
                                        <Avatar
                                            size="lg"
                                            name={member.name}
                                            src={`https://a.ppy.sh/${member.uid}`}
                                        />
                                    }
                                >
                                    {member.name}
                                </Chip>
                            )
                        })
                    }
                </div>
                <AddMember members={members} setMembers={setMembers} tournamentName={params.tournament} position={"map_tester"}/>
            </div>
            {
                isLoading ?  <Spinner className="max-w-fit" /> :
                    <Button className="max-w-fit" color="primary" onPress={async () => {
                        setIsLoading(true)
                        const res = await fetch(siteConfig.backend_url + '/api/update-members', {'method': 'POST', 'body': JSON.stringify(members), 'headers': {'Content-Type': 'application/json'}, credentials: 'include'})
                        setIsLoading(false)
                        if (res.status != 200) {
                            // 失败
                            alert(await res.text());
                        }
                        else {
                            // 关闭模态框
                            alert('修改成功');
                        }
                    }}>
                        更新成员
                    </Button>
            }
        </div>
    )
}


const AddMember = ({
                       members,
                       setMembers,
                       tournamentName,
                       position,
                   }: {
    members: TournamentMember[];
    setMembers: React.Dispatch<React.SetStateAction<TournamentMember[]>>;
    tournamentName: string;
    position: keyof TournamentMember;
}) => {
    const [fieldState, setFieldState] = React.useState<{selectedKey: string | null, inputValue: string, items: TournamentMember[]}>({
        selectedKey: "",
        inputValue: "",
        items: members,
    });
    let { contains } = useFilter({
        sensitivity: 'base'
    });
    const onInputChange = (value: string) => {
        setFieldState((prevState) => ({
            inputValue: value,
            selectedKey: value === "" ? null : prevState.selectedKey,
            items: members.filter((item) => contains(item.uid + item.name, value)),
        }));
    };
    const onSelectionChange = (key: string) => {
        setFieldState((prevState) => {
            let selectedItem = prevState.items.find((option) => option.uid === key);
            return {
                inputValue: key === null ? "" : selectedItem?.uid || fieldState.inputValue,
                selectedKey: key? key : "",
                items: members.filter((item) => contains(item.uid + item.name, selectedItem?.uid || "")),
            };
        });
    };
    const onOpenChange = () => {
        setFieldState((prevState) => ({
            inputValue: fieldState.inputValue,
            selectedKey: prevState.selectedKey,
            items: members,
        }));
    };
    const handleAddMember = async () => {
        for (const member of members) {
            if (member.uid === fieldState.inputValue) {
                if (member[position]) {
                    alert(`该用户已经是${position}`);
                    return;
                }
                const updatedMembers = [...members];
                // @ts-ignore
                updatedMembers[updatedMembers.indexOf(member)][position] = true;
                setMembers(updatedMembers);
                return;
            }
        }
        if (!fieldState.inputValue || fieldState.inputValue === "") {
            alert('请输入uid');
            return;
        }
        const res = await fetch(siteConfig.backend_url + '/api/user?uid=' + fieldState.inputValue);
        if (res.status !== 200) {
            alert('用户不存在');
            return;
        }
        const data: User = await res.json();
        const updatedMembers = [...members,
            {
                uid: fieldState.inputValue,
                name: data.username,
                tournament_name: tournamentName,
                player: position === "player",
                host: position === "host",
                referee: position === "referee",
                streamer: position === "streamer",
                commentator: position === "commentator",
                mappooler: position === "mappooler",
                custom_mapper: position === "custom_mapper",
                donator: position === "donator",
                graphic_designer: position === "graphic_designer",
                scheduler: position === "scheduler",
                map_tester: position === "map_tester",
            }];
        setMembers(updatedMembers);
    };
    return (
        <div className="flex flex-row justify-end items-baseline gap-5">
            <Autocomplete
                label="新增用户"
                allowsCustomValue
                className="max-w-xs"
                description="输入用户的uid来添加新用户 (不能输入用户名)"
                inputValue={fieldState.inputValue}
                items={fieldState.items}
                selectedKey={fieldState.selectedKey}
                // @ts-ignore
                onKeyDown={(e) => e.continuePropagation()}
                onInputChange={onInputChange}
                onOpenChange={onOpenChange}
                // @ts-ignore
                onSelectionChange={onSelectionChange}
            >
                {(member) => (
                    <AutocompleteItem key={member.uid} textValue={member.uid}>
                        <div className="flex gap-2 items-center">
                            <Avatar alt={member.name} className="flex-shrink-0" size="sm" src={`https://a.ppy.sh/${member.uid}`} />
                            <div className="flex flex-col">
                                <span className="text-small">{member.name}</span>
                                <span className="text-tiny text-default-400">{member.uid}</span>
                            </div>
                        </div>
                    </AutocompleteItem>
                )}
            </Autocomplete>
            <Button color="primary" onPress={handleAddMember}>
                添加
            </Button>
        </div>
    )
}


async function getRegistrationInfo(tournament_name: string): Promise<RegistrationInfo[]> {
    const res = await fetch(siteConfig.backend_url + `/api/get-registration-info?tournament_name=${tournament_name}`,
        { next: { revalidate: 10 }});
    return await res.json();
}

async function getTournamentMembers(tournament_name: string): Promise<TournamentMember[]> {
    const res = await fetch(siteConfig.backend_url + `/api/members?tournament_name=${tournament_name}`,
        { next: { revalidate: 10 }});
    return await res.json();
}

export interface TournamentMember {
    uid: string;
    name: string;
    tournament_name: string;
    player: boolean;
    host: boolean;
    referee: boolean;
    streamer: boolean;
    commentator: boolean;
    mappooler: boolean;
    custom_mapper: boolean;
    donator: boolean;
    graphic_designer: boolean;
    scheduler: boolean;
    map_tester: boolean;
}

interface User {
    id: string;
    username: string;
}
