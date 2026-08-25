import type {Metadata} from "next";

import {GroupModelConfigForm} from "@/components/group_model_config_form";

export const metadata: Metadata = {
    title: "群模型安全配置",
    description: "为群聊机器人安全配置独立的大模型 API",
    robots: {
        index: false,
        follow: false,
        nocache: true,
    },
    referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default async function GroupModelConfigPage({
    params,
}: {
    params: Promise<{ticketId: string}>;
}) {
    const {ticketId} = await params;

    return <GroupModelConfigForm ticketId={ticketId}/>;
}
