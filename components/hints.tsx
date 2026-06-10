import {Card} from "@heroui/react";
import {AttentionIcon, SuccessIcon} from "@/components/icons";
import React from "react";


export function InfoSection({children}: { children: React.ReactNode }) {
    return (
        <Card variant="transparent" className="max-w-fit bg-[#16b55a]">
            <Card.Content className="flex flex-col gap-1">
                <div className="flex flex-row gap-1">
                    <SuccessIcon/>
                    <h1 className="text-black font-bold">提示</h1>
                </div>
                <div className='flex flex-row'>
                    {children}
                </div>
            </Card.Content>
        </Card>
    )
}

export function AttentionSection({children}: { children: React.ReactNode }) {
    return (
        <Card variant="transparent" className="max-w-fit bg-[#f5a524]">
            <Card.Content className="flex flex-col gap-1">
                <div className="flex flex-row gap-1">
                    <AttentionIcon/>
                    <h1 className="text-black font-bold">注意</h1>
                </div>
                <div className='flex flex-row'>
                    {children}
                </div>
            </Card.Content>
        </Card>
    )
}
