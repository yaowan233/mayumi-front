import {Card, CardBody} from "@heroui/card";
import {AttentionIcon, SuccessIcon} from "@/components/icons";
import React from "react";


export function InfoSection({children}: { children: React.ReactNode }) {
    return (
        <Card className="bg-[#16b55a] max-w-fit">
            <CardBody className="flex flex-col gap-1">
                <div className="flex flex-row gap-1">
                    <SuccessIcon/>
                    <h1 className="text-black font-bold">提示</h1>
                </div>
                <div className='flex flex-row'>
                    {children}
                </div>
            </CardBody>
        </Card>
    )
}

export function AttentionSection({children}: { children: React.ReactNode }) {
    return (
        <Card className="bg-[#f5a524] max-w-fit">
            <CardBody className="flex flex-col gap-1">
                <div className="flex flex-row gap-1">
                    <AttentionIcon/>
                    <h1 className="text-black font-bold">注意</h1>
                </div>
                <div className='flex flex-row'>
                    {children}
                </div>
            </CardBody>
        </Card>
    )
}
