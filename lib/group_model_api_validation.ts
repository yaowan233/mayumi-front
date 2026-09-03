export type GroupModelConnectionApiFormat = "openai" | "anthropic" | "vertex";

export type GroupModelApiConnectionErrorReason =
    | "browser_blocked"
    | "invalid_response"
    | "provider_rejected"
    | "timeout";

export interface GroupModelApiConnectionInput {
    apiFormat: GroupModelConnectionApiFormat;
    baseUrl: string;
    apiKey: string;
    model: string;
    multimodal: boolean;
}

interface GroupModelApiConnectionOptions {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
}

const TEST_PROMPT = "请只回复 OK";
const TEST_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const TEST_IMAGE_DATA_URI = `data:image/png;base64,${TEST_IMAGE_BASE64}`;

export class GroupModelApiConnectionError extends Error {
    readonly reason: GroupModelApiConnectionErrorReason;

    constructor(reason: GroupModelApiConnectionErrorReason, message: string) {
        super(message);
        this.name = "GroupModelApiConnectionError";
        this.reason = reason;
    }
}

function appendPath(baseUrl: string, path: string): string {
    const url = new URL(baseUrl);
    const basePath = url.pathname.replace(/\/+$/u, "");
    url.pathname = `${basePath}/${path.replace(/^\/+/u, "")}`.replace(/\/+/gu, "/");
    return url.toString();
}

function openAiEndpoint(baseUrl: string): string {
    const url = new URL(baseUrl);
    if (/\/chat\/completions\/?$/u.test(url.pathname)) return url.toString();
    return appendPath(baseUrl, "chat/completions");
}

function anthropicEndpoint(baseUrl: string): string {
    const url = new URL(baseUrl);
    if (/\/v1\/messages\/?$/u.test(url.pathname)) return url.toString();
    return appendPath(baseUrl, /\/v1\/?$/u.test(url.pathname) ? "messages" : "v1/messages");
}

function vertexModelResource(model: string): string {
    let normalized = model.trim();
    if (normalized.toLowerCase().startsWith("google/")) {
        normalized = normalized.slice("google/".length);
    }

    let resource: string;
    if (/^(?:projects|models|publishers)\//u.test(normalized)) {
        resource = normalized;
    } else if (normalized.includes("/")) {
        const [publisher, ...modelParts] = normalized.split("/");
        resource = `publishers/${publisher}/models/${modelParts.join("/")}`;
    } else {
        resource = `publishers/google/models/${normalized}`;
    }
    return resource.split("/").map(encodeURIComponent).join("/");
}

function vertexEndpoint(baseUrl: string, model: string): string {
    const url = new URL(baseUrl);
    const versionPath = /\/v1(?:beta1)?\/?$/u.test(url.pathname) ? "" : "v1beta1/";
    return appendPath(baseUrl, `${versionPath}${vertexModelResource(model)}:generateContent`);
}

function openAiContent(multimodal: boolean): string | Array<Record<string, unknown>> {
    if (!multimodal) return TEST_PROMPT;
    return [
        {type: "text", text: TEST_PROMPT},
        {type: "image_url", image_url: {url: TEST_IMAGE_DATA_URI}},
    ];
}

function anthropicContent(multimodal: boolean): string | Array<Record<string, unknown>> {
    if (!multimodal) return TEST_PROMPT;
    return [
        {type: "text", text: TEST_PROMPT},
        {
            type: "image",
            source: {type: "base64", media_type: "image/png", data: TEST_IMAGE_BASE64},
        },
    ];
}

function vertexParts(multimodal: boolean): Array<Record<string, unknown>> {
    const parts: Array<Record<string, unknown>> = [{text: TEST_PROMPT}];
    if (multimodal) {
        parts.push({inlineData: {mimeType: "image/png", data: TEST_IMAGE_BASE64}});
    }
    return parts;
}

function requestFor(input: GroupModelApiConnectionInput): {url: string; init: RequestInit} {
    const common: RequestInit = {
        method: "POST",
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
    };

    if (input.apiFormat === "anthropic") {
        return {
            url: anthropicEndpoint(input.baseUrl),
            init: {
                ...common,
                headers: {
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01",
                    "anthropic-dangerous-direct-browser-access": "true",
                    "x-api-key": input.apiKey,
                },
                body: JSON.stringify({
                    model: input.model,
                    max_tokens: 16,
                    messages: [{role: "user", content: anthropicContent(input.multimodal)}],
                }),
            },
        };
    }

    if (input.apiFormat === "vertex") {
        return {
            url: vertexEndpoint(input.baseUrl, input.model),
            init: {
                ...common,
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": input.apiKey,
                },
                body: JSON.stringify({
                    contents: [{role: "user", parts: vertexParts(input.multimodal)}],
                }),
            },
        };
    }

    return {
        url: openAiEndpoint(input.baseUrl),
        init: {
            ...common,
            headers: {
                "Authorization": `Bearer ${input.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: input.model,
                messages: [{role: "user", content: openAiContent(input.multimodal)}],
            }),
        },
    };
}

function providerMessage(body: unknown): string | undefined {
    if (!body || typeof body !== "object") return undefined;
    const candidate = body as Record<string, unknown>;
    if (typeof candidate.message === "string") return candidate.message;
    if (typeof candidate.detail === "string") return candidate.detail;
    if (candidate.error && typeof candidate.error === "object") {
        const message = (candidate.error as Record<string, unknown>).message;
        if (typeof message === "string") return message;
    }
    return undefined;
}

function safeProviderMessage(body: unknown, apiKey: string): string | undefined {
    const message = providerMessage(body);
    if (!message) return undefined;
    const redacted = message
        .replaceAll(apiKey, "<已隐藏>")
        .replace(/[\u0000-\u001f\u007f]+/gu, " ")
        .trim();
    return redacted ? redacted.slice(0, 240) : undefined;
}

function providerError(status: number, body: unknown, apiKey: string): GroupModelApiConnectionError {
    let summary = `模型服务返回 HTTP ${status}`;
    if (status === 400 || status === 404 || status === 422) {
        summary = "Base URL、API 类型或模型名称不正确";
    } else if (status === 401 || status === 403) {
        summary = "API Key 无效或没有调用权限";
    } else if (status === 408 || status === 504) {
        summary = "模型服务响应超时";
    } else if (status === 429) {
        summary = "API 额度不足或请求频率受限";
    } else if (status >= 500) {
        summary = "模型服务暂时不可用";
    }

    const detail = safeProviderMessage(body, apiKey);
    return new GroupModelApiConnectionError(
        "provider_rejected",
        detail ? `${summary}：${detail}` : summary,
    );
}

function hasText(value: unknown): boolean {
    if (typeof value === "string") return Boolean(value.trim());
    if (!Array.isArray(value)) return false;
    return value.some((item) => {
        if (typeof item === "string") return Boolean(item.trim());
        if (!item || typeof item !== "object") return false;
        const candidate = item as Record<string, unknown>;
        return hasText(candidate.text) || hasText(candidate.content);
    });
}

function hasValidResponse(apiFormat: GroupModelConnectionApiFormat, body: unknown): boolean {
    if (!body || typeof body !== "object") return false;
    const candidate = body as Record<string, unknown>;

    if (apiFormat === "anthropic") return hasText(candidate.content);
    if (apiFormat === "vertex") {
        if (!Array.isArray(candidate.candidates)) return false;
        return candidate.candidates.some((item) => {
            if (!item || typeof item !== "object") return false;
            const content = (item as Record<string, unknown>).content;
            if (!content || typeof content !== "object") return false;
            return hasText((content as Record<string, unknown>).parts);
        });
    }

    if (!Array.isArray(candidate.choices)) return false;
    return candidate.choices.some((item) => {
        if (!item || typeof item !== "object") return false;
        const message = (item as Record<string, unknown>).message;
        if (!message || typeof message !== "object") return false;
        return hasText((message as Record<string, unknown>).content);
    });
}

export async function testGroupModelApiConnection(
    input: GroupModelApiConnectionInput,
    options: GroupModelApiConnectionOptions = {},
): Promise<void> {
    const fetchImpl = options.fetchImpl ?? fetch;
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);

    try {
        const request = requestFor(input);
        const response = await fetchImpl(request.url, {...request.init, signal: controller.signal});
        const body: unknown = await response.json().catch(() => null);
        if (!response.ok) throw providerError(response.status, body, input.apiKey);
        if (!hasValidResponse(input.apiFormat, body)) {
            throw new GroupModelApiConnectionError(
                "invalid_response",
                "模型服务连接成功，但没有返回可用的文本内容",
            );
        }
    } catch (error) {
        if (error instanceof GroupModelApiConnectionError) throw error;
        if (controller.signal.aborted) {
            throw new GroupModelApiConnectionError("timeout", "模型连接测试超时，请检查服务地址或稍后重试");
        }
        throw new GroupModelApiConnectionError(
            "browser_blocked",
            "浏览器无法直接连接模型服务；服务商可能禁止跨域请求（CORS），也可能存在网络、DNS 或证书问题",
        );
    } finally {
        globalThis.clearTimeout(timeout);
    }
}
