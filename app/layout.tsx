import "@/styles/globals.css";
import {Metadata, Viewport} from "next";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Providers } from "./providers";
import { Link } from "@nextui-org/link";
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
		apple: "/apple-touch-icon.png",
	},
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "white" },
		{ media: "(prefers-color-scheme: dark)", color: "black" },
	],
}
export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="zh" suppressHydrationWarning>
			<head><title>OSU web</title></head>
			<body
				className={clsx(
					"min-h-screen bg-background font-sans antialiased",
					fontSans.variable
				)}
			>
				<Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
					<UserProvider>
						<div className="relative flex flex-col min-h-screen">
							{children}
							<footer className="w-full flex items-center justify-center py-3">
								<Link
									isExternal
									className="flex items-center gap-1 text-current"
									href="https://nextui-docs-v2.vercel.app?utm_source=next-app-template"
									title="nextui.org homepage"
								>
									<span className="text-default-600">Powered by</span>
									<p className="text-primary">NextUI</p>
								</Link>
							</footer>
						</div>
					</UserProvider>
				</Providers>
			</body>
		</html>
	);
}
