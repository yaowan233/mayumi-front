"use client";

import {Divider} from "@heroui/divider";
import React, {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {Chip} from "@heroui/chip";
import {Avatar} from "@heroui/avatar";
import {Autocomplete, AutocompleteItem} from "@heroui/autocomplete";
import {Button} from "@heroui/button";
import {useFilter} from "@react-aria/i18n";
import {Spinner} from "@heroui/spinner";
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@heroui/modal";
import {RegistrationInfo} from "@/components/homepage";
import {getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@heroui/table";
import {siteConfig} from "@/config/site";
import {Player, Team, TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {InfoSection} from "@/components/hints";
import {Badge} from "@heroui/badge";
import {getPlayers, getRegistrationInfo} from "@/lib/api";

const columns = [
    {name: "uid", key: "uid"},
    {name: "qq号", key: "qqNumber"},
    {name: "是否第一次当staff", key: "isFirstTimeStaff"},
    {name: "赛事经验", key: "tournamentExperience"},
    {name: "选择的职位", key: "selectedPositions"},
    {name: "其他职位", key: "otherDetails"},
    {name: "其他想说的", key: "additionalComments"},
];

export default function EditMemberPage(props: { params: Promise<{ tournament: string }> }) {
    const params = React.use(props.params);
    const currentUser = useContext(CurrentUserContext);
    const [tournamentPlayers, settournamentPlayers] = useState<TournamentPlayers>({players: []});
    const [registrationInfo, setRegistrationInfo] = useState<RegistrationInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const players = tournamentPlayers.players;
    const teams = tournamentPlayers.groups;
    const tournament_name = decodeURIComponent(params.tournament);

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                const data = await getPlayers(tournament_name);
                const registrationInfo = await getRegistrationInfo(tournament_name);
                settournamentPlayers(data);
                setRegistrationInfo(registrationInfo);
            }
        };
        fetchData();
    }, [currentUser, tournament_name]);
    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-row justify-between">
                <h1 className="text-3xl font-bold">成员管理</h1>
                <Badge content={registrationInfo.length} color="primary">
                    <Button color="success" className="" onPress={onOpen}>
                        查看staff申请
                    </Button>
                </Badge>
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
                                                        if (columnKey === 'selectedPositions') {
                                                            return <TableCell>{getKeyValue(item, columnKey).join("，")}</TableCell>
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
            <InfoSection>
                <h1 className='text-black'>
                    在新增用户处输入用户的uid来添加新用户
                </h1>
                <h1 className='text-black font-bold'>
                    (不能输入用户名)
                </h1>
            </InfoSection>
            <Divider/>
            <h1 className="text-3xl font-bold">主办</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        players?.map((member, index) => {
                            if (!member.host) {
                                return null;
                            }
                            return (
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        if (member.uid === currentUser?.currentUser?.uid) {
                                            alert('不能删除自己');
                                            return;
                                        }
                                        const updatedMembers = [...players];
                                        updatedMembers[index].host = false;
                                        settournamentPlayers({players: updatedMembers, groups: teams});
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
                <AddMember members={players} setMembers={settournamentPlayers} tournamentName={tournament_name}
                           position={"host"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">选手</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        players && players.map((member, index) => {
                            if (!member.player) {
                                return null;
                            }
                            return (
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...players];
                                        updatedMembers[index].player = false;
                                        settournamentPlayers({players: updatedMembers, groups: teams});
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
                <AddMember members={players} setMembers={settournamentPlayers} tournamentName={tournament_name}
                           position={"player"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">裁判</h1>
            <div className="grid grid-cols-2 justify-evenly">
                <div className="flex flex-wrap gap-5">
                    {
                        players && players.map((member, index) => {
                            if (!member.referee) {
                                return null;
                            }
                            return (
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...players];
                                        updatedMembers[index].referee = false;
                                        settournamentPlayers({players: updatedMembers, groups: teams});
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
                <AddMember members={players} setMembers={settournamentPlayers} tournamentName={tournament_name}
                           position={"referee"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">直播</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        players && players.map((member, index) => {
                            if (!member.streamer) {
                                return null;
                            }
                            return (
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...players];
                                        updatedMembers[index].streamer = false;
                                        settournamentPlayers({players: updatedMembers, groups: teams});
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
                <AddMember members={players} setMembers={settournamentPlayers} tournamentName={tournament_name}
                           position={"streamer"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">解说</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        players && players.map((member, index) => {
                            if (!member.commentator) {
                                return null;
                            }
                            return (
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...players];
                                        updatedMembers[index].commentator = false;
                                        settournamentPlayers({players: updatedMembers, groups: teams});
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
                <AddMember members={players} setMembers={settournamentPlayers} tournamentName={tournament_name}
                           position={"commentator"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">选图</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        players && players.map((member, index) => {
                            if (!member.mappooler) {
                                return null;
                            }
                            return (
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...players];
                                        updatedMembers[index].mappooler = false;
                                        settournamentPlayers({players: updatedMembers, groups: teams});
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
                <AddMember members={players} setMembers={settournamentPlayers} tournamentName={tournament_name}
                           position={"mappooler"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">赞助</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        players && players.map((member, index) => {
                            if (!member.donator) {
                                return null;
                            }
                            return (
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...players];
                                        updatedMembers[index].donator = false;
                                        settournamentPlayers({players: updatedMembers, groups: teams});
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
                <AddMember members={players} setMembers={settournamentPlayers} tournamentName={tournament_name}
                           position={"donator"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">设计</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        players && players.map((member, index) => {
                            if (!member.graphic_designer) {
                                return null;
                            }
                            return (
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...players];
                                        updatedMembers[index].graphic_designer = false;
                                        settournamentPlayers({players: updatedMembers, groups: teams});
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
                <AddMember members={players} setMembers={settournamentPlayers} tournamentName={tournament_name}
                           position={"graphic_designer"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">时间安排</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        players && players.map((member, index) => {
                            if (!member.scheduler) {
                                return null;
                            }
                            return (
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...players];
                                        updatedMembers[index].scheduler = false;
                                        settournamentPlayers({players: updatedMembers, groups: teams});
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
                <AddMember members={players} setMembers={settournamentPlayers} tournamentName={tournament_name}
                           teams={teams} position={"scheduler"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">测图</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        players && players.map((member, index) => {
                            if (!member.map_tester) {
                                return null;
                            }
                            return (
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...players];
                                        updatedMembers[index].map_tester = false;
                                        settournamentPlayers({players: updatedMembers, groups: teams});
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
                <AddMember members={players} setMembers={settournamentPlayers} tournamentName={tournament_name}
                           position={"map_tester"}/>
            </div>
            <Divider/>
            <h1 className="text-3xl font-bold">作图</h1>
            <div className="grid grid-cols-2">
                <div className="flex flex-wrap gap-5">
                    {
                        players && players.map((member, index) => {
                            if (!member.custom_mapper) {
                                return null;
                            }
                            return (
                                <Chip
                                    key={index}
                                    variant="bordered"
                                    size="lg"
                                    onClose={() => {
                                        const updatedMembers = [...players];
                                        updatedMembers[index].custom_mapper = false;
                                        settournamentPlayers({players: updatedMembers, groups: teams});
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
                <AddMember members={players} setMembers={settournamentPlayers} tournamentName={tournament_name}
                           position={"custom_mapper"}/>
            </div>
            {
                isLoading ? <Spinner className="max-w-fit"/> :
                    <Button className="max-w-fit" color="primary" onPress={async () => {
                        setIsLoading(true)
                        const res = await fetch(siteConfig.backend_url + '/api/update-members', {
                            'method': 'POST',
                            'body': JSON.stringify(players),
                            'headers': {'Content-Type': 'application/json'},
                            credentials: 'include'
                        })
                        setIsLoading(false)
                        if (res.status != 200) {
                            // 失败
                            alert(await res.text());
                        } else {
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
                       teams,
                       setMembers,
                       tournamentName,
                       position,
                   }: {
    members: Player[];
    teams?: Team[];
    setMembers: React.Dispatch<React.SetStateAction<TournamentPlayers>>;
    tournamentName: string;
    position: keyof Player;
}) => {
    const [fieldState, setFieldState] = React.useState<{ selectedKey: string, inputValue: string, items: Player[] }>({
        selectedKey: "",
        inputValue: "",
        items: members,
    });
    let {contains} = useFilter({
        sensitivity: 'base'
    });
    const onInputChange = (value: string) => {
        setFieldState((prevState) => ({
            inputValue: value,
            selectedKey: value === "" ? "" : prevState.selectedKey,
            items: members.filter((item) => contains(item.uid.toString() + item.name, value)),
        }));
    };
    const onSelectionChange = (key: string) => {
        setFieldState((prevState) => {
            let selectedItem = prevState.items.find((option) => option.uid.toString() == key)
            return {
                inputValue: key === null ? "" : selectedItem?.uid.toString() || fieldState.inputValue,
                selectedKey: key ? key : "",
                items: members.filter((item) => contains(item.uid.toString() + item.name, selectedItem?.uid.toString() || "")),
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
            if (member.uid.toString() == fieldState.inputValue) {
                if (member[position]) {
                    alert(`该用户已经是${position}`);
                    return;
                }
                const updatedMembers = [...members];
                // @ts-ignore
                updatedMembers[updatedMembers.indexOf(member)][position] = true;
                setMembers({players: updatedMembers, groups: teams});
                return;
            }
        }
        if (!fieldState.inputValue || fieldState.inputValue == "") {
            alert('请输入uid');
            return;
        }
        const res = await fetch(siteConfig.backend_url + '/api/user?uid=' + fieldState.inputValue + '&tournament_name=' + tournamentName);
        if (res.status !== 200) {
            alert('用户不存在');
            return;
        }
        const data: User = await res.json();
        const updatedMembers = [...members,
            {
                uid: parseInt(fieldState.inputValue),
                name: data.username,
                tournament_name: tournamentName,
                pp: data.statistics.pp,
                rank: data.statistics.global_rank,
                country: data.country_code,
                group: undefined,
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
        setMembers({players: updatedMembers, groups: teams});
    };
    return (
        <div className="flex flex-row justify-end items-baseline gap-5">
            <Autocomplete
                label="新增用户"
                allowsCustomValue
                className="max-w-xs"
                inputValue={fieldState.inputValue}
                items={fieldState.items || []}
                selectedKey={fieldState.selectedKey}
                // @ts-ignore
                onKeyDown={(e) => e.continuePropagation()}
                onInputChange={onInputChange}
                onOpenChange={onOpenChange}
                // @ts-ignore
                onSelectionChange={onSelectionChange}
            >
                {(member) => (
                    <AutocompleteItem key={member.uid} textValue={member.uid.toString()}>
                        <div className="flex gap-2 items-center">
                            <Avatar alt={member.name} className="flex-shrink-0" size="sm"
                                    src={`https://a.ppy.sh/${member.uid}`}/>
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


interface User {
    id: string;
    username: string;
    country_code: string;
    statistics: {
        pp: number;
        global_rank: number;
    }
}
