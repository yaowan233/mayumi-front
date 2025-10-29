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
import GameModeIcon, {GameMode} from "@/components/gamemode_icon";
import {Input} from "@heroui/input";
import {Tooltip} from "@heroui/tooltip";


interface ModeData {
  name: GameMode;
  defaultColor: string;
}

export default function TournamentHomePage() {
    const currentUser = useContext(CurrentUserContext);
    const [userInfo, setUserInfo] = useState<User | null>(null);
    const [selectedMode, setSelectedMode] = useState<GameMode>("osu");
    const [hoveredMode, setHoveredMode] = useState<GameMode | null>(null);
    const [selectedUserName, setSelectedUserName] = useState("");
    const MODE_DEFAULTS: Record<GameMode, ModeData> = {
        osu: { name: 'osu', defaultColor: '#ff66aa' },
        taiko: { name: 'taiko', defaultColor: '#f33' },
        fruits: { name: 'fruits', defaultColor: '#ffa500' },
        mania: { name: 'mania', defaultColor: '#6cf' },
    };
    const MODE_LIST: ModeData[] = Object.values(MODE_DEFAULTS);
    const getIconColor = (mode: GameMode): string => {
        const isSelected = selectedMode === mode;
        const isHovered = hoveredMode === mode;

        // 逻辑：如果选中 OR 悬浮，颜色为白色
        if (isSelected || isHovered) {
          return WHITE_COLOR;
        }
        // 否则，使用预设的默认颜色
        return MODE_DEFAULTS[mode].defaultColor;
  };
    const WHITE_COLOR = '#ffffff';
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.currentUser?.uid) {
                const data = await getUserInfo(selectedMode, selectedUserName);
                setUserInfo(data);
            }
            console.log(selectedMode)
        };
        fetchData();
    }, [currentUser, selectedMode, selectedUserName]);

    return (
        <div className="flex flex-col gap-4 items-center">
            <div className="flex gap-2 bg-gray-800 rounded-lg shadow-xl max-w-fit justify-center">
              {MODE_LIST.map((modeData) => (
                <div
                  key={modeData.name}
                  onClick={() => setSelectedMode(modeData.name)}
                  onMouseEnter={() => setHoveredMode(modeData.name)}
                  onMouseLeave={() => setHoveredMode(null)}

                  // Tailwind 类名：
                  className={`
                    p-3 rounded-md cursor-pointer 
                    transition-all duration-200 ease-in-out
                    hover:bg-gray-700
                    ${selectedMode === modeData.name 
                        ? 'bg-gray-700 ring-2 ring-white/50' // 选中时的样式
                        : 'bg-transparent'
                    }
                  `}
                >
                  <GameModeIcon
                    mode={modeData.name}
                    size={30}
                    color={getIconColor(modeData.name)} // 动态传入颜色
                  />
                </div>
              ))}
            </div>
            <Input label="Osu 用户名" onChange={(e) => {setSelectedUserName(e.target.value)}}/>
            {userInfo &&
        <div className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col gap-2 h-full flex-grow rounded-lg w-full"
          style={{
            backgroundImage: "url('https://www.loliapi.com/acg')",
          }}>
            <div className="flex flex-row gap-4 bg-black/40 rounded-lg p-1 px-4 w-full">
                <div className="max-w-[100px] flex-shrink-0">
                    <Image
                    className=""
                    src={`https://a.ppy.sh/${userInfo.id}`}
                    alt="user"
                    />
                </div>
                <div className="flex flex-col flex-grow justify-around min-w-0">
                    <div className="text-xl truncate min-w-0">{userInfo.username}</div>
                    {userInfo.team &&
                        <div className="flex flex-row items-center gap-2 min-w-0">
                            <div  className="max-w-[35px] flex-shrink-0" >
                                <Image radius="none" src={userInfo.team.flag_url} alt="team_flag"/>
                            </div>
                            <p className="text-xl truncate min-w-0">{userInfo.team.name}</p>
                        </div>
                    }
                    <div className="flex flex-row justify-between">
                        <div className="flex flex-row text-xl gap-2 items-center flex-shrink-0">
                            <Image radius="none" width="25px" src={flagUrl(userInfo.country_code)} alt="country"/>
                            #{userInfo.statistics?.country_rank}
                        </div>
                        {userInfo.statistics?.variants &&(
                            <div className="hidden sm:flex flex-col ">
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
            {
                !!userInfo.badges?.length && userInfo.badges?.length > 0 &&
                <div className="relative flex flex-row bg-black/40 rounded-lg p-1 justify-start gap-3 px-4 flex-wrap py-2 justify-items-center">
                    {userInfo.badges.map((badge) => {
                        // 假设 URL 字段是 badge.url
                        const hasLink = !!badge.url;
                        const formatter = new Intl.DateTimeFormat('zh-CN', {
                            year: 'numeric',
                            month: '2-digit', // 或 'numeric'
                            day: '2-digit',   // 或 'numeric'
                        });
                        const formattedDate = formatter.format(new Date(badge.awarded_at));
                    // 徽章组件本身
                    const badgeImage = (
                        <Tooltip content={
                            <div className="flex flex-col items-center px-1 py-2">
                                <div>{badge.description}</div>
                                <div>{formattedDate}</div>
                            </div>
                        } key={badge.image_url}>
                            <Image
                                radius="none"
                                width="100px"
                                src={badge.image_url}
                                alt={badge.description}
                            />
                        </Tooltip>
                    );
                    if (hasLink) {
                        return (
                            <Tooltip content={
                            <div className="flex flex-col items-center px-1 py-2">
                                <div>{badge.description}</div>
                                <div>{formattedDate}</div>
                            </div>
                        } key={badge.image_url}>
                                <a
                                    key={badge.image_url}
                                    href={badge.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    // 添加 title 属性显示悬浮简介
                                    title={badge.description}
                                    className="cursor-pointer" // 链接有手形光标
                                >
                                    {badgeImage}
                                </a>
                            </Tooltip>
                        );
                }
                    // 如果没有链接，使用一个普通的 <div> 标签来容纳
                    return (
                        <div
                            key={badge.image_url}
                            // 添加 title 属性显示悬浮简介
                            title={badge.description}
                            className="cursor-default" // 非链接显示默认光标
                        >
                            {badgeImage}
                        </div>
        )})}
                </div>
            }
            <div className="relative flex flex-row bg-black/40 rounded-lg p-1 justify-between gap-6 px-4">
                <Progress label="等级" className="" classNames={{value: ""}} value={userInfo.statistics?.level.progress} showValueLabel={true}/>
                <div className="w-[50px]">
                    <UserLevel level={userInfo.statistics?.level.current || 0}/>
                </div>
            </div>
            <div className="relative flex flex-row bg-black/40 rounded-lg p-1 justify-between px-4 flex-wrap">
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
            }
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


async function getUserInfo(mode: string, username: string): Promise<User> {
  const res = await fetch(`${siteConfig.backend_url}/api/user-info?mode=${mode}&username=${username}`, {
    method: 'POST',
    credentials: 'include'
  });
  return await res.json();
}