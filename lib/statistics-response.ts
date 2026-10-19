export class StatisticsRequestError extends Error {}

export async function readStatisticsResponse<T>(response: Response, resource: string): Promise<T> {
    if (!response.ok) {
        throw new StatisticsRequestError(`${resource}加载失败（HTTP ${response.status}），请稍后重试`);
    }
    try {
        return await response.json();
    } catch {
        throw new StatisticsRequestError(`${resource}返回的数据格式异常，请稍后重试`);
    }
}
