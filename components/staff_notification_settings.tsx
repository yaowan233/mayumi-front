"use client";

import {Button, Skeleton} from "@heroui/react";
import {useEffect, useState} from "react";
import useSWR from "swr";
import {siteConfig} from "@/config/site";

type NotificationStatus = {configured: boolean; authorized: boolean; sender_name: string | null; pending_count: number; last_error: string | null};

export function StaffNotificationSettings() {
    const url = `${siteConfig.backend_url}/api/staff-pm`;
    const {data, error, mutate} = useSWR<NotificationStatus>(`${url}/status`, async (key: string) => {
        const response = await fetch(key, {credentials: "include", cache: "no-store"});
        if (!response.ok) throw new Error("无法读取私信通知配置");
        return response.json();
    });
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState("");
    useEffect(() => {
        const result = new URLSearchParams(window.location.search).get("staff_pm");
        const timer = window.setTimeout(() => {
            if (result === "authorized") setMessage("通知账号授权成功，新申请将通过 osu! 私信提醒主办。");
            if (result === "failed") setMessage("授权未完成，请确认使用网站 OAuth 应用拥有者账号后重试。");
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);

    const authorize = async () => {
        setPending(true);
        setMessage("");
        try {
            const response = await fetch(`${url}/authorize`, {method: "POST", credentials: "include"});
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.detail || "无法发起授权");
            window.location.assign(payload.url);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "无法发起授权");
            setPending(false);
        }
    };

    return <section className="mb-6 space-y-4 rounded-2xl border border-default-200 bg-surface p-5 dark:border-white/10">
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1"><h2 className="text-lg font-bold">Staff 申请私信通知</h2><p className="text-sm text-default-500">通过 osu! 私信提醒赛事主办查看新申请或更新的申请。</p></div>
            <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onPress={() => void mutate()}>刷新状态</Button>
                <Button variant="primary" isDisabled={!data?.configured} isPending={pending} onPress={authorize}>{data?.authorized ? "重新授权通知账号" : "授权通知账号"}</Button>
                {data?.authorized && <Button variant="ghost" isDisabled={pending} onPress={async () => {
                    setPending(true);
                    try {
                        const response = await fetch(`${url}/authorization`, {method: "DELETE", credentials: "include"});
                        if (!response.ok) throw new Error("停止通知失败");
                        setMessage("已停止发送通知，待发送记录仍保留。");
                        await mutate();
                    } catch {setMessage("停止通知失败，请重试");}
                    finally {setPending(false);}
                }}>停止通知</Button>}
            </div>
        </div>
        {!data && !error && <Skeleton className="h-5 w-64 max-w-full"/>}
        {data && <p className="text-sm text-default-500">{data.authorized ? `发送账号：${data.sender_name} · 待发送 ${data.pending_count} 条` : data.configured ? "尚未授权发送账号。" : "请先在后端配置通知应用，随后使用该 OAuth 应用的拥有者账号授权。"}</p>}
        {(error || data?.last_error) && <p role="alert" className="text-sm text-danger">{error?.message || data?.last_error}</p>}
        {message && <p role="status" className="text-sm text-default-600">{message}</p>}
    </section>;
}
