export type FeatureSpec = { key: string; label: string; unit: string; max: number; scale: number; description: string };
export type FeatureRanges = Record<string, { min?: number; max?: number }>;

export function withRatioRange(ranges: FeatureRanges, key: string, percentages: number[]): FeatureRanges {
    const [minimum, maximum] = percentages;
    if (percentages.length !== 2 || !percentages.every(Number.isFinite) || minimum < 0 || maximum > 100 || minimum > maximum) throw new Error("比例范围无效");
    const next = { ...ranges };
    if (minimum === 0 && maximum === 100) delete next[key];
    else next[key] = { min: minimum / 100, max: maximum / 100 };
    return next;
}

const ratio = (key: string, label: string, description: string): FeatureSpec => ({ key, label, description, unit: "%", max: 1, scale: 100 });
const density = (prefix: string): FeatureSpec[] => [
    { key: `${prefix}_density_avg`, label: "平均物件密度", unit: "个/秒", max: 1000, scale: 1, description: "按首尾物件时长计算的平均密度" },
    { key: `${prefix}_density_peak_1000`, label: "峰值物件密度", unit: "个/秒", max: 10000, scale: 1, description: "原谱 1 秒窗口内的峰值密度" },
];
export const featureSpecs: Record<string, FeatureSpec[]> = {
    osu: [ratio("slider_ratio", "滑条占比", "滑条数占总物件数的比例"),
        { key: "jump_p90", label: "跳距 P90", unit: "osu! px", max: 1000, scale: 1, description: "相邻物件几何距离的第 90 百分位，不等于官方跳跃难度" },
        ratio("angle_change_ratio", "转角变化比例", "embedding 提取的转角变化特征，并非技术图评级"), ...density("object")],
    taiko: [ratio("rim_ratio", "蓝键占比", "边音在圆形物件中的比例"), ratio("big_ratio", "大音符占比", "大音符在圆形物件中的比例"),
        ratio("color_change_ratio", "换色比例", "相邻打击物件切换颜色的比例"), ...density("object")],
    fruits: [ratio("direction_change_ratio", "换向比例", "相邻横向移动方向改变的特征比例"), ratio("edge_ratio", "边缘物件占比", "embedding 定义的场地边缘物件比例"),
        { key: "x_jump_p90", label: "横向跳距 P90", unit: "osu! px", max: 512, scale: 1, description: "横向距离的第 90 百分位；基于原始物件的风格近似，不等于完整接果轨迹模拟" }, ...density("object")],
    mania: [ratio("ln_ratio", "LN 占比", "长条物件数 ÷ 总物件数，不是长条时间占比"),
        ratio("chord_ratio", "多押比例", "出现多押的时间组 ÷ 全部按键时间组"),
        ratio("ln_overlap_ratio", "LN 重叠比例", "持续期间有其他长条开始的长条数 ÷ 长条总数（不含同时开始）"), ...density("note")],
};

export function parseFeatureRanges(raw: string, mode: string): FeatureRanges {
    if (raw.length > 4096) throw new Error("谱面特征条件过长");
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { throw new Error("谱面特征条件格式无效"); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("谱面特征条件格式无效");
    const result: FeatureRanges = {};
    for (const [key, bounds] of Object.entries(parsed)) {
        const spec = featureSpecs[mode]?.find(feature => feature.key === key);
        if (!spec || !bounds || typeof bounds !== "object" || Array.isArray(bounds)) throw new Error("当前模式不支持此谱面特征");
        const range: { min?: number; max?: number } = {};
        for (const [bound, value] of Object.entries(bounds)) {
            if ((bound !== "min" && bound !== "max") || typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > spec.max) throw new Error(`${spec.label}范围无效`);
            range[bound] = value;
        }
        if (range.min === undefined && range.max === undefined) throw new Error(`${spec.label}至少需要一个边界`);
        if (range.min !== undefined && range.max !== undefined && range.min > range.max) throw new Error(`${spec.label}下限不能大于上限`);
        result[key] = range;
    }
    return result;
}
