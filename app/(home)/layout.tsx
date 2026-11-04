import {Navbar} from "@/components/navbar";
import {PageContent} from "@/components/page-content";
import React from "react";

export default function HomeLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar/>
            <PageContent className="w-full mx-auto px-6 pt-22 grow">
                {children}
            </PageContent>
        </>
    )
}
