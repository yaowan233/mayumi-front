export function recommendationServiceError(status: number) {
    if (status === 504) return { status: 504, error: "推荐计算超时，服务仍在运行。请稍后重试，或暂时缩小 Mod / 筛选范围。" };
    if (status === 503) return { status: 503, error: "推荐服务暂时繁忙或数据查询失败，请稍后重试。" };
    if (status === 429) return { status: 429, error: "推荐请求较多，请稍后重试。" };
    return null;
}
