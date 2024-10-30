"use client"

import {
	Navbar as NextUINavbar,
	NavbarContent,
	NavbarMenu,
	NavbarMenuToggle,
	NavbarBrand,
	NavbarItem,
	NavbarMenuItem,
} from "@nextui-org/navbar";
import { Button } from "@nextui-org/button";
import { Link } from "@nextui-org/link";

import { link as linkStyles } from "@nextui-org/theme";

import { siteConfig } from "@/config/site";
import NextLink from "next/link";
import clsx from "clsx";

import { ThemeSwitch } from "@/components/theme-switch";
import {
	GithubIcon,
	HeartFilledIcon,
} from "@/components/icons";

import { Logo } from "@/components/icons";
import {useContext, useState} from "react";
import CurrentUserContext from "@/app/user_context";
import {Avatar} from "@nextui-org/avatar";
import {Dropdown, DropdownItem, DropdownMenu, DropdownTrigger} from "@nextui-org/dropdown";

export const Navbar = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	return (
		<NextUINavbar maxWidth="full" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen} className="">
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
						<Link href="/" size="lg" color="foreground" onClick={() => {
							setIsMenuOpen(false); // 点击菜单项后关闭菜单
						}}>
							主页
						</Link>
					</NavbarMenuItem>
					<NavbarMenuItem>
						<Link href={"/tournament-management"} size="lg" color="foreground" onClick={() => {
							setIsMenuOpen(false); // 点击菜单项后关闭菜单
						}}>
							赛事管理
						</Link>
					</NavbarMenuItem>
					<NavbarMenuItem>
						<Link href={"/about"} size="lg" color="foreground" onClick={() => {
							setIsMenuOpen(false); // 点击菜单项后关闭菜单
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
	return (
		<NextUINavbar maxWidth="full" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
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
								onClick={() => {
									setIsMenuOpen(false); // 点击菜单项后关闭菜单
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
