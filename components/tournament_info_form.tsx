import {Input, Textarea} from "@heroui/input";
import {Select, SelectItem} from "@heroui/select";
import {Divider} from "@heroui/divider";
import {Switch} from "@heroui/switch";
import {TournamentInfo} from "@/components/homepage";
import {Dispatch, SetStateAction} from "react";
import {Button} from "@heroui/button";
import {Card, CardBody, CardHeader} from "@heroui/card";
import {Chip} from "@heroui/chip";

// --- 图标 ---
const InfoIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>);
const RuleIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>);
const StaffIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const LinkIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>);
const TrashIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);

// 通用的 Section 包装器
const FormSection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <Card className="border border-white/5 bg-content1 shadow-sm">
        <CardHeader className="flex gap-3 px-6 py-4 bg-default-50/50 border-b border-white/5">
            <div className="text-xl text-primary">{icon}</div>
            <h2 className="text-lg font-bold">{title}</h2>
        </CardHeader>
        <CardBody className="gap-6 p-6">
            {children}
        </CardBody>
    </Card>
);

export const TournamentInfoForm = ({formData, errMsg, setFormData}: {
    formData: TournamentInfo,
    errMsg: string,
    setFormData: Dispatch<SetStateAction<TournamentInfo>>
}) => {

    // 更新链接的辅助函数
    const updateLink = (index: number, key: 'name' | 'url', value: string) => {
        const newLinks = [...formData.links];
        newLinks[index][key] = value;
        setFormData({...formData, links: newLinks});
    };

    const removeLink = (index: number) => {
        setFormData({...formData, links: formData.links.filter((_, i) => i !== index)});
    };

    return (
        <div className="flex flex-col gap-6">

            {/* 1. 基本信息 */}
            <FormSection title="基本信息" icon={<InfoIcon />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input isRequired label="比赛名称" placeholder="例如：The 1st osu! Cup"
                           value={formData.name}
                           isInvalid={!!errMsg && !formData.name} errorMessage={!!errMsg && !formData.name && "请输入比赛名称"}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}/>

                    <Input isRequired label="英文简称 (URL)" placeholder="例如：TOC1"
                           description="用于生成比赛网址，请勿包含特殊字符"
                           value={formData.abbreviation}
                           isInvalid={!!errMsg && !formData.abbreviation} errorMessage={!!errMsg && !formData.abbreviation && "请输入比赛简称"}
                           onChange={(e) => setFormData({...formData, abbreviation: e.target.value})}/>
                </div>

                <Input label="头图链接 (Banner URL)" placeholder="https://..."
                       value={formData.pic_url}
                       description="推荐尺寸 16:9，作为比赛主页的封面图"
                       onChange={(e) => setFormData({...formData, pic_url: e.target.value})}/>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input type="date" label="开始日期" isRequired value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})}/>
                    <Input type="date" label="结束日期" isRequired value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})}/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select label="比赛模式" isRequired defaultSelectedKeys={[formData.mode]} onChange={(e) => setFormData({...formData, mode: e.target.value})}>
                        <SelectItem key='osu'>Standard (osu!)</SelectItem>
                        <SelectItem key='taiko'>Taiko</SelectItem>
                        <SelectItem key='mania'>Mania</SelectItem>
                        <SelectItem key='fruits'>Catch (Fruits)</SelectItem>
                    </Select>

                    <Select label="赛制类型" isRequired defaultSelectedKeys={formData.is_group ? ['1'] : ['0']} onChange={(e) => setFormData({...formData, is_group: e.target.value === '1'})}>
                        <SelectItem key='0'>个人赛 (Solo)</SelectItem>
                        <SelectItem key='1'>团队赛 (Team)</SelectItem>
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-default-100 rounded-xl">
                    <div className="col-span-full text-sm text-default-500 font-bold">排名限制 (可选)</div>
                    <Input type="number" label="最低排名 (Min Rank)" placeholder="例如：1000"
                           value={formData.rank_min?.toString()} onChange={(e) => setFormData({...formData, rank_min: e.target.value ? parseInt(e.target.value) : undefined})}/>
                    <Input type="number" label="最高排名 (Max Rank)" placeholder="例如：10000"
                           value={formData.rank_max?.toString()} onChange={(e) => setFormData({...formData, rank_max: e.target.value ? parseInt(e.target.value) : undefined})}/>
                </div>
            </FormSection>

            {/* 2. 详情与规则 */}
            <FormSection title="详情与规则" icon={<RuleIcon />}>
                <Textarea isRequired minRows={3} label="赛事介绍" placeholder="简要介绍你的比赛..."
                          value={formData.description} isInvalid={!!errMsg && !formData.description} errorMessage="必填"
                          onChange={(e) => setFormData({...formData, description: e.target.value})} />

                <Textarea isRequired minRows={5} label="详细规则" placeholder="详细的比赛规则，支持 Markdown..."
                          value={formData.rules_info} isInvalid={!!errMsg && !formData.rules_info} errorMessage="必填"
                          onChange={(e) => setFormData({...formData, rules_info: e.target.value})} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Textarea minRows={3} label="赛程安排" placeholder="Qualifiers: ..." value={formData.tournament_schedule_info} onChange={(e) => setFormData({...formData, tournament_schedule_info: e.target.value})} />
                    <Textarea minRows={3} label="奖金信息" placeholder="1st Place: ..." value={formData.prize_info} onChange={(e) => setFormData({...formData, prize_info: e.target.value})} />
                </div>
            </FormSection>

            {/* 3. Staff 设置 */}
            <FormSection title="Staff 招募配置" icon={<StaffIcon />}>
                <Textarea minRows={2} label="招募说明" placeholder="填写针对 Staff 的招募要求..."
                          value={formData.staff_registration_info} onChange={(e) => setFormData({...formData, staff_registration_info: e.target.value})} />

                <div className="flex flex-col gap-3">
                    <div className="text-sm text-default-500 font-bold">开放申请的职位</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {[
                            {key: 'referee', label: '裁判'},
                            {key: 'streamer', label: '直播'},
                            {key: 'commentator', label: '解说'},
                            {key: 'mappooler', label: '选图'},
                            {key: 'custom_mapper', label: '作图'},
                            {key: 'designer', label: '美术'},
                            {key: 'scheduler', label: '调度'},
                            {key: 'map_tester', label: '测图'},
                            {key: 'donator', label: '赞助'},
                        ].map((role) => (
                            <div key={role.key} className="flex items-center justify-between p-3 bg-default-100 rounded-lg border border-transparent hover:border-primary/30 transition-colors">
                                <span className="text-sm font-medium">{role.label}</span>
                                <Switch size="sm" isSelected={(formData as any)[role.key]}
                                        onChange={(e) => setFormData({...formData, [role.key]: e.target.checked})} />
                            </div>
                        ))}
                    </div>
                </div>
            </FormSection>

            {/* 4. 高级设置 (Challonge & Links) */}
            <FormSection title="外链与高级设置" icon={<LinkIcon />}>
                <div className="p-4 border border-warning/20 bg-warning/10 rounded-xl mb-4">
                    <h4 className="text-warning font-bold text-sm mb-2">Challonge 集成 (可选)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input size="sm" label="API Key" placeholder="Challonge API Key" value={formData.challonge_api_key} onChange={(e) => setFormData({...formData, challonge_api_key: e.target.value})}/>
                        <Input size="sm" label="Tournament URL" placeholder="e.g. c4cc" value={formData.challonge_tournament_url} onChange={(e) => setFormData({...formData, challonge_tournament_url: e.target.value})}/>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-default-600">外部链接列表</span>
                        <Button size="sm" color="primary" variant="flat" onPress={() => setFormData({...formData, links: [...formData.links, {name: '', url: ''}]})}>
                            + 添加链接
                        </Button>
                    </div>

                    {formData.links.length === 0 && <div className="text-center text-default-400 text-sm py-4">暂无链接</div>}

                    <div className="flex flex-col gap-3">
                        {formData.links.map((link, index) => (
                            <div key={index} className="flex gap-3 items-center">
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Input size="sm" label="链接名称" placeholder="例如：QQ群 / Discord" value={link.name} onChange={e => updateLink(index, 'name', e.target.value)}/>
                                    <Input size="sm" label="URL 地址" placeholder="https://..." value={link.url} onChange={e => updateLink(index, 'url', e.target.value)}/>
                                </div>
                                <Button isIconOnly color="danger" variant="light" onPress={() => removeLink(index)}>
                                    <TrashIcon />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </FormSection>
        </div>
    )
}