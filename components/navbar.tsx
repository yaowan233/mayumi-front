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
import { Link } from "@heroui/link";
import { siteConfig } from "@/config/site";
import NextLink from "next/link";
import clsx from "clsx";
import { ThemeSwitch } from "@/components/theme-switch";
import {GithubIcon, Logo} from "@/components/icons";
import { useEffect, useState } from "react";
import { Progress } from "@heroui/progress";
import { usePathname } from "next/navigation";
import { UserStatus } from "@/components/navbar_common";
import { Divider } from "@heroui/divider";


const NavBrand = ({ onClick }: { onClick?: () => void }) => (
    <NavbarBrand as="li" className="gap-4 max-w-fit">
        <NextLink className="flex justify-start items-center gap-2" href="/" onClick={onClick}>
            <Logo className="text-primary w-8 h-8" />
            <p className="font-black text-inherit text-xl tracking-tight">Mayumi</p>
        </NextLink>
    </NavbarBrand>
);

const NavLinkItem = ({ item, isActive, onClick }: { item: { href: string; label: string }, isActive: boolean, onClick: () => void }) => (
    <NavbarItem isActive={isActive}>
        <NextLink
            className={clsx(
                "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 block", // 基础样式：有内边距和圆角
                isActive
                    ? "bg-primary/10 text-primary font-bold" // 选中：背景色 + 高亮字
                    : "text-default-600 hover:text-foreground hover:bg-default-100 dark:hover:bg-white/5" // 未选中：悬停背景
            )}
            color="foreground"
            href={item.href}
            onClick={onClick}
        >
            {item.label}
        </NextLink>
    </NavbarItem>
);

const NavProgress = ({ isLoading }: { isLoading: boolean }) => (
    isLoading ? (
        <Progress
            size="sm"
            isIndeterminate
            aria-label="Loading..."
            classNames={{
                base: "fixed top-0 left-0 right-0 z-[99999] h-1",
                track: "bg-transparent",
                indicator: "bg-primary shadow-[0_0_10px_#006FEE]"
            }}
        />
    ) : null
);

export const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setIsLoading(false);
        setIsMenuOpen(false);
    }, [pathname]);

    const handleNavClick = (href: string) => {
        if (href !== pathname) setIsLoading(true);
    };

    return (
        <NextUINavbar maxWidth="xl" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}
            className="bg-background/70 backdrop-blur-md border-b border-default-100 dark:border-white/5"
        >
            <NavProgress isLoading={isLoading} />

            <NavbarContent className="basis-1/5 sm:basis-full gap-4" justify="start">
                <NavbarMenuToggle className="sm:hidden" />
                <NavBrand onClick={() => handleNavClick("/")} />

                <ul className="hidden sm:flex gap-1 justify-start ml-2 items-center h-full">
                    <li className="h-6 w-[1px] bg-default-300 dark:bg-white/20 mr-4"></li>
                    {siteConfig.navItems.map((item) => (
                        <NavLinkItem
                            key={item.href}
                            item={item}
                            isActive={pathname === item.href}
                            onClick={() => handleNavClick(item.href)}
                        />
                    ))}
                </ul>
            </NavbarContent>

            <NavbarContent className="basis-1 gap-4" justify="end">
                 <Link isExternal href={siteConfig.links.github} aria-label="Github">
                    <GithubIcon className="text-default-500 hover:text-foreground transition-colors"/>
                </Link>
                <ThemeSwitch />
                <UserStatus />
            </NavbarContent>

            <NavbarMenu>
                <div className="mx-2 mt-2 flex flex-col gap-2">
                    {siteConfig.navItems.map((item, index) => (
                        <NavbarMenuItem key={`${item.href}-${index}`}>
                            <Link
                                className={clsx(
                        "w-full justify-start px-2 py-1 rounded-lg",
                        pathname === item.href
                            ? "font-black bg-primary/10" // 选中样式
                            : "font-medium hover:bg-default-100" // 未选中样式（可选：加个hover背景）
                    )}
                                color={pathname === item.href ? "primary" : "foreground"}
                                href={item.href}
                                size="lg"
                                onPress={() => handleNavClick(item.href)}
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

export const TournamentNavbar = ({tournament_name}: { tournament_name: string }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const tournament_href_start = "/tournaments/" + tournament_name;
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setIsLoading(false);
        setIsMenuOpen(false);
    }, [pathname]);

    const handleNavClick = (href: string) => {
        if (href !== pathname) setIsLoading(true);
    };

    return (
        <NextUINavbar maxWidth="xl" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}
            className="bg-background/70 backdrop-blur-md border-b border-default-100 dark:border-white/5"
        >
            <NavProgress isLoading={isLoading} />

            <NavbarContent className="basis-1/5 sm:basis-full gap-4" justify="start">
                <NavbarMenuToggle className="lg:hidden" />
                <NavBrand onClick={() => handleNavClick("/")} />

                <ul className="hidden lg:flex gap-1 justify-start ml-2 items-center h-full">
                    {siteConfig.tournamentNavItems.map((item) => {
                        const targetUrl = `${tournament_href_start}${item.href}`;
                        return (
                            <NavLinkItem
                                key={targetUrl}
                                item={{...item, href: targetUrl}}
                                isActive={pathname === targetUrl}
                                onClick={() => handleNavClick(targetUrl)}
                            />
                        )
                    })}
                </ul>
            </NavbarContent>
            <NavbarContent className="basis-1 gap-4" justify="end">
                 <Link isExternal href={siteConfig.links.github} aria-label="Github">
                    <GithubIcon className="text-default-500 hover:text-foreground transition-colors"/>
                </Link>
                <ThemeSwitch />
                <UserStatus />
            </NavbarContent>

            <NavbarMenu>
                <div className="mx-2 mt-2 flex flex-col gap-2">
                    <NavbarMenuItem>
                        <Link href="/" color="secondary" size="lg" onPress={() => setIsMenuOpen(false)}>
                            ← 返回首页
                        </Link>
                    </NavbarMenuItem>
                    <Divider className="my-2"/>
                    <div className="text-xs font-bold text-default-400 uppercase tracking-widest px-4">
                        {decodeURIComponent(tournament_name)}
                    </div>
                    {siteConfig.tournamentNavItems.map((item, index) => {
                         const targetUrl = `${tournament_href_start}${item.href}`;
                         const isActive = pathname === targetUrl;
                         return (
                            <NavbarMenuItem key={`${item}-${index}`}>
                                <Link
                                    color={isActive ? "primary" : "foreground"}
                                    href={targetUrl}
                                    size="lg"
                                    className={clsx(
                            "w-full justify-start px-2 py-1 rounded-lg",
                            isActive
                                ? "font-black bg-primary/10"
                                : "font-medium"
                        )}
                                    onPress={() => {
                                        setIsMenuOpen(false);
                                        handleNavClick(targetUrl);
                                    }}
                                >
                                    {item.label}
                                </Link>
                            </NavbarMenuItem>
                        )
                    })}
                </div>
            </NavbarMenu>
        </NextUINavbar>
    );
};