"use client"

import {
	Navbar as NextUINavbar,
	NavbarContent,
	NavbarMenu,
	NavbarMenuToggle,
	NavbarBrand,
	NavbarItem,
	NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";

import { link as linkStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import NextLink from "next/link";
import clsx from "clsx";

import { ThemeSwitch } from "@/components/theme-switch";
import {
	GithubIcon,
	HeartFilledIcon,
} from "@/components/icons";

import { Logo } from "@/components/icons";
import {useContext, useEffect, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {Avatar} from "@heroui/avatar";
import {Dropdown, DropdownItem, DropdownMenu, DropdownTrigger} from "@heroui/dropdown";
import {Progress} from "@heroui/progress";
import {usePathname} from "next/navigation";


export const Navbar = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false); // 控制加载状态
	const pathname = usePathname();  // 路由变化时获取 pathname

	useEffect(() => {
		// 在路径发生变化时，启动加载进度条
		setIsLoading(true);

		// 模拟加载结束（在路由切换完成后消失）
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 100);

		// 清理定时器
		return () => clearTimeout(timer);
	}, [pathname]);  // 依赖项为 pathname，当路径名变化时会触发 effect
	return (
		<NextUINavbar maxWidth="full" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen} className="">
			{isLoading && (
				<div className="fixed top-0 left-0 w-full z-50 bg-white shadow-lg">
					<Progress size="sm" isIndeterminate aria-label="Loading..." />
				</div>
			)}
			<NavbarContent className="basis-1/5 sm:basis-full" justify="start">
				<NavbarMenuToggle className="flex sm:hidden"/>
				<NavbarBrand as="li" className="hidden sm:flex gap-3 max-w-fit">
					<NextLink className="flex justify-start items-center gap-1" href="/">
						<Logo />
						<p className="font-bold text-inherit">Mayumi</p>
					</NextLink>
				</NavbarBrand>
				<ul className="hidden sm:flex gap-4 justify-start ml-2">
					{siteConfig.navItems.map((item) => (
						<NavbarItem key={item.href}>
							<NextLink
								className={clsx(
									linkStyles({ color: "foreground" }),
									"data-[active=true]:text-primary data-[active=true]:font-medium"
								)}
								color="foreground"
								href={item.href}
								onClick={() => {
									setIsMenuOpen(false); // 点击菜单项后关闭菜单
									setIsLoading(true); // 点击菜单项后开始加载
								}}
							>
								{item.label}
							</NextLink>
						</NavbarItem>
					))}
				</ul>
			</NavbarContent>

			<NavbarContent
				className="hidden sm:flex basis-1/5 sm:basis-full"
				justify="end"
			>
				<NavbarItem className="hidden sm:flex gap-2">
					{/*<Link isExternal href={siteConfig.links.twitter} aria-label="Twitter">*/}
					{/*	<TwitterIcon className="text-default-500" />*/}
					{/*</Link>*/}
					{/*<Link isExternal href={siteConfig.links.discord} aria-label="Discord">*/}
					{/*	<DiscordIcon className="text-default-500" />*/}
					{/*</Link>*/}
					<Link isExternal href={siteConfig.links.github} aria-label="Github">
						<GithubIcon className="text-default-500" />
					</Link>
					<ThemeSwitch />
				</NavbarItem>
				{/*<NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>*/}
				<NavbarItem className="hidden md:flex">
					<Button
            			isExternal
						as={Link}
						className="text-sm font-normal text-default-600 bg-default-100"
						href={siteConfig.links.sponsor}
						startContent={<HeartFilledIcon className="text-danger" />}
						variant="flat"
					>
						爱发电
					</Button>
				</NavbarItem>
			</NavbarContent>

			<NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
				<Link isExternal href={siteConfig.links.github} aria-label="Github">
					<GithubIcon className="text-default-500" />
				</Link>
				<ThemeSwitch />
			</NavbarContent>
			<UserStatus/>

			<NavbarMenu>
				{/*{searchInput}*/}
				<div className="mx-4 mt-2 flex flex-col gap-2">
					<NavbarMenuItem>
						<Link href="/" size="lg" color="foreground" onPress={() => {
							setIsMenuOpen(false); // 点击菜单项后关闭菜单
							setIsLoading(true); // 点击菜单项后开始加载
						}}>
							主页
						</Link>
					</NavbarMenuItem>
					<NavbarMenuItem>
						<Link href={"/tournament-management"} size="lg" color="foreground" onPress={() => {
							setIsMenuOpen(false); // 点击菜单项后关闭菜单
							setIsLoading(true); // 点击菜单项后开始加载
						}}>
							赛事管理
						</Link>
					</NavbarMenuItem>
					<NavbarMenuItem>
						<Link href={"/about"} size="lg" color="foreground" onPress={() => {
							setIsMenuOpen(false); // 点击菜单项后关闭菜单
							setIsLoading(true); // 点击菜单项后开始加载
						}}>
							关于
						</Link>
					</NavbarMenuItem>
				</div>
			</NavbarMenu>
		</NextUINavbar>
	);
};


export const TournamentNavbar = ({ tournament_name }: { tournament_name: string }) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	let tournament_href_start = "/tournaments/" + tournament_name
	const [isLoading, setIsLoading] = useState(false); // 控制加载状态
	const pathname = usePathname(); // 获取当前路径名

	useEffect(() => {
		// 在路径发生变化时，启动加载进度条
		setIsLoading(true);

		// 模拟加载结束（在路由切换完成后消失）
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 100);

		// 清理定时器
		return () => clearTimeout(timer);
	}, [pathname]);  // 依赖项为 pathname，当路径名变化时会触发 effect
	return (
		<NextUINavbar maxWidth="full" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
			{isLoading && (
				<div className="fixed top-0 left-0 w-full z-50 bg-white shadow-lg">
					<Progress size="sm" isIndeterminate aria-label="Loading..." />
				</div>
			)}
			<NavbarContent className="basis-1/5 sm:basis-full" justify="start">
				<NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} className="md:hidden" />
				<NavbarBrand as="li" className="gap-3 max-w-fit">
					<NextLink className="hidden sm:flex justify-start items-center gap-1" href="/">
						<Logo />
						<p className="font-bold text-inherit">Mayumi</p>
					</NextLink>
				</NavbarBrand>
				<ul className="hidden md:flex gap-4 justify-start ml-2">
					{siteConfig.tournamentNavItems.map((item) => (
						<NavbarItem key={`${tournament_href_start}${item.href}`}>
							<NextLink
								className={clsx(
									linkStyles({ color: "foreground" }),
									"data-[active=true]:text-primary data-[active=true]:font-medium"
								)}
								color="foreground"
								href={`${tournament_href_start}${item.href}`}
								onClick={() => {
									setIsLoading(true); // 点击菜单项后开始加载
								}}
							>
								{item.label}
							</NextLink>
						</NavbarItem>
					))}
				</ul>
			</NavbarContent>

			<NavbarContent
				className="hidden sm:flex basis-1/5 sm:basis-full"
				justify="end"
			>
				<NavbarItem className="hidden sm:flex gap-2">
					<Link isExternal href={siteConfig.links.github} aria-label="Github">
						<GithubIcon className="text-default-500" />
					</Link>
					<ThemeSwitch />
				</NavbarItem>
				<NavbarItem className="hidden lg:flex">
					<Button
						isExternal
						as={Link}
						className="text-sm font-normal text-default-600 bg-default-100"
						href={siteConfig.links.sponsor}
						startContent={<HeartFilledIcon className="text-danger" />}
						variant="flat"
					>
						爱发电
					</Button>
				</NavbarItem>
			</NavbarContent>

			<NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
				<Link isExternal href={siteConfig.links.github} aria-label="Github">
					<GithubIcon className="text-default-500" />
				</Link>
				<ThemeSwitch />
			</NavbarContent>
			<UserStatus/>

			<NavbarMenu>
				<div className="mx-4 mt-2 flex flex-col gap-2">
					{siteConfig.navMenuItems.map((item, index) => (
						<NavbarMenuItem key={`${item}-${index}`}>
							<Link
								color="foreground"
								href={
									index === 0
										? "/"
										: `${tournament_href_start}${item.href}`
								}
								size="lg"
								onPress={() => {
									setIsMenuOpen(false); // 点击菜单项后关闭菜单
									setIsLoading(true); // 点击菜单项后开始加载
								}}
							>
								{item.label}
							</Link>
						</NavbarMenuItem>
					))}
				</div>
			</NavbarMenu>
		</NextUINavbar>
	);
};

export const UserStatus = () => {
	const currentUser  = useContext(CurrentUserContext);
	return (
		currentUser?.currentUser != null ?
			<Dropdown>
				<DropdownTrigger>
					<Avatar as="button" src={`https://a.ppy.sh/${currentUser.currentUser?.uid}`} />
				</DropdownTrigger>
				<DropdownMenu aria-label="Static Actions">
					{/*<DropdownItem key="new">New file</DropdownItem>*/}
					<DropdownItem key="logout" className="text-danger" color="danger" onPress={async () => {
						await fetch(siteConfig.backend_url + "/api/logout", {method: "POST", credentials: "include"})
						currentUser?.setCurrentUser(null)
					}}>
						登出
					</DropdownItem>
				</DropdownMenu>
			</Dropdown>
			: LoginButton()
	)
}


const LoginButton = () => {
	return (
		<NavbarItem>
			<Button
				as={Link}
				className="text-sm font-normal"
				href={`https://osu.ppy.sh/oauth/authorize?client_id=${siteConfig.client_id}&redirect_uri=${siteConfig.web_url}/oauth&response_type=code&scope=public`}
				color="primary"
			>
				登录
			</Button>
		</NavbarItem>
	)
}
