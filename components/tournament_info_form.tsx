import {Input, Textarea} from "@heroui/input";
import {Select, SelectItem} from "@heroui/select";
import {Divider} from "@heroui/divider";
import {Switch} from "@heroui/switch";
import {TournamentInfo} from "@/components/homepage";
import {Dispatch, SetStateAction} from "react";
import {Button} from "@heroui/button";


export const TournamentInfoForm = ({formData, errMsg, setFormData}: {formData: TournamentInfo, errMsg: string, setFormData:  Dispatch<SetStateAction<TournamentInfo>>}) => {
    return (
        <section className={"grid grid-cols-1 gap-y-5"}>
            <h1 className={"text-3xl font-bold"}>
                基本信息
            </h1>
            <div className="flex flex-row gap-5">
                <Input isRequired label="比赛名称" value={formData.name} description="比赛的完整全称" isInvalid={!!errMsg && !formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}/>
                <Input isRequired label="简称" value={formData.abbreviation} description="比赛简称，英文，必须与其他比赛的简称唯一，这将作为比赛的网页地址，请勿包含特殊字符（如@、，），应以简单为主" isInvalid={!!errMsg && !formData.abbreviation} onChange={(e) => setFormData({...formData, abbreviation: e.target.value})}/>
                <Input label="比赛头图地址" value={formData.pic_url} description="比赛头图图床地址，用于展示" onChange={(e) => setFormData({...formData, pic_url: e.target.value})}/>
            </div>
            <div className="flex flex-row gap-5">
                <Input type="date" label="开始时间" value={formData.start_date} isRequired placeholder="Enter your email" isInvalid={!!errMsg && !formData.start_date}  onChange={(e) => setFormData({...formData, start_date: e.target.value})}/>
                <Input type="date" label="结束时间" value={formData.end_date} isRequired placeholder="Enter your email" isInvalid={!!errMsg && !formData.end_date}  onChange={(e) => setFormData({...formData, end_date: e.target.value})}/>
            </div>
            <div className={"grid grid-cols-2 gap-5"}>
                <Select
                    label="比赛类型"
                    className=""
                    selectedKeys={formData.is_group ? ['1'] : ['0']}
                    isRequired
                    onChange={(e) => setFormData({...formData, is_group: e.target.value === '1'})}
                >
                    <SelectItem key='0'>
                        个人赛
                    </SelectItem>
                    <SelectItem key='1'>
                        团队赛
                    </SelectItem>
                </Select>
                <Select
                    label="比赛模式"
                    isRequired
                    isInvalid={!!errMsg && !formData.mode}
                    selectedKeys={[formData.mode]}
                    onChange={(e) => setFormData({...formData, mode: e.target.value})}
                >
                    <SelectItem key='osu'>
                        osu
                    </SelectItem>
                    <SelectItem key='taiko'>
                        taiko
                    </SelectItem>
                    <SelectItem key='mania'>
                        mania
                    </SelectItem>
                    <SelectItem key='fruits'>
                        fruits
                    </SelectItem>
                </Select>
                <Input label="排名最低限制要求" value={formData.rank_min?formData.rank_min.toString():undefined} description="比赛的最低排名，留空如果你不需要限制" onChange={(e) => setFormData({...formData, rank_min: parseInt(e.target.value)})}/>
                <Input label="排名最高限制要求" value={formData.rank_max?formData.rank_max.toString():undefined} description="比赛的最高排名，留空如果你不需要限制" onChange={(e) => setFormData({...formData, rank_max: parseInt(e.target.value)})}/>
            </div>
            <Divider/>
            <h1 className={"text-3xl font-bold"}>
                赛事详细信息
            </h1>
            <Textarea
                isRequired
                minRows={2}
                description="你的比赛介绍，将会被用于展示"
                value={formData.description}
                label="赛事介绍"
                isInvalid={!!errMsg && !formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
            <Textarea
                isRequired
                minRows={2}
                description="比赛的详细规则，将会被用于展示"
                value={formData.rules_info}
                label="规则"
                isInvalid={!!errMsg && !formData.rules_info}
                onChange={(e) => setFormData({...formData, rules_info: e.target.value})}
            />
            <Textarea
                minRows={2}
                description="比赛赛程信息，将会被用于展示"
                value={formData.tournament_schedule_info}
                label="赛程信息"
                onChange={(e) => setFormData({...formData, tournament_schedule_info: e.target.value})}
            />
            <Textarea
                minRows={2}
                description="比赛奖金信息，将会被用于展示"
                value={formData.prize_info}
                label="比赛奖金信息"
                onChange={(e) => setFormData({...formData, prize_info: e.target.value})}
            />
            <Divider/>
            <h1 className={"text-3xl font-bold"}>
                staff招募
            </h1>
            <Textarea
                minRows={2}
                description="比赛staff的招募信息，将会被用于展示"
                value={formData.staff_registration_info}
                label="staff招募信息"
                onChange={(e) => setFormData({...formData, staff_registration_info: e.target.value})}
            />
            <Divider/>
            <div>
                你可以调节你想招募的staff的职位
            </div>
            <div className="grid grid-cols-4 gap-5">
                <Switch isSelected={formData.referee} onChange={(e) => setFormData({...formData, referee: e.target.checked})}>
                    裁判
                </Switch>
                <Switch isSelected={formData.streamer} onChange={(e) => setFormData({...formData, streamer: e.target.checked})}>
                    直播
                </Switch>
                <Switch isSelected={formData.commentator} onChange={(e) => setFormData({...formData, commentator: e.target.checked})}>
                    解说
                </Switch>
                <Switch isSelected={formData.mappooler} onChange={(e) => setFormData({...formData, mappooler: e.target.checked})}>
                    选图
                </Switch>
                <Switch isSelected={formData.custom_mapper} onChange={(e) => setFormData({...formData, custom_mapper: e.target.checked})}>
                    作图
                </Switch>
                <Switch isSelected={formData.donator} onChange={(e) => setFormData({...formData, donator: e.target.checked})}>
                    赞助
                </Switch>
                <Switch isSelected={formData.designer} onChange={(e) => setFormData({...formData, designer: e.target.checked})}>
                    美术
                </Switch>
                <Switch isSelected={formData.scheduler} onChange={(e) => setFormData({...formData, scheduler: e.target.checked})}>
                    时间安排
                </Switch>
                <Switch isSelected={formData.map_tester} onChange={(e) => setFormData({...formData, map_tester: e.target.checked})}>
                    测图
                </Switch>
            </div>
            <Divider/>
            <h1 className={"text-3xl font-bold"}>
                challonge
            </h1>
            <div className="flex flex-row gap-5">
                <Input label="challonge API key" value={formData.challonge_api_key} description="challonge网站的API key 可在 https://challonge.com/settings/developer 获得" onChange={(e) => setFormData({...formData, challonge_api_key: e.target.value})}/>
                <Input label="challonge 比赛的网页名称" value={formData.challonge_tournament_url} description="如你的比赛的地址为 https://challonge.com/c4cc 那这里应该填c4cc" onChange={(e) => setFormData({...formData, challonge_tournament_url: e.target.value})}/>
            </div>
            <Divider/>
            <h1 className={"text-3xl font-bold"}>
                外接链接
            </h1>
            增加你在赛事主页上想要展示的链接，如你的比赛的官方群聊、比赛的论坛页等
            <Button className="max-w-fit" onPress={() => {
                setFormData({...formData,links: [...formData.links, {name: '', url: ''}]})
            }}>添加链接</Button>
            {formData.links.map((link, index) => (
                <div className="flex flex-row gap-5 items-center" key={index}>
                    <Input label="网页名称" value={link.name} onChange={e => {
                        const updatedLinks = [...formData.links];
                        updatedLinks[index]['name'] = e.target.value;
                        setFormData({ ...formData, links: updatedLinks });
                    }}/>
                    <Input label="网页地址" value={link.url} onChange={e => {
                        const updatedLinks = [...formData.links];
                        updatedLinks[index]['url'] = e.target.value;
                        setFormData({ ...formData, links: updatedLinks });
                    }}/>
                    <Button color="danger" onPress={() => {
                        const updatedLinks = formData.links.filter((_, i) => i !== index);
                        setFormData({ ...formData, links: updatedLinks });
                    }}>
                        删除
                    </Button>
                </div>
            ))}
            <Divider/>
        </section>
    )
}
