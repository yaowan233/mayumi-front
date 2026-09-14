export interface TournamentMap {
    tournament_name: string;
    stage_name: string;
    mod?: string;
    map_id?: number;
    number?: number;
    mode?: string;
    extra?: string[];
}

export function importMappoolIds(
    input: string,
    modInput: string,
    context: Pick<TournamentMap, "tournament_name" | "stage_name" | "mode">,
    existingMaps: TournamentMap[],
): {maps: TournamentMap[]; skipped: number} {
    const tokens = input.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) throw new Error("请输入要导入的谱面 ID");

    const invalid = tokens.filter((token) => !/^\d+$/.test(token) || !Number.isSafeInteger(Number(token)) || Number(token) <= 0);
    if (invalid.length > 0) {
        throw new Error(`谱面 ID 必须为正整数，请检查：${invalid.slice(0, 5).join("、")}${invalid.length > 5 ? " 等" : ""}`);
    }

    const mod = modInput.trim().toUpperCase();
    if (!mod) throw new Error("请填写本批谱面的 Mod");

    const group = existingMaps.filter((map) => map.tournament_name === context.tournament_name
        && map.stage_name === context.stage_name && map.mod?.trim().toUpperCase() === mod);
    const seen = new Set(group.map((map) => map.map_id));
    let number = group.reduce((max, map) => Number.isSafeInteger(map.number) && map.number! > max ? map.number! : max, 0);
    const maps: TournamentMap[] = [];
    let skipped = 0;

    for (const token of tokens) {
        const mapId = Number(token);
        if (seen.has(mapId)) {
            skipped++;
            continue;
        }
        number++;
        if (!Number.isSafeInteger(number)) throw new Error("当前 Mod 序号过大，请先调整已有序号");
        seen.add(mapId);
        maps.push({...context, mod, map_id: mapId, number, extra: []});
    }

    return {maps, skipped};
}
