import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "OSUBot OAuth 授权",
    robots: { index: false, follow: false },
};

const RESULT_COPY = {
    success: {
        title: "授权完成",
        description: "你可以关闭此页面并返回聊天，机器人会自动完成绑定。",
        accent: "text-emerald-500",
    },
    denied: {
        title: "授权已取消",
        description: "没有保存任何授权信息。需要使用好友功能时，请在聊天中重新发送 /friend。",
        accent: "text-amber-500",
    },
    invalid: {
        title: "授权链接无效或已过期",
        description: "请返回聊天并重新发送 /friend 获取新的授权链接。",
        accent: "text-rose-500",
    },
} as const;

type ResultStatus = keyof typeof RESULT_COPY;

export default async function OSUBotOAuthResultPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>;
}) {
    const params = await searchParams;
    const rawStatus = params.status;
    const status: ResultStatus =
        rawStatus && rawStatus in RESULT_COPY ? (rawStatus as ResultStatus) : "invalid";
    const copy = RESULT_COPY[status];

    return (
        <div className="flex min-h-[75dvh] items-center justify-center px-4 py-16">
            <section className="w-full max-w-lg rounded-3xl border border-default-200 bg-content1 p-8 text-center shadow-xl">
                <div className="mb-5 text-sm font-semibold tracking-[0.2em] text-default-500">
                    OSUBOT OAUTH
                </div>
                <h1 className={`text-3xl font-bold ${copy.accent}`}>{copy.title}</h1>
                <p className="mt-4 leading-7 text-default-600">{copy.description}</p>
                <p className="mt-8 text-sm text-default-400">
                    本页面不会显示或保存你的 osu! 访问令牌。
                </p>
            </section>
        </div>
    );
}
