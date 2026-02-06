"use client"
import {useContext, useEffect, useState} from "react";
import { siteConfig } from "@/config/site";


import { TournamentInfo } from "@/components/homepage";
import {Button} from "@heroui/button";
import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@heroui/table";
import {User} from "@heroui/user";
import {Chip} from "@heroui/chip";
import {Tooltip} from "@heroui/tooltip";
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/modal";
import {Textarea} from "@heroui/input";
import {useDisclosure} from "@heroui/use-disclosure";
import CurrentUserContext from "@/app/user_context";
import {useRouter} from "next/navigation";
import {Spinner} from "@heroui/spinner";
import {Link} from "@heroui/link";

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
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const currentUser = useContext(CurrentUserContext);
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

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

        const isAdmin = currentUser?.currentUser?.uid === 3162675;

        if (!isAdmin) {
            router.replace("/");
        } else {
            setIsAuthorized(true);
        }
    }, [currentUser, router]);

    useEffect(() => {
        if (isAuthorized) {
            fetchTournaments();
        }
    }, [isAuthorized]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <Spinner size="lg" color="primary" />
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
        onOpen();
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
                onOpenChange(); // 关闭弹窗
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
                <Button color="primary" variant="flat" onPress={fetchTournaments} isLoading={isLoading}>
                    刷新列表
                </Button>
            </div>

            <Table aria-label="Tournaments Admin Table">
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody items={tournaments} isLoading={isLoading} emptyContent={"暂无数据"}>
                    {(item) => (
                        <TableRow key={item.name}>
                            {(columnKey) => {
                                const cellValue = item[columnKey as keyof TournamentInfo];

                                switch (columnKey) {
                                    case "info":
                                        return (
                                            <TableCell>
                                                <User
                                                    avatarProps={{ radius: "lg", src: item.pic_url }}
                                                    description={item.abbreviation}
                                                    name={item.name}
                                                >
                                                    {item.name}
                                                </User>
                                            </TableCell>
                                        );
                                    case "status":
                                        return (
                                            <TableCell>
                                                <Chip className="capitalize" color={statusColorMap[item.status]} size="sm" variant="flat">
                                                    {statusLabelMap[item.status]}
                                                </Chip>
                                                {item.status === 'rejected' && (
                                                    <div className="text-tiny text-danger mt-1 max-w-[150px] truncate" title={item.reject_reason}>
                                                        {item.reject_reason}
                                                    </div>
                                                )}
                                            </TableCell>
                                        );
                                    case "mode":
                                        return <TableCell>{item.mode}</TableCell>;
                                    case "date":
                                        return (
                                            <TableCell>
                                                <div className="text-small">{item.start_date}</div>
                                                <div className="text-tiny text-default-400">至 {item.end_date}</div>
                                            </TableCell>
                                        );
                                    case "actions":
                                        return (
                                            <TableCell>
                                                <div className="relative flex items-center gap-2 justify-center">
                                                    {/* 查看详情按钮 (你可以做一个Link跳转到详情页) */}
                                                    <Tooltip content="查看详情">
                                                        <Link
                                                            href={`/tournaments/${encodeURIComponent(item.abbreviation)}/home`}
                                                            target="_blank" // 建议新标签页打开，方便管理
                                                        >
                                                            <span className="text-lg text-default-400 cursor-pointer active:opacity-50 hover:text-primary transition-colors">
                                                                👁️
                                                            </span>
                                                        </Link>
                                                    </Tooltip>

                                                    {/* 只有非 Approved 的才显示通过 */}
                                                    {item.status !== 'approved' && (
                                                        <Tooltip color="success" content="通过审核">
                                                            <span
                                                                className="text-lg text-success cursor-pointer active:opacity-50"
                                                                onClick={() => handleApprove(item.name)}
                                                            >
                                                                ✅
                                                            </span>
                                                        </Tooltip>
                                                    )}

                                                    {/* 只有非 Rejected 的才显示驳回 */}
                                                    {item.status !== 'rejected' && (
                                                        <Tooltip color="danger" content="驳回 / 下架">
                                                            <span
                                                                className="text-lg text-danger cursor-pointer active:opacity-50"
                                                                onClick={() => openRejectModal(item.name)}
                                                            >
                                                                🚫
                                                            </span>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </TableCell>
                                        );
                                    default:
                                        return <TableCell>{cellValue as React.ReactNode}</TableCell>;
                                }
                            }}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* 驳回理由模态框 */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">驳回比赛</ModalHeader>
                            <ModalBody>
                                <p className="text-sm text-default-500">
                                    请填写驳回 <b>{selectedTournament}</b> 的理由。用户将在管理面板看到此消息。
                                </p>
                                <Textarea
                                    label="驳回理由"
                                    placeholder="例如：图片链接失效、包含敏感内容、信息不全..."
                                    variant="bordered"
                                    value={rejectReason}
                                    onValueChange={setRejectReason}
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" onPress={onClose}>
                                    取消
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleRejectSubmit}
                                    isLoading={actionLoading}
                                    isDisabled={!rejectReason.trim()}
                                >
                                    确认驳回
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}