import type { Recommendation } from "./recommendation";

export function recommendationPpDisplay(item: Pick<Recommendation, "pp" | "practiceTarget" | "fcEvidence" | "accuracyTarget" | "accuracyEvidence" | "botDisplay">, mode: string) {
    const validPp = (value: number | undefined) => value !== undefined && Number.isFinite(value) && value >= 0 ? value : undefined;
    if (item.botDisplay) return { label: item.botDisplay.isTarget ? "刷图目标 PP" : "预计 PP",
        primary: validPp(item.botDisplay.pp), secondary: item.botDisplay.isTarget ? validPp(item.pp) : undefined,
        target: item.botDisplay.explanation, weightedGain: validPp(item.botDisplay.weightedGain) };
    if (mode === "mania" && (item.accuracyTarget || item.accuracyEvidence)) {
        const target = item.accuracyEvidence ? item.accuracyTarget : undefined;
        return { label: "刷图目标 PP", primary: validPp(target?.pp), secondary: validPp(item.pp),
            target: target ? `${target.accuracy.toFixed(2)}% ACC` : undefined,
            weightedGain: validPp(target?.pp) === undefined ? undefined : validPp(target?.weightedGain) };
    }
    if (mode !== "fruits") return { label: "预计 PP", primary: validPp(item.pp), secondary: undefined, target: undefined, weightedGain: undefined };
    const target = item.fcEvidence ? item.practiceTarget : undefined;
    return {
        label: "刷图目标 PP",
        primary: validPp(target?.pp),
        weightedGain: validPp(target?.pp) === undefined ? undefined : validPp(target?.weightedGain),
        secondary: validPp(item.pp),
        target: target ? target.misses === 0 ? "FC 目标" : `${target.misses} Miss · ${target.combo} 连击` : undefined,
    };
}
