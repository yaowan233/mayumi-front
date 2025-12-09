import {Navbar} from "@/components/navbar";
import React from "react";

export default function HomeLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar/>
            <main className="w-full mx-auto pt-6 px-6 grow">
                {children}
            </main>
        </>
    )
}
