import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Providers } from "./providers";
import { Link } from "@heroui/link";
import clsx from "clsx";
import { UserProvider } from "@/app/user_context";
import React from "react";

// 1. 配置 Metadata (SEO & 社交分享)
export const metadata: Metadata = {
    // 设置基础 URL，解决 OG Image 相对路径问题
    metadataBase: new URL(siteConfig.web_url),

    title: {
        default: siteConfig.name,
        template: `%s - ${siteConfig.name}`,
    },
    description: siteConfig.description,

    keywords: ["osu", "tournament", "mania", "catch", "taiko", "mayumi", "manager"],

    authors: [
        {
            name: "yaowan233",
            url: "https://github.com/yaowan233",
        },
    ],

    // 图标设置
    // Next.js 会自动识别 app/favicon.ico 和 app/icon.png
    // 这里显式声明是为了保险
    icons: {
        icon: "/favicon.ico",
        apple: "/apple-icon.png", // 对应你 public 或 app 下的文件
    },

    // OpenGraph (Discord/QQ 分享预览)
    openGraph: {
        type: "website",
        locale: "zh_CN",
        url: siteConfig.web_url,
        title: siteConfig.name,
        description: siteConfig.description,
        siteName: siteConfig.name,
        // 如果你有 public/og-image.png，可以在这里配置
        // images: [
        //   {
        //     url: `/og-image.png`,
        //     width: 1200,
        //     height: 630,
        //     alt: siteConfig.name,
        //   },
        // ],
    },
};

// 2. 配置 Viewport (移动端体验)
export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "white" },
        { media: "(prefers-color-scheme: dark)", color: "black" },
    ],
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // 禁止缩放，体验更像 Native App
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh" suppressHydrationWarning>
            <body
                className={clsx(
                    "min-h-screen bg-background font-sans antialiased",
                    fontSans.variable
                )}
            >
                <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
                    <UserProvider>
                        <div className="w-full relative flex flex-col min-h-dvh">
                            <main className="flex-grow w-full">
                                {children}
                            </main>

                            <footer className="w-full flex flex-col items-center justify-center py-3 border-t border-white/5 mt-10">
                                <Link
                                    isExternal
                                    className="flex items-center gap-1 text-current"
                                    href="https://osu.ppy.sh/users/3162675"
                                    title="yaowan233 OSU主页"
                                >
                                    <span className="text-default-600">Coded by</span>
                                    <p className="text-primary font-bold">yaowan233</p>
                                </Link>
                                <Link
                                    isExternal
                                    className="flex items-center gap-1 text-current mt-1"
                                    href="https://heroui.com?utm_source=next-app-template"
                                    title="heroui.com homepage"
                                >
                                    <span className="text-default-600 text-sm">Powered by</span>
                                    <p className="text-primary text-sm">HeroUI</p>
                                </Link>
                            </footer>
                        </div>
                    </UserProvider>
                </Providers>
            </body>
        </html>
    );
}