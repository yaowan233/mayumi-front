export type GroupModelApiFormat = "openai" | "anthropic" | "vertex";

export interface GroupModelPayload {
    schema_version: 1;
    ticket_id: string;
    api_format: GroupModelApiFormat;
    base_url: string;
    api_key: string;
    chat_model: string;
    chat_multimodal: boolean;
    allow_global_fallback: false;
    created_at: string;
}

export interface EncryptedGroupModelEnvelope {
    protocol_version: 1;
    ticket_id: string;
    key_id: string;
    wrapped_key: string;
    nonce: string;
    ciphertext: string;
}

function toBase64Url(value: ArrayBuffer): string {
    const bytes = new Uint8Array(value);
    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return window.btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

export async function encryptGroupModelPayload({
    payload,
    instanceId,
    keyId,
    publicKeyJwk,
}: {
    payload: GroupModelPayload;
    instanceId: string;
    keyId: string;
    publicKeyJwk: JsonWebKey;
}): Promise<EncryptedGroupModelEnvelope> {
    if (!window.crypto?.subtle) {
        throw new Error("当前浏览器不支持安全加密，请使用最新版 Chrome、Edge、Firefox 或 Safari。");
    }

    const publicKey = await window.crypto.subtle.importKey(
        "jwk",
        publicKeyJwk,
        {name: "RSA-OAEP", hash: "SHA-256"},
        false,
        ["encrypt"],
    );
    const dataKey = await window.crypto.subtle.generateKey(
        {name: "AES-GCM", length: 256},
        true,
        ["encrypt"],
    );
    const nonce = window.crypto.getRandomValues(new Uint8Array(12));
    const aad = new TextEncoder().encode(
        `ai-groupmate-config:v1:${payload.ticket_id}:${instanceId}:${keyId}`,
    );
    const plaintext = new TextEncoder().encode(JSON.stringify(payload));
    const ciphertext = await window.crypto.subtle.encrypt(
        {name: "AES-GCM", iv: nonce, additionalData: aad, tagLength: 128},
        dataKey,
        plaintext,
    );
    const rawDataKey = await window.crypto.subtle.exportKey("raw", dataKey);
    const encryptedKey = await window.crypto.subtle.encrypt(
        {name: "RSA-OAEP"},
        publicKey,
        rawDataKey,
    );

    return {
        protocol_version: 1,
        ticket_id: payload.ticket_id,
        key_id: keyId,
        wrapped_key: toBase64Url(encryptedKey),
        nonce: toBase64Url(nonce.buffer),
        ciphertext: toBase64Url(ciphertext),
    };
}
