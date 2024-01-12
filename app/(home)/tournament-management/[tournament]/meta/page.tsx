"use client"
import {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {TournamentInfo} from "@/components/homepage";
import {TournamentInfoForm} from "@/components/tournament_info_form";
import {getTournamentInfo} from "@/app/tournaments/[tournament]/home/page";
import {Button} from "@nextui-org/button";
import {useRouter} from "next/navigation";

export default function EditTournamentMetaPage({params}: { params: { tournament: string } }) {
	const currentUser = useContext(CurrentUserContext);
	const router = useRouter();
	const [formData, setFormData] = useState<TournamentInfo>({
		name: '',
		abbreviation: '',
		pic_url: '',
		start_date: '',
		end_date: '',
		is_group: false,
		mode: 'std',
		rank_min: undefined,
		rank_max: undefined,
		description: '',
		rules_info: '',
		staff_registration_info: '',
		tournament_schedule_info: '',
		registration_info: '',
		challonge_api_key: undefined,
		challonge_tournament_url: undefined,
		referee: true,
		commentator: true,
		streamer: true,
		mappooler: true,
		custom_mapper: true,
		designer: true,
		donator: true,
		scheduler: true,
		map_tester: true,
		links: []
	});
	useEffect(() => {
		const fetchData = async () => {
			if (currentUser?.currentUser?.uid) {
				const data = await getTournamentInfo(params.tournament);
				setFormData(data);
			}
		};

		fetchData();
	}, [currentUser]);
	const [errMsg, setErrMsg] = useState('');
	const handleUpdateTournament = async () => {
		if (!formData.name || !formData.abbreviation || !formData.mode || !formData.description || !formData.rules_info) {
			// 显示错误消息或采取其他适当的操作
			setErrMsg('请填写所有必填字段')
		}
		else {
			// 执行报名操作或其他相关逻辑
			const res = await fetch('http://localhost:8421/api/update-tournament', {'method': 'POST', 'body': JSON.stringify(formData), 'headers': {'Content-Type': 'application/json'}, credentials: 'include'})
			if (res.status != 200) {
				// 失败
				setErrMsg(await res.text());
			}
			else {
				// 关闭模态框
				alert('修改成功');
				router.push('/')
			}
		}
	}
	return (
		<div className="flex flex-col gap-5">
			<TournamentInfoForm formData={formData} setFormData={setFormData} errMsg={errMsg} />
			<h1 className={"text-3xl font-bold"}>
				更新赛事信息
			</h1>
			<div className="flex flex-row items-center gap-5">
				<Button className="max-w-[70px]" onPress={handleUpdateTournament}>更新</Button>
				<div className="text-red-500">
					{errMsg}
				</div>
			</div>
		</div>
	);
}
