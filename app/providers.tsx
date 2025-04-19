"use client";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from 'next/navigation'
import {ThemeProvider as NextThemesProvider, ThemeProviderProps} from "next-themes";

export interface ProvidersProps {
	children: React.ReactNode;
	themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
	const router = useRouter();

	return (
		<HeroUIProvider navigate={router.push}>
			<NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
		</HeroUIProvider>
	);
}
