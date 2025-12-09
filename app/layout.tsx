import "@/styles/globals.css";
import {Metadata, Viewport} from "next";
import {siteConfig} from "@/config/site";
import {fontSans} from "@/config/fonts";
import {Providers} from "./providers";
import {Link} from "@heroui/link";
import clsx from "clsx";
import {UserProvider} from "@/app/user_context";
import React from "react";

export const metadata: Metadata = {
    title: {
        default: siteConfig.name,
        template: `%s - ${siteConfig.name}`,
    },
    description: siteConfig.description,
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon-16x16.png",
    },
};

export const viewport: Viewport = {
    themeColor: [
        {media: "(prefers-color-scheme: light)", color: "white"},
        {media: "(prefers-color-scheme: dark)", color: "black"},
    ],
}
export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh" suppressHydrationWarning>
        <head><title>Mayumi</title></head>
        <body
            className={clsx(
                "min-h-screen bg-background font-sans antialiased",
                fontSans.variable
            )}
        >
        <Providers themeProps={{attribute: "class", defaultTheme: "dark", children}}>
            <UserProvider>
                <div className="w-full relative flex flex-col min-h-screen">
                    {children}
                    <footer className="w-full flex flex-col items-center justify-center py-3">
                        <Link
                            isExternal
                            className="flex items-center gap-1 text-current"
                            href="https://osu.ppy.sh/users/3162675"
                            title="yaowan233 OSU主页"
                        >
                            <span className="text-default-600">Coded by</span>
                            <p className="text-primary">yaowan233</p>
                        </Link>
                        <Link
                            isExternal
                            className="flex items-center gap-1 text-current"
                            href="https://heroui.com?utm_source=next-app-template"
                            title="heroui.com homepage"
                        >
                            <span className="text-default-600">Powered by</span>
                            <p className="text-primary">HeroUI</p>
                        </Link>
                    </footer>
                </div>
            </UserProvider>
        </Providers>
        </body>
        </html>
    );
}
