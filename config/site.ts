export type SiteConfig = typeof siteConfig;

export const siteConfig = {
	name: "Mayumi",
	backend_url: "https://mayumi.xyz",
	web_url: "https://mayumi.xyz",
	client_id: "28516",
	client_secret: "wCbkMYjnW0GCjdc6Dw7e11M7KpIOHBi9b8xOyAKx",
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
    sponsor: ""
	},
};
