const EXPLICIT_TIMEZONE_PATTERN = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const LEGACY_UTC_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

/**
 * Parses a stored instant while preserving compatibility with legacy values.
 *
 * New values include an explicit timezone (normally ISO 8601 with a trailing Z).
 * Historical schedule values did not include a timezone, but the old UI treated
 * their clock fields as UTC, so timezone-less date-times are interpreted as UTC.
 */
export function parseUtcDateTime(value: string | null | undefined): Date | null {
    if (!value) return null;

    const trimmedValue = value.trim();
    const normalizedValue = EXPLICIT_TIMEZONE_PATTERN.test(trimmedValue)
        ? trimmedValue
        : LEGACY_UTC_DATETIME_PATTERN.test(trimmedValue)
            ? `${trimmedValue.replace(" ", "T")}Z`
            : trimmedValue;
    const date = new Date(normalizedValue);

    return Number.isNaN(date.getTime()) ? null : date;
}

export function toUtcISOString(value: string | null | undefined): string | null {
    return parseUtcDateTime(value)?.toISOString() ?? null;
}

export function localDateTimeInputToUtc(value: string): string | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
    if (!match) return null;

    const [, year, month, day, hours, minutes] = match.map(Number);
    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

    if (
        date.getFullYear() !== year
        || date.getMonth() !== month - 1
        || date.getDate() !== day
        || date.getHours() !== hours
        || date.getMinutes() !== minutes
    ) {
        return null;
    }

    return date.toISOString();
}

export function utcDateTimeToLocalInput(value: string | null | undefined): string {
    const date = parseUtcDateTime(value);
    if (!date) return "";

    const pad = (part: number) => part.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatLocalDateTime(
    value: string | null | undefined,
    options?: Intl.DateTimeFormatOptions,
): string | null {
    const date = parseUtcDateTime(value);
    if (!date) return null;

    return date.toLocaleString("zh-CN", options);
}

export function formatUtcDateTime(value: string | null | undefined): string | null {
    const date = parseUtcDateTime(value);
    if (!date) return null;

    const pad = (part: number) => part.toString().padStart(2, "0");
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

export function getLocalDateTimeParts(value: string | null | undefined): { date: string; time: string } | null {
    const date = parseUtcDateTime(value);
    if (!date) return null;

    const pad = (part: number) => part.toString().padStart(2, "0");
    return {
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    };
}
