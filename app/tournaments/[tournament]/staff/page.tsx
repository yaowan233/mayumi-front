import {Card, CardBody} from "@heroui/card";
import {Link} from "@heroui/link";
import {Avatar} from "@heroui/avatar";
import {Chip} from "@heroui/chip";
import {Divider} from "@heroui/divider";
import {siteConfig} from "@/config/site";

type ColorType = "default" | "primary" | "secondary" | "success" | "warning" | "danger";

// --- 辅助函数：根据职位分配颜色 ---
const getRoleStyle = (role: string) => {
    const r = role.toLowerCase();

    // 主办/管理 -> 金色/黄色 (Warning)
    if (r.includes("host") || r.includes("主办") || r.includes("主理人")) {
        return { color: "warning" as ColorType, bgClass: "bg-warning" };
    }
    // 管理员 -> 红色 (Danger)
    if (r.includes("admin") || r.includes("管理")) {
        return { color: "danger" as ColorType, bgClass: "bg-danger" };
    }
    // 裁判 -> 蓝色 (Primary)
    if (r.includes("referee") || r.includes("裁判")) {
        return { color: "primary" as ColorType, bgClass: "bg-primary" };
    }
    // 直播/解说/设计 -> 紫色 (Secondary)
    if (r.includes("streamer") || r.includes("直播") || r.includes("commentator") || r.includes("解说") || r.includes("design") || r.includes("设计")) {
        return { color: "secondary" as ColorType, bgClass: "bg-secondary" };
    }
    // 选图/作图/测图 -> 绿色 (Success)
    if (r.includes("mapper") || r.includes("pool") || r.includes("选图") || r.includes("作图") || r.includes("测图")) {
        return { color: "success" as ColorType, bgClass: "bg-success" };
    }

    // 默认 -> 灰色
    return { color: "default" as ColorType, bgClass: "bg-default-500" };
};

export default async function StaffPage(props: { params: Promise<{ tournament: string }> }) {
    const params = await props.params;
    let staff = await GetStaff(params.tournament);

    const validRoles = Object.keys(staff).filter((role) => staff[role].length > 0);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-black text-foreground mb-2 tracking-tight">STAFF TEAM</h1>
                <p className="text-default-500">The people behind the scenes</p>
            </div>

            <div className="grid grid-cols-1 gap-10">
                {validRoles.map((role) => {
                    // 获取对应的颜色配置
                    const { color, bgClass } = getRoleStyle(role);
                    const members = staff[role];

                    return (
                        <div key={role} className="flex flex-col gap-5">
                            {/* 职位标题栏 */}
                            <div className="flex items-center gap-4">
                                {/* 左侧竖条：使用显式的 bgClass */}
                                <div className={`h-8 w-1.5 rounded-full ${bgClass}`} />
                                <h2 className="text-2xl font-bold tracking-wider text-foreground">
                                    {role}
                                </h2>
                                <Chip size="sm" variant="flat" color={color} className="font-mono font-bold">
                                    {members.length}
                                </Chip>
                                <Divider className="flex-1 opacity-50" />
                            </div>

                            {/* 成员网格 */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {members.map((member) => (
                                    <StaffCard
                                        key={member.uid}
                                        member={member}
                                        color={color} // 传给 HeroUI 组件
                                        bgClass={bgClass} // 传给自定义背景
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// --- 子组件 ---
const StaffCard = ({member, color, bgClass}: {member: {name: string, uid: string}, color: ColorType, bgClass: string}) => {
    return (
        <Link
            href={`https://osu.ppy.sh/users/${member.uid}`}
            isExternal
            className="w-full"
        >
            <Card
                className="w-full border border-white/5 bg-content1/50 hover:bg-content1 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
                shadow="sm"
            >
                <CardBody className="flex flex-col items-center justify-center gap-3 py-6 overflow-hidden relative">

                    {/* 背景装饰光晕: 使用 bgClass 代替之前的插值，确保颜色生效 */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${bgClass}`} />

                    <Avatar
                        src={`https://a.ppy.sh/${member.uid}`}
                        className="w-20 h-20 text-large border-4 border-content2 group-hover:scale-110 transition-transform duration-300 z-10"
                        isBordered
                        color={color} // Avatar 直接支持 color 属性
                    />

                    <div className="flex flex-col items-center z-10">
                        <span className="font-bold text-foreground text-center line-clamp-1 px-2 group-hover:text-primary transition-colors">
                            {member.name}
                        </span>
                    </div>
                </CardBody>
            </Card>
        </Link>
    )
}

// --- 数据获取与类型定义 (保持不变) ---
async function GetStaff(tournament: string): Promise<Staff> {
    const res = await fetch(siteConfig.backend_url + '/api/staff' +
        '?tournament_name=' + tournament,
        {next: {revalidate: 0}})
    if (!res.ok) {
        throw new Error('Failed to fetch data')
    }
    return await res.json()
}

interface Staff {
    [role: string]: {
        name: string,
        uid: string,
    }[]
}