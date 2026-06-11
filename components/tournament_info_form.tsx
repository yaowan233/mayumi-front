import {
    Button,
    Card,
    Description,
    FieldError,
    Input,
    Label,
    ListBox,
    Select,
    Switch,
    TextArea,
    TextField,
} from "@heroui/react";
import {TournamentInfo} from "@/components/homepage";
import {Dispatch, SetStateAction} from "react";

const InfoIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 17v-5"/><path d="M12 8h.01"/></svg>);
const RuleIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>);
const StaffIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const LinkIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>);
const TrashIcon = () => (<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);

const modeOptions = [
    {key: "osu", label: "Standard (osu!)"},
    {key: "taiko", label: "Taiko"},
    {key: "mania", label: "Mania"},
    {key: "fruits", label: "Catch (Fruits)"},
    {key: "all", label: "多模式 (All Modes)"},
] as const;

const formatOptions = [
    {key: "0", label: "个人赛 (Solo)"},
    {key: "1", label: "团队赛 (Team)"},
] as const;

const staffRoles: Array<{key: keyof TournamentInfo; label: string}> = [
    {key: "referee", label: "裁判"},
    {key: "streamer", label: "直播"},
    {key: "commentator", label: "解说"},
    {key: "mappooler", label: "选图"},
    {key: "custom_mapper", label: "作图"},
    {key: "designer", label: "美术"},
    {key: "scheduler", label: "调度"},
    {key: "map_tester", label: "测图"},
    {key: "donator", label: "赞助"},
];

const FormSection = ({title, icon, children}: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <Card className="overflow-hidden">
        <Card.Header className="flex flex-row items-center justify-start gap-3 border-b border-default-200 px-6 py-4 text-left dark:border-white/5">
            <div className="text-xl text-primary">{icon}</div>
            <Card.Title>{title}</Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-col gap-6 p-6">
            {children}
        </Card.Content>
    </Card>
);

function RequiredTextField({
    label,
    value,
    onChange,
    errorMessage,
    description,
    ...inputProps
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    errorMessage?: string;
    description?: string;
    [key: string]: any;
}) {
    return (
        <TextField isRequired isInvalid={Boolean(errorMessage)}>
            <Label>{label}</Label>
            <Input {...inputProps} fullWidth variant="secondary" value={value} onChange={(event) => onChange(event.target.value)}/>
            {description && <Description>{description}</Description>}
            {errorMessage && <FieldError>{errorMessage}</FieldError>}
        </TextField>
    );
}

function TextAreaField({
    label,
    value,
    onChange,
    errorMessage,
    description,
    isRequired,
    rows = 3,
    ...textAreaProps
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    errorMessage?: string;
    description?: string;
    isRequired?: boolean;
    rows?: number;
    [key: string]: any;
}) {
    return (
        <TextField isRequired={isRequired} isInvalid={Boolean(errorMessage)}>
            <Label>{label}</Label>
            <TextArea {...textAreaProps} fullWidth rows={rows} variant="secondary" value={value ?? ""} onChange={(event) => onChange(event.target.value)}/>
            {description && <Description>{description}</Description>}
            {errorMessage && <FieldError>{errorMessage}</FieldError>}
        </TextField>
    );
}

function SelectField({
    label,
    value,
    onChange,
    description,
    options,
    isRequired,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    description?: string;
    options: ReadonlyArray<{key: string; label: string}>;
    isRequired?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1">
            <Select fullWidth isRequired={isRequired} value={value} onChange={(nextValue) => onChange(String(nextValue ?? ""))} variant="secondary">
                <Label>{label}</Label>
                <Select.Trigger>
                    <Select.Value/>
                    <Select.Indicator/>
                </Select.Trigger>
                {description && <Description>{description}</Description>}
                <Select.Popover>
                    <ListBox>
                        {options.map((option) => (
                            <ListBox.Item key={option.key} id={option.key} textValue={option.label}>
                                {option.label}
                            </ListBox.Item>
                        ))}
                    </ListBox>
                </Select.Popover>
            </Select>
        </div>
    );
}

export const TournamentInfoForm = ({formData, errMsg, setFormData}: {
    formData: TournamentInfo,
    errMsg: string,
    setFormData: Dispatch<SetStateAction<TournamentInfo>>
}) => {
    const updateLink = (index: number, key: "name" | "url", value: string) => {
        const newLinks = [...formData.links];
        newLinks[index][key] = value;
        setFormData({...formData, links: newLinks});
    };

    const removeLink = (index: number) => {
        setFormData({...formData, links: formData.links.filter((_, i) => i !== index)});
    };

    return (
        <div className="flex flex-col gap-6">
            <FormSection title="基本信息" icon={<InfoIcon/>}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <RequiredTextField
                        label="比赛名称"
                        placeholder="例如：The 1st osu! Cup"
                        value={formData.name}
                        onChange={(value) => setFormData({...formData, name: value})}
                        errorMessage={errMsg && !formData.name ? "请输入比赛名称" : undefined}
                    />

                    <RequiredTextField
                        label="英文简称 (URL)"
                        placeholder="例如：TOC1"
                        value={formData.abbreviation}
                        onChange={(value) => setFormData({...formData, abbreviation: value})}
                        description="用于生成比赛网址，请勿包含特殊字符"
                        errorMessage={errMsg && !formData.abbreviation ? "请输入比赛简称" : undefined}
                    />
                </div>

                <TextField>
                        <Label>头图链接 (Banner URL)</Label>
                        <Input
                            fullWidth
                            variant="secondary"
                        placeholder="https://..."
                        value={formData.pic_url}
                        onChange={(event) => setFormData({...formData, pic_url: event.target.value})}
                    />
                    <Description>推荐尺寸 16:9，作为比赛主页的封面图</Description>
                </TextField>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <RequiredTextField
                        label="开始日期"
                        type="date"
                        value={formData.start_date}
                        onChange={(value) => setFormData({...formData, start_date: value})}
                    />
                    <RequiredTextField
                        label="结束日期"
                        type="date"
                        value={formData.end_date}
                        onChange={(value) => setFormData({...formData, end_date: value})}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <SelectField
                        label="比赛模式"
                        isRequired
                        value={formData.mode}
                        onChange={(value) => setFormData({...formData, mode: value})}
                        options={modeOptions}
                    />

                    <SelectField
                        label="赛制类型"
                        isRequired
                        value={formData.is_group ? "1" : "0"}
                        onChange={(value) => setFormData({...formData, is_group: value === "1"})}
                        options={formatOptions}
                    />
                </div>

                <Card variant="secondary">
                    <Card.Content className="flex flex-col gap-4 p-4">
                        <div className="text-sm font-semibold text-default-500">排名限制 (可选)</div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <TextField>
                                <Label>最低排名 (Min Rank)</Label>
                                <Input
                                    type="number"
                                    fullWidth
                                    variant="secondary"
                                    placeholder="例如：1000"
                                    value={formData.rank_min?.toString() ?? ""}
                                    onChange={(event) => setFormData({...formData, rank_min: event.target.value ? parseInt(event.target.value, 10) : undefined})}
                                />
                            </TextField>
                            <TextField>
                                <Label>最高排名 (Max Rank)</Label>
                                <Input
                                    type="number"
                                    fullWidth
                                    variant="secondary"
                                    placeholder="例如：10000"
                                    value={formData.rank_max?.toString() ?? ""}
                                    onChange={(event) => setFormData({...formData, rank_max: event.target.value ? parseInt(event.target.value, 10) : undefined})}
                                />
                            </TextField>
                        </div>
                    </Card.Content>
                </Card>
            </FormSection>

            <FormSection title="详情与规则" icon={<RuleIcon/>}>
                <TextAreaField
                    label="赛事介绍"
                    isRequired
                    rows={3}
                    placeholder="简要介绍你的比赛..."
                    value={formData.description ?? ""}
                    onChange={(value) => setFormData({...formData, description: value})}
                    errorMessage={errMsg && !formData.description ? "必填" : undefined}
                />

                <TextAreaField
                    label="详细规则"
                    isRequired
                    rows={5}
                    placeholder="详细的比赛规则，支持 Markdown..."
                    value={formData.rules_info ?? ""}
                    onChange={(value) => setFormData({...formData, rules_info: value})}
                    errorMessage={errMsg && !formData.rules_info ? "必填" : undefined}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <TextAreaField
                        label="赛程安排"
                        rows={3}
                        placeholder="Qualifiers: ..."
                        value={formData.tournament_schedule_info ?? ""}
                        onChange={(value) => setFormData({...formData, tournament_schedule_info: value})}
                    />
                    <TextAreaField
                        label="奖金信息"
                        rows={3}
                        placeholder="1st Place: ..."
                        value={formData.prize_info ?? ""}
                        onChange={(value) => setFormData({...formData, prize_info: value})}
                    />
                </div>
            </FormSection>

            <FormSection title="Staff 招募配置" icon={<StaffIcon/>}>
                <TextAreaField
                    label="招募说明"
                    rows={2}
                    placeholder="填写针对 Staff 的招募要求..."
                    value={formData.staff_registration_info ?? ""}
                    onChange={(value) => setFormData({...formData, staff_registration_info: value})}
                />

                <div className="flex flex-col gap-3">
                    <div className="text-sm font-semibold text-default-500">开放申请的职位</div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {staffRoles.map((role) => (
                            <Card key={role.key} variant="secondary">
                                <Card.Content className="flex flex-row items-center justify-between gap-3 px-3 py-2.5">
                                    <span className="text-sm leading-none font-medium">{role.label}</span>
                                    <Switch
                                        size="sm"
                                        isSelected={Boolean(formData[role.key])}
                                        onChange={(isSelected) => setFormData({...formData, [role.key]: isSelected})}
                                        aria-label={role.label}
                                    >
                                        <Switch.Control>
                                            <Switch.Thumb/>
                                        </Switch.Control>
                                    </Switch>
                                </Card.Content>
                            </Card>
                        ))}
                    </div>
                </div>
            </FormSection>

            <FormSection title="外链与高级设置" icon={<LinkIcon/>}>
                <Card variant="secondary">
                    <Card.Content className="flex flex-col gap-4 p-4">
                        <div className="flex flex-col gap-1">
                            <div className="text-sm font-semibold text-warning">Challonge 集成 (可选)</div>
                            <p className="text-sm text-default-500">仅在需要同步 Challonge 对阵时填写。</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <TextField>
                                <Label>API Key</Label>
                                <Input
                                    fullWidth
                                    variant="secondary"
                                    placeholder="Challonge API Key"
                                    value={formData.challonge_api_key ?? ""}
                                    onChange={(event) => setFormData({...formData, challonge_api_key: event.target.value})}
                                />
                            </TextField>
                            <TextField>
                                <Label>Tournament URL</Label>
                                <Input
                                    fullWidth
                                    variant="secondary"
                                    placeholder="e.g. c4cc"
                                    value={formData.challonge_tournament_url ?? ""}
                                    onChange={(event) => setFormData({...formData, challonge_tournament_url: event.target.value})}
                                />
                            </TextField>
                        </div>
                    </Card.Content>
                </Card>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-semibold text-default-500">外部链接列表</span>
                        <Button size="sm" variant="secondary" onPress={() => setFormData({...formData, links: [...formData.links, {name: "", url: ""}]})}>
                            添加链接
                        </Button>
                    </div>

                    {formData.links.length === 0 && (
                        <Card variant="transparent">
                            <Card.Content className="py-4 text-center text-sm text-default-400">暂无链接</Card.Content>
                        </Card>
                    )}

                    <div className="flex flex-col gap-3">
                        {formData.links.map((link, index) => (
                            <Card key={index} variant="secondary">
                                <Card.Content className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
                                    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                                        <TextField>
                                            <Label>链接名称</Label>
                                            <Input
                                                fullWidth
                                                variant="secondary"
                                                placeholder="例如：QQ群 / Discord"
                                                value={link.name}
                                                onChange={(event) => updateLink(index, "name", event.target.value)}
                                            />
                                        </TextField>
                                        <TextField>
                                            <Label>URL 地址</Label>
                                            <Input
                                                fullWidth
                                                variant="secondary"
                                                placeholder="https://..."
                                                value={link.url}
                                                onChange={(event) => updateLink(index, "url", event.target.value)}
                                            />
                                        </TextField>
                                    </div>
                                    <Button
                                        isIconOnly
                                        variant="ghost"
                                        className="text-danger hover:bg-danger/10"
                                        onPress={() => removeLink(index)}
                                        aria-label="删除链接"
                                    >
                                        <TrashIcon/>
                                    </Button>
                                </Card.Content>
                            </Card>
                        ))}
                    </div>
                </div>
            </FormSection>
        </div>
    );
};
