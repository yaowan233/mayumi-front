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
            <main className="container mx-auto max-w-7xl pt-6 px-6 flex-grow">
                {children}
            </main>
        </>
    )
}
