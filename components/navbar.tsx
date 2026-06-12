"use client";

import clsx from "clsx";
import NextLink from "next/link";
import {usePathname} from "next/navigation";
import {useState} from "react";

import {GithubIcon, Logo} from "@/components/icons";
import {ThemeSwitch} from "@/components/theme-switch";
import {UserStatus} from "@/components/navbar_common";
import {siteConfig} from "@/config/site";

type NavItem = {
    href: string;
    label: string;
};

const navShellClass =
    "fixed inset-x-0 top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/70 dark:border-white/[0.08] dark:bg-black/85 dark:supports-[backdrop-filter]:bg-black/70";

const contentClass = "mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8";

const NavProgress = ({isLoading}: { isLoading: boolean }) => (
    isLoading ? (
        <div className="fixed inset-x-0 top-0 z-[99999] h-1 overflow-hidden bg-transparent">
            <div className="h-full w-1/3 animate-[nav-loading_1.1s_ease-in-out_infinite] bg-primary shadow-[0_0_10px_#006FEE]" />
        </div>
    ) : null
);

const NavBrand = ({onClick}: { onClick?: () => void }) => (
    <NextLink className="flex shrink-0 items-center gap-2" href="/" onClick={onClick}>
        <Logo className="h-8 w-8 text-primary"/>
        <span className="text-xl font-black tracking-normal text-zinc-950 dark:text-white">Mayumi</span>
    </NextLink>
);

const DesktopNavLink = ({item, active, onClick}: { item: NavItem; active: boolean; onClick: () => void }) => (
    <NextLink
        className={clsx(
            "rounded-md px-3 py-2 text-sm font-bold transition-colors",
            active
                ? "bg-primary/15 text-primary"
                : "text-zinc-800 hover:bg-zinc-900/[0.06] hover:text-zinc-950 dark:text-zinc-100 dark:hover:bg-white/[0.06] dark:hover:text-white"
        )}
        href={item.href}
        onClick={onClick}
    >
        {item.label}
    </NextLink>
);

const MobileMenuButton = ({open, onClick}: { open: boolean; onClick: () => void }) => (
    <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-800 transition-all duration-150 hover:bg-zinc-900/[0.06] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 dark:text-zinc-100 dark:hover:bg-white/[0.06] sm:hidden"
        onClick={onClick}
    >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <span className="flex flex-col gap-1.5">
            <span className={clsx("block h-0.5 w-5 rounded bg-current transition-transform", open && "translate-y-2 rotate-45")}/>
            <span className={clsx("block h-0.5 w-5 rounded bg-current transition-opacity", open && "opacity-0")}/>
            <span className={clsx("block h-0.5 w-5 rounded bg-current transition-transform", open && "-translate-y-2 -rotate-45")}/>
        </span>
    </button>
);

const MobileMenu = ({
    open,
    items,
    pathname,
    onClick,
    children,
}: {
    open: boolean;
    items: NavItem[];
    pathname: string;
    onClick: (href: string) => void;
    children?: React.ReactNode;
}) => {
    if (!open) return null;

    return (
        <div className="border-t border-zinc-200/80 bg-white/95 px-4 py-4 shadow-2xl dark:border-white/[0.08] dark:bg-black/95 sm:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
                {children}
                {items.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <NextLink
                            key={item.href}
                            className={clsx(
                                "rounded-lg px-3 py-2 text-base font-bold transition-colors",
                                active ? "bg-primary/15 text-primary" : "text-zinc-800 hover:bg-zinc-900/[0.06] dark:text-zinc-100 dark:hover:bg-white/[0.06]"
                            )}
                            href={item.href}
                            onClick={() => onClick(item.href)}
                        >
                            {item.label}
                        </NextLink>
                    );
                })}
            </div>
        </div>
    );
};

export const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [pendingPath, setPendingPath] = useState<string | null>(null);
    const pathname = usePathname();
    const isLoading = pendingPath !== null && pendingPath !== pathname;

    const handleNavClick = (href: string) => {
        setIsMenuOpen(false);
        setPendingPath(href === pathname ? null : href);
    };

    return (
        <nav className={navShellClass}>
            <NavProgress isLoading={isLoading}/>
            <div className={contentClass}>
                <div className="flex min-w-0 items-center gap-4">
                    <MobileMenuButton open={isMenuOpen} onClick={() => setIsMenuOpen((value) => !value)}/>
                    <NavBrand onClick={() => handleNavClick("/")}/>
                    <div className="hidden h-6 w-px bg-zinc-300 dark:bg-white/20 sm:block"/>
                    <div className="hidden items-center gap-1 sm:flex">
                        {siteConfig.navItems.map((item) => (
                            <DesktopNavLink
                                key={item.href}
                                item={item}
                                active={pathname === item.href}
                                onClick={() => handleNavClick(item.href)}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                    <a
                        href={siteConfig.links.github}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Github"
                        className="text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                    >
                        <GithubIcon/>
                    </a>
                    <ThemeSwitch/>
                    <UserStatus/>
                </div>
            </div>
            <MobileMenu
                open={isMenuOpen}
                items={siteConfig.navItems}
                pathname={pathname}
                onClick={handleNavClick}
            />
        </nav>
    );
};

export const TournamentNavbar = ({tournament_name}: { tournament_name: string }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [pendingPath, setPendingPath] = useState<string | null>(null);
    const pathname = usePathname();
    const tournamentHrefStart = `/tournaments/${tournament_name}`;
    const isLoading = pendingPath !== null && pendingPath !== pathname;

    const items = siteConfig.tournamentNavItems.map((item) => ({
        ...item,
        href: `${tournamentHrefStart}${item.href}`,
    }));

    const handleNavClick = (href: string) => {
        setIsMenuOpen(false);
        setPendingPath(href === pathname ? null : href);
    };

    return (
        <nav className={navShellClass}>
            <NavProgress isLoading={isLoading}/>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            <div className="pointer-events-none absolute left-1/2 top-0 h-16 w-72 -translate-x-1/2 bg-primary/10 blur-3xl" />
            <div className={contentClass}>
                <div className="flex min-w-0 items-center gap-4">
                    <MobileMenuButton open={isMenuOpen} onClick={() => setIsMenuOpen((value) => !value)}/>
                    <NavBrand onClick={() => handleNavClick("/")}/>
                    <div className="hidden items-center gap-1 lg:flex">
                        {items.map((item) => (
                            <DesktopNavLink
                                key={item.href}
                                item={item}
                                active={pathname === item.href}
                                onClick={() => handleNavClick(item.href)}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                    <a
                        href={siteConfig.links.github}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Github"
                        className="text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                    >
                        <GithubIcon/>
                    </a>
                    <ThemeSwitch/>
                    <UserStatus/>
                </div>
            </div>
            <MobileMenu open={isMenuOpen} items={items} pathname={pathname} onClick={handleNavClick}>
                <NextLink
                    className="rounded-lg px-3 py-2 text-base font-bold text-primary hover:bg-primary/10"
                    href="/"
                    onClick={() => handleNavClick("/")}
                >
                    返回首页
                </NextLink>
                <div className="my-2 h-px bg-white/[0.08]"/>
                <div className="px-3 pb-1 text-xs font-bold uppercase tracking-widest text-zinc-500">
                    {decodeURIComponent(tournament_name)}
                </div>
            </MobileMenu>
        </nav>
    );
};
