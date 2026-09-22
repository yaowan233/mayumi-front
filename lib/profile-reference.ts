import { featureSpecs, type FeatureRanges } from "./recommendation-features.ts";
import type { Filters } from "./recommendation.ts";

export type ReferenceFeature = { value: number; min: number; max: number; samples: number };
export type ReferenceGroup = { key_count: number | null; sample_count: number; features: Record<string, ReferenceFeature> };
export type ProfileReference = { source: "bp-raw-nm-v1"; player_id: number; mode: string; generated_at: string; groups: ReferenceGroup[] };

export function validProfileReference(data: unknown, mode: string, playerId: number): data is ProfileReference {
    if (!data || typeof data !== "object") return false;
    const profile = data as ProfileReference;
    if (profile.source !== "bp-raw-nm-v1" || profile.player_id !== playerId || profile.mode !== mode || typeof profile.generated_at !== "string" || !Number.isFinite(Date.parse(profile.generated_at)) || !Array.isArray(profile.groups) || profile.groups.length > 7) return false;
    const keys = new Set<number | null>();
    return profile.groups.every(group => {
        if (!group || (mode === "mania" ? !Number.isInteger(group.key_count) || group.key_count! < 4 || group.key_count! > 10 : group.key_count !== null) || keys.has(group.key_count)) return false;
        keys.add(group.key_count);
        if (!Number.isInteger(group.sample_count) || group.sample_count < 0 || group.sample_count > 100 || !group.features || typeof group.features !== "object" || Array.isArray(group.features)) return false;
        return Object.entries(group.features).every(([name, reference]) => {
            const spec = featureSpecs[mode]?.find(feature => feature.key === name);
            return !!spec && !!reference && [reference.value, reference.min, reference.max].every(value => typeof value === "number" && Number.isFinite(value))
                && reference.min >= 0 && reference.max <= spec.max && reference.min <= reference.value && reference.value <= reference.max
                && Number.isInteger(reference.samples) && reference.samples >= 5 && reference.samples <= group.sample_count;
        });
    });
}

export function profileStyleFilters(filters: Filters, playerId: string, keyCount: number | null): Filters {
    return { ...filters, source: "personal", uid: playerId, target: "style", featureRanges: "{}",
        preferredStars: "", preferredBpm: "", preferredLength: "", referenceId: "", referenceMod: "NM", diversity: 0,
        ...(filters.mode === "mania" && keyCount !== null ? { keyCounts: String(keyCount), keys: 0 } : {}) };
}

export function referenceRanges(group: ReferenceGroup, mode: string, selectedFeatures: string[]): FeatureRanges {
    const ranges: FeatureRanges = {};
    for (const spec of featureSpecs[mode]) {
        if (!selectedFeatures.includes(spec.key)) continue;
        const reference = group.features[spec.key];
        if (!reference) continue;
        const precision = spec.scale === 100 ? 100 : 10;
        const min = Math.max(0, Math.floor(reference.min * precision) / precision);
        const max = Math.min(spec.max, Math.ceil(reference.max * precision) / precision);
        if (spec.scale === 100 && min === 0 && max === 1) continue;
        ranges[spec.key] = { min, max };
    }
    return ranges;
}
