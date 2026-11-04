import type {Me} from "@/app/actions";

export class ApiRequestError extends Error {
    readonly status: number;

    constructor(status: number) {
        super(status === 403 ? "您无权查看此内容，请确认登录和比赛权限。"
            : status === 404 ? "未找到数据"
                : `加载失败（HTTP ${status}），请稍后重试`);
        this.status = status;
    }
}

export async function fetchBrowserJson<T>(url: string, signal = AbortSignal.timeout(30_000)): Promise<T> {
    const response = await fetch(url, {credentials: "include", cache: "no-store", signal});
    if (!response.ok) throw new ApiRequestError(response.status);
    try {
        return await response.json();
    } catch {
        throw new Error("返回的数据格式异常，请稍后重试");
    }
}

export async function fetchCurrentUser(url: string): Promise<Me | null> {
    try {
        const user = await fetchBrowserJson<Me | null>(url, AbortSignal.timeout(8000));
        return user && Number.isSafeInteger(user.uid) && user.uid > 0 ? user : null;
    } catch (error) {
        if (error instanceof ApiRequestError && [401, 403].includes(error.status)) return null;
        throw error;
    }
}

export function browserResourceKey(url: string, uid: number | undefined, isLoading: boolean) {
    return isLoading ? null : [url, uid ?? "anonymous"] as const;
}
