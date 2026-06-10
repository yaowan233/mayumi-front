"use client"
import {useContext, useEffect, useMemo, useState} from "react";
import { siteConfig } from "@/config/site";


import { TournamentInfo } from "@/components/homepage";
import {Avatar, Button, Chip, Spinner, Tooltip} from "@heroui/react";
import CurrentUserContext from "@/app/user_context";
import {useRouter} from "next/navigation";
import Link from "next/link";

// 状态颜色映射
const statusColorMap: Record<string, "warning" | "success" | "danger" | "default"> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    draft: "default",
    hidden: "default",
};

const statusLabelMap: Record<string, string> = {
    pending: "待审核",
    approved: "已发布",
    rejected: "已驳回",
    draft: "草稿",
    hidden: "已隐藏",
};

export default function AdminPage() {
    const [tournaments, setTournaments] = useState<TournamentInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 驳回相关的状态
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const currentUser = useContext(CurrentUserContext);
    const router = useRouter();
    const isAuthorized = useMemo(() => currentUser?.currentUser?.uid === 3162675, [currentUser]);

    const fetchTournaments = async () => {
        try {
            const res = await fetch(`${siteConfig.backend_url}/api/admin/tournaments`, {
                credentials: 'include'
            });
            if (res.status === 403) {
                return;
            }
            const data = await res.json();
            setTournaments(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser === undefined || currentUser?.currentUser === null) {
            return;
        }

        if (!isAuthorized) {
            router.replace("/");
        }
    }, [currentUser, isAuthorized, router]);

    useEffect(() => {
        if (isAuthorized) {
            const timer = window.setTimeout(() => {
                void fetchTournaments();
            }, 0);

            return () => window.clearTimeout(timer);
        }
    }, [isAuthorized]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <Spinner size="lg" color="accent" />
                <p className="text-default-500 font-medium">正在验证管理员权限...</p>
            </div>
        );
    }

    // 处理通过
    const handleApprove = async (name: string) => {
        if (!confirm(`确认要通过比赛 "${name}" 吗？`)) return;

        setActionLoading(true);
        try {
            const res = await fetch(`${siteConfig.backend_url}/api/admin/approve/${name}`, {
                method: "POST",
                credentials: 'include'
            });
            if (res.ok) {
                await fetchTournaments(); // 刷新列表
            } else {
                alert("操作失败");
            }
        } finally {
            setActionLoading(false);
        }
    };

    // 打开驳回弹窗
    const openRejectModal = (name: string) => {
        setSelectedTournament(name);
        setRejectReason("");
        setIsRejectOpen(true);
    };

    // 提交驳回
    const handleRejectSubmit = async () => {
        if (!selectedTournament || !rejectReason.trim()) return;

        setActionLoading(true);
        try {
            const res = await fetch(`${siteConfig.backend_url}/api/admin/reject/${selectedTournament}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: rejectReason }),
                credentials: 'include'
            });
            if (res.ok) {
                setIsRejectOpen(false); // 关闭弹窗
                await fetchTournaments(); // 刷新
            } else {
                alert("操作失败");
            }
        } finally {
            setActionLoading(false);
        }
    };

    // 表格列定义
    const columns = [
        { name: "比赛信息", uid: "info" },
        { name: "模式", uid: "mode" },
        { name: "状态", uid: "status" },
        { name: "时间", uid: "date" },
        { name: "操作", uid: "actions" },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-black text-foreground">后台管理 - 赛事审核</h1>
                <Button variant="secondary" onPress={fetchTournaments} isPending={isLoading}>
                    刷新列表
                </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-white/5 dark:bg-zinc-900">
                <table className="w-full border-collapse text-sm" aria-label="Tournaments Admin Table">
                    <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.uid} scope="col" className={`whitespace-nowrap bg-default-100 px-4 py-3 text-xs font-bold uppercase text-default-600 ${column.uid === "actions" ? "text-center" : "text-left"}`}>
                                {column.name}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-12 text-center text-default-500">
                                <span className="inline-flex items-center gap-2"><Spinner size="sm"/> 加载中...</span>
                            </td>
                        </tr>
                    ) : tournaments.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-12 text-center text-default-400">暂无数据</td>
                        </tr>
                    ) : tournaments.map((item) => (
                        <tr key={item.name} className="border-t border-zinc-200/70 transition-colors hover:bg-zinc-50 dark:border-white/[0.06] dark:hover:bg-white/[0.04]">
                            <td className="px-4 py-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <Avatar className="h-10 w-10 rounded-lg">
                                        <Avatar.Image src={item.pic_url} alt={item.name}/>
                                        <Avatar.Fallback>{item.name?.[0] ?? "?"}</Avatar.Fallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <div className="truncate font-bold text-zinc-900 dark:text-zinc-100">{item.name}</div>
                                        <div className="truncate text-xs text-default-500">{item.abbreviation}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">{item.mode}</td>
                            <td className="px-4 py-3">
                                <Chip className="capitalize" color={statusColorMap[item.status]} size="sm" variant="soft">
                                    {statusLabelMap[item.status]}
                                </Chip>
                                {item.status === "rejected" && (
                                    <div className="mt-1 max-w-[150px] truncate text-tiny text-danger" title={item.reject_reason}>
                                        {item.reject_reason}
                                    </div>
                                )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                                <div className="text-small">{item.start_date}</div>
                                <div className="text-tiny text-default-400">至 {item.end_date}</div>
                            </td>
                            <td className="px-4 py-3">
                                <div className="relative flex items-center justify-center gap-2">
                                    <Tooltip>
                                        <Tooltip.Trigger>
                                            <Link
                                                href={`/tournaments/${encodeURIComponent(item.abbreviation)}/home`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-lg text-default-400 transition-colors hover:text-primary active:opacity-50"
                                            >
                                                👁️
                                            </Link>
                                        </Tooltip.Trigger>
                                        <Tooltip.Content>查看详情</Tooltip.Content>
                                    </Tooltip>

                                    {item.status !== "approved" && (
                                        <Tooltip>
                                            <Tooltip.Trigger>
                                                <button
                                                    type="button"
                                                    className="text-lg text-success transition-opacity active:opacity-50"
                                                    onClick={() => handleApprove(item.name)}
                                                    disabled={actionLoading}
                                                >
                                                    ✓
                                                </button>
                                            </Tooltip.Trigger>
                                            <Tooltip.Content>通过审核</Tooltip.Content>
                                        </Tooltip>
                                    )}

                                    {item.status !== "rejected" && (
                                        <Tooltip>
                                            <Tooltip.Trigger>
                                                <button
                                                    type="button"
                                                    className="text-lg text-danger transition-opacity active:opacity-50"
                                                    onClick={() => openRejectModal(item.name)}
                                                    disabled={actionLoading}
                                                >
                                                    🚫
                                                </button>
                                            </Tooltip.Trigger>
                                            <Tooltip.Content>驳回 / 下架</Tooltip.Content>
                                        </Tooltip>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            {isRejectOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 py-24 backdrop-blur-sm" onClick={() => setIsRejectOpen(false)}>
                    <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900" onClick={(event) => event.stopPropagation()}>
                        <div className="border-b border-zinc-200 px-5 py-4 dark:border-white/[0.08]">
                            <h2 className="text-lg font-bold text-foreground">驳回比赛</h2>
                        </div>
                        <div className="flex flex-col gap-4 px-5 py-4">
                            <p className="text-sm text-default-500">
                                请填写驳回 <b>{selectedTournament}</b> 的理由。用户将在管理面板看到此消息。
                            </p>
                            <label className="flex flex-col gap-2 text-sm font-semibold text-default-600">
                                驳回理由
                                <textarea
                                    className="min-h-32 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-black/20 dark:text-zinc-100"
                                    placeholder="例如：图片链接失效、包含敏感内容、信息不全..."
                                    value={rejectReason}
                                    onChange={(event) => setRejectReason(event.target.value)}
                                />
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4 dark:border-white/[0.08]">
                            <Button variant="danger-soft" onPress={() => setIsRejectOpen(false)}>
                                取消
                            </Button>
                            <Button
                                variant="primary"
                                onPress={handleRejectSubmit}
                                isPending={actionLoading}
                                isDisabled={!rejectReason.trim()}
                            >
                                {({isPending}) => isPending ? "提交中..." : "确认驳回"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}        </div>
    );
}
