"use client"

import React, {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {TournamentPlayers} from "@/app/tournaments/[tournament]/participants/page";
import {Button} from "@heroui/button";
import {Input} from "@heroui/input";
import {Divider} from "@heroui/divider";
import {Avatar} from "@heroui/avatar";
import {Chip} from "@heroui/chip";
import {Autocomplete, AutocompleteItem} from "@heroui/autocomplete";
import {AttentionSection, InfoSection} from "@/components/hints";
import {siteConfig} from "@/config/site";
import {Checkbox} from "@heroui/checkbox";
import {getPlayers} from "@/lib/api";

export default function EditTeamPage(props: { params: Promise<{ tournament: string }> }) {
    const params = React.use(props.params);
    const tournament_name = decodeURIComponent(params.tournament);
    const currentUser = useContext(CurrentUserContext);
    const [tournamentPlayers, setTournamentPlayers] = useState<TournamentPlayers>({players: []});
    const players = tournamentPlayers.players.filter(player => player.player == true);
    const teams = tournamentPlayers.groups;
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                const data = await getPlayers(tournament_name);
                setTournamentPlayers(data);
            }
        };
        fetchData();
    }, [currentUser, tournament_name]);
    return (
        <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold">队伍管理</h1>
            <InfoSection>
                <p className="text-black">点击成员来切换队员与队长</p>
            </InfoSection>
            <InfoSection>
                <p className="text-black">如果想新增可添加的成员，请前往成员管理增加选手</p>
            </InfoSection>
            <AttentionSection>
                <p className="text-black">请确保队伍名称及队伍图标符合规范后，点击通过审核后，队伍才会被展示在赛事界面</p>
            </AttentionSection>
            {
                teams?.map((team, num) => (
                    <div key={num} className="flex flex-col gap-3">
                        <Checkbox isSelected={team.is_verified} onValueChange={(isSelected) => {
                            teams[num].is_verified = isSelected;
                            setTournamentPlayers({players: players, groups: teams});
                        }}>
                            通过审核
                        </Checkbox>
                        <div className="grid grid-cols-2 gap-3">
                            <div key={num} className="flex flex-col gap-3">
                                <Input isRequired label="队伍名称" value={team.name} onChange={(e) => {
                                    teams[num].name = e.target.value;
                                    setTournamentPlayers({players: players, groups: teams});
                                }}/>
                                <div className='flex flex-row gap-3'>
                                    {team.icon_url ?
                                        <>
                                            <Avatar onClick={() => {
                                                const newTab = window.open(team.icon_url, '_blank');
                                                newTab?.focus();
                                            }
                                            }
                                                    size="lg" src={team.icon_url}
                                                    style={{cursor: 'pointer'}}
                                                    className='min-w-fit'/>
                                        </>
                                        : null
                                    }
                                    <Input label="队伍头像链接" value={team.icon_url} onChange={(e) => {
                                        teams[num].icon_url = e.target.value;
                                        setTournamentPlayers({players: players, groups: teams});
                                    }}/>
                                </div>
                                <Autocomplete label="增加成员" defaultItems={players} onSelectionChange={(key) => {
                                    if (key === null) return;
                                    for (const player of team.captains) {
                                        if (player == key) {
                                            alert('已填加过该成员');
                                            return
                                        }
                                    }
                                    for (const player of team.members) {
                                        if (player == key) {
                                            alert('已填加过该成员');
                                            return;
                                        }
                                    }
                                    // @ts-ignore
                                    teams[num].members.push(key);
                                    setTournamentPlayers({players: players, groups: teams});
                                }}>
                                    {
                                        (player) =>
                                            <AutocompleteItem key={player.uid} textValue={player.name}>
                                                <div className="flex gap-2 items-center">
                                                    <Avatar alt={player.name} className="flex-shrink-0" size="sm"
                                                            src={`https://a.ppy.sh/${player.uid}`}/>
                                                    <div className="flex flex-col">
                                                        <span className="text-small">{player.name}</span>
                                                        <span className="text-tiny text-default-400">{player.uid}</span>
                                                    </div>
                                                </div>
                                            </AutocompleteItem>
                                    }
                                </Autocomplete>

                                <Button color="danger" className="max-w-fit" onPress={() => {
                                    teams?.splice(num, 1);
                                    setTournamentPlayers({players: players, groups: teams});
                                }}>
                                    删除队伍
                                </Button>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div>
                                    队长
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {team.captains.map((user, num1) => {
                                        return (
                                            <Chip
                                                key={num1}
                                                variant="bordered"
                                                size="lg"
                                                as={Button}
                                                onClick={() => {
                                                    teams[num].members.push(user);
                                                    teams[num].captains.splice(num1, 1);
                                                    setTournamentPlayers({players: players, groups: teams});
                                                }}
                                                onClose={() => {
                                                    teams[num].captains.splice(num1, 1);
                                                    setTournamentPlayers({players: players, groups: teams});
                                                }}
                                                avatar={
                                                    <Avatar
                                                        size="lg"
                                                        name={players?.find(player => player.uid == user)?.name}
                                                        src={`https://a.ppy.sh/${user}`}
                                                    />
                                                }
                                            >
                                                {players?.find(player => player.uid == user)?.name}
                                            </Chip>
                                        )
                                    })}
                                </div>
                                <div>
                                    队员
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {team.members.map((user, num1) => {
                                        return (
                                            <Chip
                                                key={num1}
                                                variant="bordered"
                                                size="lg"
                                                as={Button}
                                                onClick={() => {
                                                    teams[num].captains.push(user);
                                                    teams[num].members.splice(num1, 1);
                                                    setTournamentPlayers({players: players, groups: teams});
                                                }}
                                                onClose={() => {
                                                    teams[num].members.splice(num1, 1);
                                                    setTournamentPlayers({players: players, groups: teams});
                                                }}
                                                avatar={
                                                    <Avatar
                                                        size="lg"
                                                        name={players?.find(player => player.uid == user)?.name}
                                                        src={`https://a.ppy.sh/${user}`}
                                                    />
                                                }
                                            >
                                                {players?.find(player => player.uid == user)?.name}
                                            </Chip>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                        <Divider/>
                    </div>
                ))
            }
            <Button className="max-w-fit" color="success" onPress={() => {
                teams?.push({
                    tournament_name: tournament_name,
                    name: '',
                    icon_url: '',
                    captains: [],
                    members: [],
                    is_verified: false
                });
                setTournamentPlayers({players: players, groups: teams});
            }}>
                添加队伍
            </Button>
            <Button className="max-w-fit" color="primary" onPress={async () => {
                const res = await fetch(siteConfig.backend_url + '/api/update-teams', {
                    method: 'POST',
                    body: JSON.stringify(teams),
                    headers: {'Content-Type': 'application/json'},
                    credentials: 'include'
                });
                if (res.status != 200) {
                    alert(await res.text());
                } else {
                    alert('更新成功');
                }
            }}>
                更新队伍
            </Button>
        </div>
    )
}
