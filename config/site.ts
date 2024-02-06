export type SiteConfig = typeof siteConfig;

export const siteConfig = {
	name: "Next.js + NextUI",
	backend_url: "http://10.253.2.72:8421",
	web_url: "http://localhost:3000",
	description: "Make beautiful websites regardless of your design experience.",
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
		github: "https://github.com/nextui-org/nextui",
		twitter: "https://twitter.com/getnextui",
		docs: "https://nextui.org",
		discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev"
	},
};
