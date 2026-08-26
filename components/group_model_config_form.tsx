"use client";

import {
    Alert,
    Button,
    Card,
    Chip,
    Description,
    FieldError,
    Input,
    Label,
    ListBox,
    Select,
    Spinner,
    Switch,
    TextField,
} from "@heroui/react";
import {FormEvent, useEffect, useMemo, useRef, useState} from "react";

import {Logo} from "@/components/icons";
import {ThemeSwitch} from "@/components/theme-switch";
import {siteConfig} from "@/config/site";
import {
    encryptGroupModelPayload,
    GroupModelApiFormat,
    GroupModelPayload,
} from "@/lib/group_model_relay_crypto";

declare global {
    interface Window {
        __MAYUMI_GROUP_CONFIG_SUBMIT_TOKEN__?: string;
    }
}

interface PublicTicket {
    protocol_version: 1;
    ticket_id: string;
    instance_id: string;
    key_id: string;
    public_key_jwk: JsonWebKey;
    expires_at: string;
    status: "created";
}

interface SubmitResult {
    code: string;
    expires_at: string;
}

type PageState = "loading" | "ready" | "submitting" | "success" | "error";

const API_FORMATS: ReadonlyArray<{
    key: GroupModelApiFormat;
    label: string;
    description: string;
    defaultBaseUrl: string;
    apiKeyDescription: string;
    modelExample: string;
    setupHint: string;
}> = [
    {
        key: "openai",
        label: "OpenAI 兼容接口",
        description: "适用于 OpenAI 及兼容 /v1/chat/completions 的服务",
        defaultBaseUrl: "https://api.openai.com/v1",
        apiKeyDescription: "在服务商的“API Key / 密钥管理”页面创建。它通常以 sk- 开头，但不同服务商可能不同。",
        modelExample: "gpt-4.1-mini、qwen3.5-plus 或服务商给出的其他模型 ID",
        setupHint: "如果你使用中转站、OpenRouter、阿里云百炼等服务，也选这一项，并以该服务商文档给出的地址和模型 ID 为准。",
    },
    {
        key: "anthropic",
        label: "Anthropic Messages",
        description: "适用于 Anthropic Claude 官方接口",
        defaultBaseUrl: "https://api.anthropic.com",
        apiKeyDescription: "在 Anthropic Console 的 API Keys 页面创建，不是 Claude 网页版的账号密码或订阅。",
        modelExample: "claude-sonnet-4-6",
        setupHint: "只有直接使用 Anthropic 官方 Messages API 时才选这一项；使用兼容 OpenAI 的中转服务时通常应选“OpenAI 兼容接口”。",
    },
    {
        key: "vertex",
        label: "Google Vertex AI",
        description: "适用于 Google Cloud Vertex AI 模型",
        defaultBaseUrl: "https://aiplatform.googleapis.com",
        apiKeyDescription: "这里需要 Vertex AI Express Mode 可用的 API Key；普通 Google 登录密码不能使用。",
        modelExample: "gemini-2.5-flash",
        setupHint: "这是面向 Google Cloud Vertex AI 的选项。若服务商提供的是 OpenAI 兼容地址，请改选“OpenAI 兼容接口”。",
    },
];

const alertToneClass = {
    danger: "border-red-500/30 bg-red-500/[0.07] dark:bg-red-500/[0.10]",
    warning: "border-amber-500/30 bg-amber-500/[0.07] dark:bg-amber-500/[0.10]",
    success: "border-emerald-500/30 bg-emerald-500/[0.07] dark:bg-emerald-500/[0.10]",
};

function ShieldIcon({className}: {className?: string}) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3 5 6v5c0 4.7 2.8 8.1 7 10 4.2-1.9 7-5.3 7-10V6l-7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="m9.2 12 1.8 1.8 3.9-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

function KeyIcon({className}: {className?: string}) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="8" cy="15" r="4" stroke="currentColor" strokeWidth="1.8"/>
            <path d="m11 12 8-8m-3 3 2 2m-5 1 2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    );
}

function CopyIcon({className}: {className?: string}) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.8"/>
        </svg>
    );
}

function formatRemaining(expiresAt: string, now: number): string {
    const remainingSeconds = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function readErrorMessage(body: unknown, fallback: string): string {
    if (!body || typeof body !== "object") return fallback;

    const detail = "detail" in body ? body.detail : undefined;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object" && "message" in detail && typeof detail.message === "string") {
        return detail.message;
    }

    return fallback;
}

function isPublicTicket(value: unknown, expectedTicketId: string): value is PublicTicket {
    if (!value || typeof value !== "object") return false;

    const candidate = value as Partial<PublicTicket>;
    const expiresAt = typeof candidate.expires_at === "string" ? Date.parse(candidate.expires_at) : NaN;
    return candidate.protocol_version === 1
        && candidate.ticket_id === expectedTicketId
        && typeof candidate.instance_id === "string"
        && candidate.instance_id.length > 0
        && typeof candidate.key_id === "string"
        && candidate.key_id.length > 0
        && Boolean(candidate.public_key_jwk)
        && typeof candidate.public_key_jwk === "object"
        && candidate.status === "created"
        && Number.isFinite(expiresAt)
        && expiresAt > Date.now();
}

function validateBaseUrl(value: string): string | undefined {
    try {
        const parsed = new URL(value);
        if (parsed.protocol !== "https:") return "接口地址必须使用 HTTPS";
        if (parsed.username || parsed.password) return "接口地址不能包含用户名或密码";
        if (parsed.search || parsed.hash) return "接口地址不能包含查询参数或锚点";
        return undefined;
    } catch {
        return "请输入完整、有效的 HTTPS 地址";
    }
}

function validateReplyProbability(value: string): string | undefined {
    if (!value.trim()) return "请输入 0 到 0.1 之间的概率";

    const probability = Number(value);
    if (!Number.isFinite(probability)) return "请输入有效数字";
    if (probability < 0 || probability > 0.1) return "主动发言概率必须在 0 到 0.1 之间";
    return undefined;
}

export function GroupModelConfigForm({ticketId}: {ticketId: string}) {
    const [pageState, setPageState] = useState<PageState>("loading");
    const [ticket, setTicket] = useState<PublicTicket | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [format, setFormat] = useState<GroupModelApiFormat>("openai");
    const [baseUrl, setBaseUrl] = useState(API_FORMATS[0].defaultBaseUrl);
    const [apiKey, setApiKey] = useState("");
    const [model, setModel] = useState("");
    const [multimodal, setMultimodal] = useState(true);
    const [customReplyProbability, setCustomReplyProbability] = useState(false);
    const [replyProbability, setReplyProbability] = useState("0.01");
    const [showApiKey, setShowApiKey] = useState(false);
    const [baseUrlError, setBaseUrlError] = useState<string>();
    const [replyProbabilityError, setReplyProbabilityError] = useState<string>();
    const [submitted, setSubmitted] = useState<SubmitResult | null>(null);
    const [now, setNow] = useState(() => Date.now());
    const [copied, setCopied] = useState(false);
    const submitTokenRef = useRef("");

    const backendUrl = useMemo(() => siteConfig.backend_url.replace(/\/$/u, ""), []);
    const activeFormat = API_FORMATS.find((option) => option.key === format) ?? API_FORMATS[0];
    const activeExpiry = submitted?.expires_at ?? ticket?.expires_at;
    const remaining = activeExpiry ? formatRemaining(activeExpiry, now) : "--:--";

    useEffect(() => {
        const interval = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        let cancelled = false;
        let submitToken = submitTokenRef.current
            || window.__MAYUMI_GROUP_CONFIG_SUBMIT_TOKEN__
            || "";

        if (!submitToken) {
            const hashParams = new URLSearchParams(window.location.hash.slice(1));
            submitToken = hashParams.get("token")?.trim() ?? "";
            if (submitToken) {
                submitTokenRef.current = submitToken;
                window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
            }
        }

        if (submitToken) {
            submitTokenRef.current = submitToken;
            delete window.__MAYUMI_GROUP_CONFIG_SUBMIT_TOKEN__;
        }

        if (!submitToken) {
            setErrorMessage("配置链接缺少一次性提交凭据。请返回群聊，让机器人重新生成配置链接。");
            setPageState("error");
            return;
        }

        const loadTicket = async () => {
            try {
                const response = await fetch(
                    `${backendUrl}/v1/config-tickets/${encodeURIComponent(ticketId)}/public`,
                    {cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer"},
                );
                const body: unknown = await response.json().catch(() => null);
                if (!response.ok) {
                    throw new Error(readErrorMessage(body, "配置链接无效、已过期或已经使用。"));
                }
                if (!isPublicTicket(body, ticketId)) {
                    throw new Error("服务器返回了无效的配置票据。请让机器人重新生成链接。");
                }

                if (!cancelled) {
                    setTicket(body);
                    setPageState("ready");
                }
            } catch (error) {
                if (!cancelled) {
                    setErrorMessage(error instanceof Error ? error.message : "无法连接配置服务器，请稍后重试。");
                    setPageState("error");
                }
            }
        };

        void loadTicket();
        return () => {
            cancelled = true;
        };
    }, [backendUrl, ticketId]);

    const handleFormatChange = (nextValue: string) => {
        const nextFormat = API_FORMATS.find((option) => option.key === nextValue);
        if (!nextFormat) return;

        setFormat(nextFormat.key);
        setBaseUrl(nextFormat.defaultBaseUrl);
        setBaseUrlError(undefined);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!ticket || pageState === "submitting") return;

        const nextBaseUrlError = validateBaseUrl(baseUrl.trim());
        const nextReplyProbabilityError = customReplyProbability
            ? validateReplyProbability(replyProbability)
            : undefined;
        setBaseUrlError(nextBaseUrlError);
        setReplyProbabilityError(nextReplyProbabilityError);
        setErrorMessage("");

        if (nextBaseUrlError || nextReplyProbabilityError || !apiKey.trim() || !model.trim()) return;

        const submitToken = submitTokenRef.current;
        if (!submitToken) {
            setErrorMessage("一次性提交凭据已失效，请让机器人重新生成配置链接。");
            return;
        }

        setPageState("submitting");
        try {
            const payload: GroupModelPayload = {
                schema_version: 1,
                ticket_id: ticket.ticket_id,
                api_format: format,
                base_url: baseUrl.trim().replace(/\/$/u, ""),
                api_key: apiKey.trim(),
                chat_model: model.trim(),
                chat_multimodal: multimodal,
                reply_probability: customReplyProbability ? Number(replyProbability) : null,
                allow_global_fallback: false,
                created_at: new Date().toISOString(),
            };
            const encrypted = await encryptGroupModelPayload({
                payload,
                instanceId: ticket.instance_id,
                keyId: ticket.key_id,
                publicKeyJwk: ticket.public_key_jwk,
            });
            const response = await fetch(
                `${backendUrl}/v1/config-tickets/${encodeURIComponent(ticket.ticket_id)}/payload`,
                {
                    method: "POST",
                    cache: "no-store",
                    credentials: "omit",
                    referrerPolicy: "no-referrer",
                    headers: {
                        "Authorization": `Ticket ${submitToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(encrypted),
                },
            );
            const body: unknown = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(readErrorMessage(body, "加密配置提交失败，请让机器人重新生成链接后重试。"));
            }

            const result = body as SubmitResult;
            if (
                !result?.code
                || !/^AGC(?:-[A-Z2-7]{4}){4}$/u.test(result.code)
                || !result.expires_at
                || !Number.isFinite(Date.parse(result.expires_at))
            ) {
                throw new Error("服务器没有返回有效配置码，请让机器人重新生成链接后重试。");
            }

            setApiKey("");
            setShowApiKey(false);
            submitTokenRef.current = "";
            setSubmitted(result);
            setPageState("success");
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "提交失败，请稍后重试。");
            setPageState("ready");
        }
    };

    const copyCode = async () => {
        if (!submitted) return;

        try {
            await navigator.clipboard.writeText(submitted.code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            setErrorMessage("浏览器未允许自动复制，请长按配置码手动复制。");
        }
    };

    if (pageState === "loading") {
        return (
            <ConfigShell>
                <Card className="mx-auto w-full max-w-xl border border-zinc-200/80 bg-white/90 shadow-xl shadow-primary/[0.05] dark:border-white/10 dark:bg-zinc-900/90">
                    <Card.Content className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
                        <Spinner size="lg" color="accent"/>
                        <div>
                            <p className="font-bold text-zinc-950 dark:text-white">正在验证一次性配置链接</p>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">不会读取或保存你的登录信息</p>
                        </div>
                    </Card.Content>
                </Card>
            </ConfigShell>
        );
    }

    if (pageState === "error") {
        return (
            <ConfigShell>
                <Card className="mx-auto w-full max-w-xl border border-zinc-200/80 bg-white/90 shadow-xl shadow-primary/[0.05] dark:border-white/10 dark:bg-zinc-900/90">
                    <Card.Header className="flex flex-col items-center gap-3 border-b border-zinc-200/70 p-7 text-center dark:border-white/10">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                            <KeyIcon className="h-6 w-6"/>
                        </div>
                        <Card.Title className="text-xl">无法打开配置链接</Card.Title>
                    </Card.Header>
                    <Card.Content className="p-6">
                        <Alert status="danger" className={`${alertToneClass.danger} border-l-[3px]`}>
                            <Alert.Content>
                                <Alert.Title>{errorMessage}</Alert.Title>
                                <Alert.Description>出于安全原因，配置链接不能重复使用，也不能在过期后恢复。</Alert.Description>
                            </Alert.Content>
                        </Alert>
                    </Card.Content>
                </Card>
            </ConfigShell>
        );
    }

    if (pageState === "success" && submitted) {
        return (
            <ConfigShell>
                <Card className="mx-auto w-full max-w-xl overflow-hidden border border-emerald-500/25 bg-white/95 shadow-2xl shadow-emerald-500/[0.07] dark:bg-zinc-900/95">
                    <div className="h-1 bg-gradient-to-r from-primary via-emerald-400 to-primary"/>
                    <Card.Header className="flex flex-col items-center gap-3 border-b border-zinc-200/70 p-7 text-center dark:border-white/10">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                            <ShieldIcon className="h-8 w-8"/>
                        </div>
                        <div>
                            <Card.Title className="text-2xl">配置已安全提交</Card.Title>
                            <Card.Description className="mt-1">API Key 已在浏览器内加密，服务器只能看到密文</Card.Description>
                        </div>
                    </Card.Header>
                    <Card.Content className="flex flex-col gap-5 p-6 sm:p-8">
                        <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-5 text-center dark:bg-primary/[0.08]">
                            <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">一次性配置码</div>
                            <div data-sentry-mask className="select-all break-all font-mono text-2xl font-black tracking-wider text-zinc-950 dark:text-white sm:text-3xl">
                                {submitted.code}
                            </div>
                            <Button className="mt-5 w-full sm:w-auto" variant="primary" onPress={() => void copyCode()}>
                                <CopyIcon className="h-4 w-4"/>
                                {copied ? "已复制" : "复制配置码"}
                            </Button>
                        </div>

                        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="mb-2 text-sm font-bold text-zinc-900 dark:text-white">下一步</div>
                            <ol className="space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                <li>1. 返回机器人刚才发来配置链接的 QQ 私聊。</li>
                                <li>2. 发送：<code className="rounded bg-zinc-200/70 px-1.5 py-0.5 font-mono text-primary dark:bg-white/10">/提交群API {submitted.code}</code></li>
                                <li>3. 等待机器人提示配置成功。</li>
                            </ol>
                        </div>

                        {errorMessage && (
                            <Alert status="warning" className={`${alertToneClass.warning} border-l-[3px]`}>
                                <Alert.Content><Alert.Title>{errorMessage}</Alert.Title></Alert.Content>
                            </Alert>
                        )}

                        <div className="flex items-center justify-between gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                            <span>配置码使用一次后立即失效</span>
                            <Chip size="sm" variant="soft" color={remaining === "0:00" ? "danger" : "warning"}>
                                剩余 {remaining}
                            </Chip>
                        </div>
                    </Card.Content>
                </Card>
            </ConfigShell>
        );
    }

    return (
        <ConfigShell>
            <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
                <Card className="overflow-hidden border border-zinc-200/80 bg-white/95 shadow-2xl shadow-primary/[0.06] dark:border-white/10 dark:bg-zinc-900/95">
                    <div className="h-1 bg-gradient-to-r from-primary via-sky-400 to-primary"/>
                    <Card.Header className="flex flex-col items-start gap-3 border-b border-zinc-200/70 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <KeyIcon className="h-6 w-6"/>
                            </div>
                            <div>
                                <Card.Title className="text-xl">配置本群大模型</Card.Title>
                                <Card.Description>配置只应用于发起链接的群聊</Card.Description>
                            </div>
                        </div>
                        <Chip size="sm" variant="soft" color={remaining === "0:00" ? "danger" : "warning"}>
                            链接剩余 {remaining}
                        </Chip>
                    </Card.Header>

                    <Card.Content className="p-6 sm:p-8">
                        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                            <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.06] p-4 dark:bg-sky-400/[0.07]">
                                <div className="font-bold text-zinc-950 dark:text-white">第一次配置？先认识这三个值</div>
                                <div className="mt-3 grid gap-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300 sm:grid-cols-3">
                                    <div>
                                        <span className="font-bold text-sky-700 dark:text-sky-300">Base URL</span>
                                        <p>大模型服务的“服务器地址”，告诉机器人把请求发到哪里。</p>
                                    </div>
                                    <div>
                                        <span className="font-bold text-sky-700 dark:text-sky-300">API Key</span>
                                        <p>调用服务的专用密钥，作用类似密码，用来识别账号并计算用量。</p>
                                    </div>
                                    <div>
                                        <span className="font-bold text-sky-700 dark:text-sky-300">模型名称</span>
                                        <p>要使用的具体模型 ID，决定机器人实际调用哪个模型。</p>
                                    </div>
                                </div>
                            </div>

                            <Select
                                fullWidth
                                isRequired
                                value={format}
                                onChange={(value) => handleFormatChange(String(value ?? ""))}
                                variant="secondary"
                            >
                                <Label>API 类型</Label>
                                <Select.Trigger>
                                    <Select.Value/>
                                    <Select.Indicator/>
                                </Select.Trigger>
                                <Description>{activeFormat.description}</Description>
                                <Select.Popover>
                                    <ListBox>
                                        {API_FORMATS.map((option) => (
                                            <ListBox.Item key={option.key} id={option.key} textValue={option.label}>
                                                {option.label}
                                            </ListBox.Item>
                                        ))}
                                    </ListBox>
                                </Select.Popover>
                            </Select>

                            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
                                <div className="font-bold text-zinc-900 dark:text-white">当前选择：{activeFormat.label}</div>
                                <p className="mt-1">{activeFormat.setupHint}</p>
                                <div className="mt-3 grid gap-2">
                                    <div>
                                        <span className="font-medium text-zinc-800 dark:text-zinc-100">地址示例：</span>{" "}
                                        <code className="break-all rounded bg-zinc-200/70 px-1.5 py-0.5 font-mono text-xs text-primary dark:bg-white/10">{activeFormat.defaultBaseUrl}</code>
                                    </div>
                                    <div>
                                        <span className="font-medium text-zinc-800 dark:text-zinc-100">模型示例：</span>{" "}
                                        {activeFormat.modelExample}
                                    </div>
                                </div>
                            </div>

                            <TextField isRequired isInvalid={Boolean(baseUrlError)}>
                                <Label>API Base URL</Label>
                                <Input
                                    fullWidth
                                    variant="secondary"
                                    inputMode="url"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    value={baseUrl}
                                    onChange={(event) => {
                                        setBaseUrl(event.target.value);
                                        if (baseUrlError) setBaseUrlError(undefined);
                                    }}
                                />
                                <Description>
                                    从服务商 API 文档复制基础地址，通常以 /v1 结尾；不要填写控制台网页地址，也不要加 /chat/completions。仅允许 HTTPS。
                                </Description>
                                {baseUrlError && <FieldError>{baseUrlError}</FieldError>}
                            </TextField>

                            <TextField isRequired data-sentry-block>
                                <Label>API Key</Label>
                                <div className="relative">
                                    <Input
                                        fullWidth
                                        variant="secondary"
                                        className="pr-20 font-mono"
                                        type={showApiKey ? "text" : "password"}
                                        autoComplete="off"
                                        autoCapitalize="none"
                                        spellCheck={false}
                                        placeholder="sk-..."
                                        value={apiKey}
                                        onChange={(event) => setApiKey(event.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-xs font-bold text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-white"
                                        onClick={() => setShowApiKey((value) => !value)}
                                        aria-label={showApiKey ? "隐藏 API Key" : "显示 API Key"}
                                    >
                                        {showApiKey ? "隐藏" : "显示"}
                                    </button>
                                </div>
                                <Description>{activeFormat.apiKeyDescription} 密钥只在当前页面内存中短暂存在，加密后才会发送。</Description>
                            </TextField>

                            <TextField isRequired>
                                <Label>模型名称</Label>
                                <Input
                                    fullWidth
                                    variant="secondary"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    placeholder={format === "anthropic" ? "claude-sonnet-4-6" : format === "vertex" ? "gemini-2.5-flash" : "gpt-4.1-mini"}
                                    value={model}
                                    onChange={(event) => setModel(event.target.value)}
                                />
                                <Description>
                                    填写服务商控制台或模型列表中的完整模型 ID，区分字母、数字、横线和 /；不要填写“GPT”“Claude”等简称。
                                </Description>
                            </TextField>

                            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                <div className="flex items-center justify-between gap-5">
                                    <div>
                                        <div className="font-medium text-zinc-900 dark:text-white">自定义主动发言概率</div>
                                        <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">关闭时跟随 Bot 的全局配置</div>
                                    </div>
                                    <Switch
                                        isSelected={customReplyProbability}
                                        onChange={(selected) => {
                                            setCustomReplyProbability(selected);
                                            if (!selected) setReplyProbabilityError(undefined);
                                        }}
                                        aria-label="自定义主动发言概率"
                                    >
                                        <Switch.Control><Switch.Thumb/></Switch.Control>
                                    </Switch>
                                </div>

                                {customReplyProbability && (
                                    <TextField className="mt-4" isRequired isInvalid={Boolean(replyProbabilityError)}>
                                        <Label>概率（0～0.1）</Label>
                                        <Input
                                            fullWidth
                                            variant="secondary"
                                            type="number"
                                            inputMode="decimal"
                                            min={0}
                                            max={0.1}
                                            step={0.001}
                                            value={replyProbability}
                                            onChange={(event) => {
                                                setReplyProbability(event.target.value);
                                                if (replyProbabilityError) setReplyProbabilityError(undefined);
                                            }}
                                        />
                                        <Description>0 表示关闭；0.01 约为 1%，用户可设置的上限为 0.1（10%）</Description>
                                        {replyProbabilityError && <FieldError>{replyProbabilityError}</FieldError>}
                                    </TextField>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-5 rounded-xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                <div>
                                    <div className="font-medium text-zinc-900 dark:text-white">启用图片理解</div>
                                    <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">模型文档明确写有视觉、多模态或图片输入能力时才开启；不确定可以先关闭</div>
                                </div>
                                <Switch isSelected={multimodal} onChange={setMultimodal} aria-label="启用图片理解">
                                    <Switch.Content>
                                        <Switch.Control><Switch.Thumb/></Switch.Control>
                                    </Switch.Content>
                                </Switch>
                            </div>

                            {errorMessage && (
                                <Alert status="danger" className={`${alertToneClass.danger} border-l-[3px]`}>
                                    <Alert.Content><Alert.Title>{errorMessage}</Alert.Title></Alert.Content>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                size="lg"
                                variant="primary"
                                className="w-full font-bold"
                                isDisabled={pageState === "submitting" || remaining === "0:00" || !apiKey.trim() || !model.trim() || !baseUrl.trim() || (customReplyProbability && !replyProbability.trim())}
                            >
                                {pageState === "submitting" ? <Spinner color="current" size="sm"/> : <ShieldIcon className="h-5 w-5"/>}
                                {pageState === "submitting" ? "正在本地加密并提交…" : "加密并生成配置码"}
                            </Button>
                        </form>
                    </Card.Content>
                </Card>

                <div className="flex flex-col gap-4 lg:sticky lg:top-24">
                    <Card variant="secondary" className="border border-zinc-200/80 bg-white/75 backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
                        <Card.Content className="flex flex-col gap-4 p-5">
                            <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white">
                                <ShieldIcon className="h-5 w-5 text-emerald-500"/>
                                密钥如何被保护
                            </div>
                            <div className="space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                <p>浏览器先使用随机 AES-256-GCM 密钥加密配置，再用机器人专属 RSA 公钥封装该密钥。</p>
                                <p>中转服务器不持有机器人私钥，无法解开你的 API Key。</p>
                            </div>
                        </Card.Content>
                    </Card>

                    <Alert status="warning" className={`${alertToneClass.warning} border-l-[3px]`}>
                        <Alert.Content>
                            <Alert.Title>请确认域名与 HTTPS</Alert.Title>
                            <Alert.Description>不要从陌生人转发的页面填写密钥。该链接提交一次后即失效。</Alert.Description>
                        </Alert.Content>
                    </Alert>

                    <Card variant="secondary" className="border border-zinc-200/80 bg-white/75 backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
                        <Card.Content className="p-5">
                            <div className="font-bold text-zinc-900 dark:text-white">去哪里找配置？</div>
                            <ol className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                <li><span className="font-bold text-primary">1.</span> 登录你购买或领取模型额度的服务商控制台。</li>
                                <li><span className="font-bold text-primary">2.</span> 在“API Key / 密钥管理”中创建并复制密钥。</li>
                                <li><span className="font-bold text-primary">3.</span> 在“API 文档 / 接口文档”中查找 Base URL。</li>
                                <li><span className="font-bold text-primary">4.</span> 在“模型列表”中复制模型 ID，并确认是否支持图片。</li>
                            </ol>
                            <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">三个值应来自同一家服务商；网页会员通常不等于 API 额度。</p>
                        </Card.Content>
                    </Card>

                    <div className="px-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                        为避免意外调用其他密钥，本群配置不会回退到机器人全局 API。
                    </div>
                </div>
            </div>
        </ConfigShell>
    );
}

function ConfigShell({children}: {children: React.ReactNode}) {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/70 dark:border-white/[0.08] dark:bg-black/85 dark:supports-[backdrop-filter]:bg-black/70">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <Logo className="h-8 w-8"/>
                        <span className="text-xl font-black text-zinc-950 dark:text-white">Mayumi</span>
                        <div className="hidden h-5 w-px bg-zinc-300 dark:bg-white/20 sm:block"/>
                        <span className="hidden text-sm font-bold text-zinc-500 dark:text-zinc-400 sm:block">群模型安全配置</span>
                    </div>
                    <ThemeSwitch/>
                </div>
            </header>

            <div className="pointer-events-none absolute inset-x-0 top-16 h-80 bg-primary/10 blur-3xl"/>
            <div className="pointer-events-none absolute left-1/2 top-32 h-80 w-80 -translate-x-1/2 rounded-full bg-sky-400/[0.07] blur-3xl"/>
            <main className="relative mx-auto w-full px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8">
                {children}
            </main>
        </div>
    );
}
