"use client"
import {Button} from "@nextui-org/button";
import {Select, SelectItem} from "@nextui-org/select";
import {Input, Textarea} from "@nextui-org/input";
import {Switch} from "@nextui-org/switch";
import {Divider} from "@nextui-org/divider";
import {useContext, useState} from "react";
import CurrentUserContext from "@/app/user_context";

export default function CreateTournamentPage() {
	const currentUser  = useContext(CurrentUserContext);
	const [formData, setFormData] = useState<TournamentFormData>({
		creator: currentUser?.currentUser?.uid,
		name: '',
		abbreviation: '',
		cover: '',
		startTime: new Date(),
		endTime: new Date(),
		tournamentType: '',
		gameMode: '',
		minimumRank: '',
		maximumRank: '',
		description: '',
		rules: '',
		staffRecruitment: '',
		staffPositions: [],
		challongeApiKey: '',
		challongeTournamentUrl: ''
	});
	const [errMsg, setErrMsg] = useState('');
	const handleCreateTournament = async () => {
		if (!formData.name || !formData.abbreviation || !formData.tournamentType || !formData.gameMode || !formData.description || !formData.rules) {
			// 显示错误消息或采取其他适当的操作
			setErrMsg('请填写所有必填字段')
		}
		else {
			// 执行报名操作或其他相关逻辑
			console.log(JSON.stringify(formData))
			const res = await fetch('http://localhost:8421/api/create-tournament', {'method': 'POST', 'body': JSON.stringify(formData), 'headers': {'Content-Type': 'application/json'}})
			if (res.status != 200) {
				// 失败
				setErrMsg(await res.text());
			}
			else {
				// 关闭模态框
				alert('创建成功');
			}
		}
	}
	return (
		<section className={"grid grid-cols-1 gap-y-5"}>
			<h1 className={"text-3xl font-bold"}>
				创建比赛
			</h1>
			<div className="flex flex-row gap-5">
				<Input isRequired label="比赛名称" description="比赛的完整全称" onChange={(e) => setFormData({...formData, name: e.target.value})}/>
				<Input isRequired label="简称" description="比赛简称，英文，必须与其他比赛的简称唯一，这将作为比赛的网页地址，请勿包含特殊字符（如@、，），应以简单为主" onChange={(e) => setFormData({...formData, abbreviation: e.target.value})}/>
				<Input label="比赛头图地址" description="比赛头图图床地址，用于展示" onChange={(e) => setFormData({...formData, cover: e.target.value})}/>
			</div>
			<div className="flex flex-row gap-5">
				<Input type="date" label="开始时间" isRequired placeholder="Enter your email"  onChange={(e) => setFormData({...formData, startTime: new Date(e.target.value)})}/>
				<Input type="date" label="结束时间" isRequired placeholder="Enter your email"  onChange={(e) => setFormData({...formData, endTime: new Date(e.target.value)})}/>
			</div>
			<div className={"grid grid-cols-2 gap-5"}>
				<Select
					label="比赛类型"
					className=""
					isRequired
					onChange={(e) => setFormData({...formData, tournamentType: e.target.value})}
				>
					<SelectItem key='0' value=''>
						个人赛
					</SelectItem>
					<SelectItem key='1' value='1'>
						团队赛
					</SelectItem>
				</Select>
				<Select
					label="比赛模式"
					isRequired
					onChange={(e) => setFormData({...formData, gameMode: e.target.value})}
				>
					<SelectItem key='0' value='std'>
						std
					</SelectItem>
					<SelectItem key='1' value='taiko'>
						taiko
					</SelectItem>
					<SelectItem key='2' value='mania'>
						mania
					</SelectItem>
					<SelectItem key='3' value='ctb'>
						ctb
					</SelectItem>
				</Select>
				<Input label="排名最低限制要求" description="比赛的最低排名，留空如果你不需要限制" onChange={(e) => setFormData({...formData, minimumRank: e.target.value})}/>
				<Input label="排名最高限制要求" description="比赛的最高排名，留空如果你不需要限制" onChange={(e) => setFormData({...formData, maximumRank: e.target.value})}/>
			</div>
			<Textarea
				isRequired
				minRows={2}
				description="你的比赛介绍，将在赛事简介中展示"
				label="赛事介绍"
				onChange={(e) => setFormData({...formData, description: e.target.value})}
			/>
			<Textarea
				isRequired
				minRows={2}
				description="比赛的详细规则"
				label="规则"
				onChange={(e) => setFormData({...formData, rules: e.target.value})}
			/>
			<Divider/>
			<h1 className={"text-3xl font-bold"}>
				staff招募
			</h1>
			<Textarea
				minRows={2}
				description="比赛staff的招募信息，将会被用于展示"
				label="staff招募信息"
				onChange={(e) => setFormData({...formData, staffRecruitment: e.target.value})}
			/>
			<div>
				你可以调节你想招募的staff的职位
			</div>
			<div className="grid grid-cols-4 gap-5">
				<Switch defaultSelected>
					裁判
				</Switch>
				<Switch defaultSelected>
					直播
				</Switch>
				<Switch defaultSelected>
					解说
				</Switch>
				<Switch defaultSelected>
					选图
				</Switch>
				<Switch defaultSelected>
					作图
				</Switch>
				<Switch defaultSelected>
					赞助
				</Switch>
				<Switch defaultSelected>
					美术
				</Switch>
				<Switch defaultSelected>
					时间安排
				</Switch>
				<Switch defaultSelected>
					测图
				</Switch>
			</div>
			<Divider/>
			<h1 className={"text-3xl font-bold"}>
				challonge
			</h1>
			<div className="flex flex-row gap-5">
				<Input label="challonge API key" description="challonge网站的API key 可在 https://challonge.com/settings/developer 获得" onChange={(e) => setFormData({...formData, challongeApiKey: e.target.value})}/>
				<Input label="challonge 比赛的网页名称" description="如你的比赛的地址为 https://challonge.com/c4cc 那这里应该填c4cc" onChange={(e) => setFormData({...formData, challongeTournamentUrl: e.target.value})}/>
			</div>
			<Divider/>
			<h1 className={"text-3xl font-bold"}>
				创建比赛
			</h1>
			当填写写所有信息后，点击下方按钮即可创建比赛。请注意，比赛页面将在审核通过后才会被展示。
			<div className="flex flex-row items-center gap-5">
				<Button className="max-w-[70px]" onPress={handleCreateTournament}>创建比赛</Button>
				<div className="text-red-500">
					{errMsg}
				</div>
			</div>
		</section>
	);
}


type TournamentFormData = {
	creator?: number;
	name: string;
	abbreviation: string;
	cover: string;
	startTime: Date;
	endTime: Date;
	tournamentType: string;
	gameMode: string;
	minimumRank?: string;
	maximumRank?: string;
	description: string;
	rules: string;
	staffRecruitment: string;
	staffPositions: string[];
	challongeApiKey?: string;
	challongeTournamentUrl?: string;
}
