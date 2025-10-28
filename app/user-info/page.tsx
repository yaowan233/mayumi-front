"use client";
import {siteConfig} from "@/config/site";
import {Image} from "@heroui/image";
import {ScoreRankA, ScoreRankS, ScoreRankSS, ScoreRankX, ScoreRankXH} from "@/app/user-info/score-rank";
import {Progress} from "@heroui/progress";
import TournamentChart from "@/components/game_chart";
import UserLevel from "@/components/user_level";
import {User} from "@/app/user-info/types";
import {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import GameModeIcon from "@/components/gamemode_icon";
import {Button, ButtonGroup} from "@heroui/button";



export default function TournamentHomePage() {
    const currentUser = useContext(CurrentUserContext);
    const [userInfo, setUserInfo] = useState<User>({
        avatar_url: "",
        badges: [],
        country_code: "",
        cover_url: "",
        default_group: "",
        has_supported: false,
        id: 0,
        is_active: false,
        is_bot: false,
        is_deleted: false,
        is_online: false,
        is_supporter: false,
        join_date: "",
        last_visit: "",
        location: "",
        occupation: "",
        playmode: undefined,
        playstyle: [],
        profile_colour: "",
        statistics: undefined,
        statistics_rulesets: undefined,
        team: undefined,
        username: ""
    });
    const [selectedMode, setSelectedMode] = useState("osu");
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                const data = await getUserInfo(selectedMode);
                setUserInfo(data);
            }
            console.log(selectedMode)
        };
        fetchData();
    }, [currentUser, selectedMode]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4 text-white items-center">
            </div>
            <ButtonGroup>
              <Button onPress={() => {setSelectedMode("osu")}}><GameModeIcon mode="osu" size={30} color="#ff66aa" /></Button>
              <Button onPress={() => {setSelectedMode("taiko")}}><GameModeIcon mode="taiko" size={30} color="#f33" /></Button>
              <Button onPress={() => {setSelectedMode("fruits")}}><GameModeIcon mode="fruits" size={30} color="#ffa500" /></Button>
                <Button onPress={() => {setSelectedMode("mania")}}><GameModeIcon mode="mania" size={30} color="#6cf" /></Button>
            </ButtonGroup>
        <div className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col gap-2 h-full flex-grow rounded-lg"
          style={{
            backgroundImage: "url('https://www.loliapi.com/acg')",
          }}>
            <div className="flex flex-row gap-4 bg-black/40 rounded-lg p-1 px-4">
                <div className="max-w-[100px]">
                    <Image
                        className=""
                        src={`https://a.ppy.sh/${userInfo.id}`}
                        alt="user"
                    />
                </div>
                <div className="flex flex-col flex-grow">
                    <div className="text-xl">{userInfo.username}</div>
                    <div className="flex flex-row items-center gap-2">
                        <Image radius="none" width={"30px"} src={userInfo.team?.flag_url} alt="team_flag"/>
                        <p className="text-xl">{userInfo.team?.name}</p>
                    </div>
                    <div className="flex flex-row justify-between">
                        <div className="flex flex-row text-xl gap-2 items-center">
                            <Image radius="none" width="25px" src={flagUrl(userInfo.country_code)} alt="country"/>
                            #{userInfo.statistics?.country_rank}
                        </div>
                        {userInfo.statistics?.variants &&(
                            <div className="flex flex-col">
                            <div className="text-xs">
                                4k: {userInfo.statistics?.variants?.find(key => key.variant === "4k")?.pp} /
                                #{userInfo.statistics?.variants?.find(key => key.variant === "4k")?.global_rank} / {userInfo.country_code} #{userInfo.statistics?.variants?.find(key => key.variant == "4k")?.country_rank}
                            </div>
                            <div className="text-xs">
                                7k: {userInfo.statistics?.variants?.find(key => key.variant === "7k")?.pp} /
                                #{userInfo.statistics?.variants?.find(key => key.variant === "7k")?.global_rank} / {userInfo.country_code} #{userInfo.statistics?.variants?.find(key => key.variant == "7k")?.country_rank}
                            </div>
                        </div>)}
                    </div>
                </div>
            </div>
            <div className="relative flex flex-row bg-black/40 rounded-lg p-1 justify-between gap-6 px-4">
                <Progress label="等级" className="" classNames={{value: ""}} value={userInfo.statistics?.level.progress} showValueLabel={true}/>
                <div className="w-[50px]">
                    <UserLevel level={userInfo.statistics?.level.current || 0}/>
                </div>
            </div>
            <div className="relative flex flex-row bg-black/40 rounded-lg p-1 justify-between px-4">
                <div className="flex flex-col">
                    <div>
                        世界排名
                    </div>
                    <div>
                        #{userInfo.statistics?.global_rank}
                    </div>
                </div>
                <div className="flex flex-col">
                    <div>
                        pp
                    </div>
                    <div>
                        {userInfo.statistics?.pp}
                    </div>
                </div>
                <div className="flex flex-row gap-2">
                    <div className="flex flex-col justify-evenly text-center">
                        <ScoreRankXH/>
                        {userInfo.statistics?.grade_counts.ssh}
                    </div>
                    <div className="flex flex-col justify-evenly text-center">
                        <ScoreRankSS/>
                        {userInfo.statistics?.grade_counts.ss}
                    </div>
                    <div className="flex flex-col justify-evenly text-center">
                        <ScoreRankX/>
                        {userInfo.statistics?.grade_counts.sh}
                    </div>
                    <div className="flex flex-col justify-evenly text-center">
                        <ScoreRankS/>
                        {userInfo.statistics?.grade_counts.s}
                    </div>
                    <div className="flex flex-col justify-evenly text-center">
                        <ScoreRankA/>
                        {userInfo.statistics?.grade_counts.a}
                    </div>
                </div>
            </div>
            <div className="relative flex flex-col gap-2 bg-black/40 rounded-lg p-1 flex-grow px-4">
                <div className="flex flex-row justify-between">
                    <div>
                        Ranked 谱面总分
                    </div>
                    <div>
                        {userInfo.statistics?.ranked_score}
                    </div>
                </div>
                <div className="flex flex-row justify-between">
                    <div>
                        准确率
                    </div>
                    <div>
                        {userInfo.statistics?.hit_accuracy.toFixed(2)}%
                    </div>
                </div>
                <div className="flex flex-row justify-between">
                    <div>
                        游戏次数
                    </div>
                    <div>
                        {userInfo.statistics?.play_count}
                    </div>
                </div>
                <div className="flex flex-row justify-between">
                    <div>
                        总分
                    </div>
                    <div>
                        {userInfo.statistics?.total_score}
                    </div>
                </div>
                <div className="flex flex-row justify-between">
                    <div>
                        总命中次数
                    </div>
                    <div>
                        {userInfo.statistics?.total_hits}
                    </div>
                </div>
                <div className="flex flex-row justify-between">
                    <div>
                        游玩时间
                    </div>
                    <div>
                        {userInfo.statistics?.play_time}
                    </div>
                </div>
                <div className="flex flex-row justify-between">
                    <div>
                        每次游玩击打数
                    </div>
                    <div>
                        {userInfo.statistics? (userInfo.statistics.total_hits / (userInfo.statistics.play_count || 1)).toFixed(2) : "N/A"}
                    </div>
                </div>
                <div className="flex flex-row justify-between">
                    <div>
                        最大连击
                    </div>
                    <div>
                        {userInfo.statistics?.maximum_combo}
                    </div>
                </div>
                <div className="flex flex-row justify-between">
                    <div>
                        回放被观看次数
                    </div>
                    <div>
                        {userInfo.statistics?.replays_watched_by_others}
                    </div>
                </div>
            </div>
            {/*<TournamentChart/>*/}
        </div>
        </div>
    )
}

function flagUrl(countryCode: string): string {
  // 将国家代码分割成字符（通常是两个字母，例如 "US"）
  const chars = countryCode.toUpperCase().split('');

  // 将每个字母转为 Unicode 码点，再加上 127397（国旗 emoji 偏移量）
  const hexEmojiChars = chars.map(chr =>
    (chr.codePointAt(0)! + 127397).toString(16)
  );

  // 拼接成文件名，比如 "1f1fa-1f1f8.svg"（对应 🇺🇸）
  const baseFileName = hexEmojiChars.join('-');

  // 返回静态资源路径
  return `https://osu.ppy.sh/assets/images/flags/${baseFileName}.svg`;
}


async function getUserInfo(mode: string): Promise<User> {
  const res = await fetch(`${siteConfig.backend_url}/api/user-info?mode=${mode}`, {
    method: 'POST',
    credentials: 'include'
  });
  return await res.json();
}