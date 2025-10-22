import {Navbar} from "@/components/navbar";
import React from "react";

export default async function HomeLayout({
                                             children,
                                         }: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col flex-grow">
            <Navbar />
            <main className="w-full mx-auto pt-6 px-6 flex-grow">
                {children}
            </main>
        </div>
    )
}
