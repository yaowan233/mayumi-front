export type SiteConfig = typeof siteConfig;

export const siteConfig = {
	name: "Mayumi",
	backend_url: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8421",
	web_url: process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000",
	client_id: process.env.NEXT_PUBLIC_CLIENT_ID || "",
	client_secret: process.env.CLIENT_SECRET || "",
	description: "一站式OSU比赛管理网站",
	navItems: [
		{
			label: "主页",
			href: "/",
		},
    {
      label: "比赛管理",
      href: "/tournament-management",
    },
    {
      label: "关于",
      href: "/about",
    }
	],
	tournamentNavItems: [
		{
			label: "比赛主页",
			href: "/home",
		},
		{
			label: "规则",
			href: "/rules",
		},
		{
			label: "时间安排",
			href: "/schedule",
		},
		{
			label: "图池",
			href: "/mappools",
		},
		{
			label: "参赛成员",
			href: "/participants",
		},
		{
			label: "数据统计",
			href: "/stats",
		},
		{
			label: "工作人员",
			href: "/staff",
		}
	],
	navMenuItems: [
		{
			label: "主页",
			href: "/profile",
		},
		{
			label: "比赛主页",
			href: "/home",
		},
		{
			label: "规则",
			href: "/rules",
		},
		{
			label: "时间安排",
			href: "/schedule",
		},
		{
			label: "图池",
			href: "/mappools",
		},
		{
			label: "参赛成员",
			href: "/participants",
		},
		{
			label: "数据统计",
			href: "/stats",
		},
		{
			label: "工作人员",
			href: "/staff",
		},
	],
	links: {
		github: "https://github.com/yaowan233",
		twitter: "https://twitter.com/getnextui",
		docs: "https://nextui.org",
		discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://afdian.com/a/mayumi-xyz"
	},
};
