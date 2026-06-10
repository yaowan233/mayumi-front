import {Avatar, Card, Chip, Separator} from "@heroui/react";
import {siteConfig} from "@/config/site";

type ColorType = "default" | "primary" | "secondary" | "success" | "warning" | "danger";

const getInitials = (name?: string) => (name || "?").trim().slice(0, 2).toUpperCase();

const roleToneClass: Record<ColorType, { chip: string; ring: string; bar: string; glow: string; text: string }> = {
    default: {
        chip: "bg-default/70 text-default-foreground",
        ring: "ring-default",
        bar: "bg-default-500",
        glow: "bg-default-500/20",
        text: "group-hover:text-default-foreground",
    },
    primary: {
        chip: "bg-primary/15 text-primary",
        ring: "ring-primary",
        bar: "bg-primary",
        glow: "bg-primary/20",
        text: "group-hover:text-primary dark:group-hover:text-primary",
    },
    secondary: {
        chip: "bg-secondary/15 text-secondary",
        ring: "ring-secondary",
        bar: "bg-secondary",
        glow: "bg-secondary/20",
        text: "group-hover:text-secondary dark:group-hover:text-secondary",
    },
    success: {
        chip: "bg-success/15 text-success",
        ring: "ring-success",
        bar: "bg-success",
        glow: "bg-success/20",
        text: "group-hover:text-success dark:group-hover:text-success",
    },
    warning: {
        chip: "bg-warning/15 text-warning",
        ring: "ring-warning",
        bar: "bg-warning",
        glow: "bg-warning/20",
        text: "group-hover:text-warning dark:group-hover:text-warning",
    },
    danger: {
        chip: "bg-danger/15 text-danger",
        ring: "ring-danger",
        bar: "bg-danger",
        glow: "bg-danger/20",
        text: "group-hover:text-danger dark:group-hover:text-danger",
    },
};

const getRoleStyle = (role: string) => {
    const r = role.toLowerCase();

    if (r.includes("host") || r.includes("主办") || r.includes("主理人")) {
        return "warning" as ColorType;
    }
    if (r.includes("admin") || r.includes("管理")) {
        return "danger" as ColorType;
    }
    if (r.includes("referee") || r.includes("裁判")) {
        return "primary" as ColorType;
    }
    if (r.includes("streamer") || r.includes("直播") || r.includes("commentator") || r.includes("解说") || r.includes("design") || r.includes("设计")) {
        return "secondary" as ColorType;
    }
    if (r.includes("mapper") || r.includes("pool") || r.includes("选图") || r.includes("作图") || r.includes("测图")) {
        return "success" as ColorType;
    }

    return "default" as ColorType;
};

export default async function StaffPage(props: { params: Promise<{ tournament: string }> }) {
    const params = await props.params;
    const staff = await GetStaff(params.tournament);
    const validRoles = Object.keys(staff).filter((role) => staff[role].length > 0);

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8">
            <div className="mb-4 border-b border-zinc-200 pb-8 text-center dark:border-white/[0.08]">
                <h1 className="mb-2 text-4xl font-black tracking-tight text-foreground">STAFF TEAM</h1>
                <p className="text-sm font-medium text-default-500">The people behind the scenes</p>
            </div>

            <div className="grid grid-cols-1 gap-12">
                {validRoles.map((role) => {
                    const color = getRoleStyle(role);
                    const tone = roleToneClass[color];
                    const members = staff[role];

                    return (
                        <section key={role} className="flex flex-col gap-5">
                            <div className="flex items-center gap-3 border-b border-zinc-200 pb-3 dark:border-white/[0.08]">
                                <div className={`h-7 w-1.5 rounded-full shadow-sm ${tone.bar}`} />
                                <h2 className="text-xl font-black tracking-wide text-foreground sm:text-2xl">
                                    {role}
                                </h2>
                                <Chip size="sm" className={`font-mono font-bold ${tone.chip}`}>
                                    <span>{members.length}</span>
                                </Chip>
                                <Separator className="ml-1 flex-1 opacity-40" />
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                {members.map((member) => (
                                    <StaffCard key={member.uid} member={member} color={color} />
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}

const StaffCard = ({member, color}: { member: { name: string; uid: string }; color: ColorType }) => {
    const tone = roleToneClass[color];

    return (
        <a
            href={`https://osu.ppy.sh/users/${member.uid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full no-underline"
        >
            <Card
                variant="transparent"
                className="group relative isolate w-full !p-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-zinc-50 hover:shadow-[0_14px_30px_rgba(15,23,42,0.11)] dark:border-white/[0.08] dark:bg-zinc-900/80 dark:shadow-[0_10px_24px_rgba(0,0,0,0.22)] dark:hover:bg-zinc-800/90 dark:hover:shadow-[0_14px_30px_rgba(0,0,0,0.34)]"
            >
                <Card.Content className="relative flex flex-col items-center justify-center gap-3 overflow-hidden !px-3 !py-5">
                    <div className={`absolute inset-x-0 bottom-0 h-1 ${tone.bar}`} />
                    <div className={`absolute -top-10 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-80 ${tone.glow}`} />

                    <Avatar className={`z-10 h-20 w-20 text-large ring-4 ring-offset-2 ring-offset-background transition-transform duration-300 group-hover:scale-105 ${tone.ring}`}>
                        <Avatar.Image className="h-full w-full object-cover" src={`https://a.ppy.sh/${member.uid}`} alt={member.name}/>
                        <Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
                    </Avatar>

                    <div className="z-10 flex flex-col items-center">
                        <span className={`line-clamp-1 px-2 text-center font-bold text-foreground transition-colors ${tone.text}`}>
                            {member.name}
                        </span>
                    </div>
                </Card.Content>
            </Card>
        </a>
    );
};

async function GetStaff(tournament: string): Promise<Staff> {
    const res = await fetch(
        `${siteConfig.backend_url}/api/staff?tournament_name=${encodeURIComponent(tournament)}`,
        {next: {revalidate: 0}},
    );

    if (!res.ok) {
        throw new Error("Failed to fetch data");
    }

    return await res.json();
}

interface Staff {
    [role: string]: {
        name: string;
        uid: string;
    }[];
}
