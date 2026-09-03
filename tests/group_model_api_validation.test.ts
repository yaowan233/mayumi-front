import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

import {
    GroupModelApiConnectionError,
    testGroupModelApiConnection,
} from "../lib/group_model_api_validation.ts";

type CapturedRequest = {
    body: Record<string, unknown>;
    headers: Headers;
    url: string;
};

function response(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {"Content-Type": "application/json"},
    });
}

test("the form tests the model connection before generating a configuration code", () => {
    const source = readFileSync(
        new URL("../components/group_model_config_form.tsx", import.meta.url),
        "utf8",
    );
    const start = source.indexOf("const handleSubmit = async");
    const end = source.indexOf("const handleSubmitWithoutBrowserTest");
    const flow = source.slice(start, end);

    assert.ok(start >= 0 && end > start, "could not find the form submission flow");
    assert.ok(flow.indexOf("await testGroupModelApiConnection") >= 0, "connection test is missing");
    assert.ok(
        flow.indexOf("await testGroupModelApiConnection") < flow.indexOf("await submitEncryptedPayload"),
        "configuration was submitted before the connection test",
    );
});

test("the configuration-page CSP permits direct HTTPS provider checks", () => {
    const source = readFileSync(new URL("../next.config.js", import.meta.url), "utf8");
    assert.match(source, /const connectSources = \[[^\]]*"https:"/u);
});

test("OpenAI compatible credentials are tested with a real chat request", async () => {
    let captured: CapturedRequest | undefined;
    const fetchImpl: typeof fetch = async (input, init) => {
        captured = {
            url: String(input),
            headers: new Headers(init?.headers),
            body: JSON.parse(String(init?.body)) as Record<string, unknown>,
        };
        return response({choices: [{message: {content: "OK"}}]});
    };

    await testGroupModelApiConnection({
        apiFormat: "openai",
        baseUrl: "https://provider.example/v1/",
        apiKey: "sk-browser-secret",
        model: "test-model",
        multimodal: false,
    }, {fetchImpl});

    assert.ok(captured);
    assert.equal(captured.url, "https://provider.example/v1/chat/completions");
    assert.equal(captured.headers.get("authorization"), "Bearer sk-browser-secret");
    assert.equal(captured.body.model, "test-model");
    assert.deepEqual(captured.body.messages, [{role: "user", content: "请只回复 OK"}]);
});

test("the browser test checks declared OpenAI image support", async () => {
    let body: Record<string, unknown> | undefined;
    const fetchImpl: typeof fetch = async (_input, init) => {
        body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return response({choices: [{message: {content: "OK"}}]});
    };

    await testGroupModelApiConnection({
        apiFormat: "openai",
        baseUrl: "https://provider.example/v1",
        apiKey: "key",
        model: "vision-model",
        multimodal: true,
    }, {fetchImpl});

    const messages = body?.messages as Array<{content: Array<{type: string}>}>;
    assert.ok(messages[0].content.some((part) => part.type === "image_url"));
});

test("Anthropic credentials use the Messages API and browser opt-in header", async () => {
    let captured: CapturedRequest | undefined;
    const fetchImpl: typeof fetch = async (input, init) => {
        captured = {
            url: String(input),
            headers: new Headers(init?.headers),
            body: JSON.parse(String(init?.body)) as Record<string, unknown>,
        };
        return response({content: [{type: "text", text: "OK"}]});
    };

    await testGroupModelApiConnection({
        apiFormat: "anthropic",
        baseUrl: "https://api.anthropic.com",
        apiKey: "sk-ant-secret",
        model: "claude-test",
        multimodal: false,
    }, {fetchImpl});

    assert.ok(captured);
    assert.equal(captured.url, "https://api.anthropic.com/v1/messages");
    assert.equal(captured.headers.get("x-api-key"), "sk-ant-secret");
    assert.equal(captured.headers.get("anthropic-version"), "2023-06-01");
    assert.equal(captured.headers.get("anthropic-dangerous-direct-browser-access"), "true");
});

test("Vertex Express credentials use the same resource shape as the plugin SDK", async () => {
    let captured: CapturedRequest | undefined;
    const fetchImpl: typeof fetch = async (input, init) => {
        captured = {
            url: String(input),
            headers: new Headers(init?.headers),
            body: JSON.parse(String(init?.body)) as Record<string, unknown>,
        };
        return response({candidates: [{content: {parts: [{text: "OK"}]}}]});
    };

    await testGroupModelApiConnection({
        apiFormat: "vertex",
        baseUrl: "https://aiplatform.googleapis.com",
        apiKey: "vertex-secret",
        model: "google/gemini-test",
        multimodal: false,
    }, {fetchImpl});

    assert.ok(captured);
    assert.equal(
        captured.url,
        "https://aiplatform.googleapis.com/v1beta1/publishers/google/models/gemini-test:generateContent",
    );
    assert.equal(captured.headers.get("x-goog-api-key"), "vertex-secret");
});

test("provider errors are actionable and never echo the API key", async () => {
    const apiKey = "sk-do-not-echo";
    const fetchImpl: typeof fetch = async () => response({
        error: {message: `invalid key ${apiKey}`},
    }, 401);

    await assert.rejects(
        testGroupModelApiConnection({
            apiFormat: "openai",
            baseUrl: "https://provider.example/v1",
            apiKey,
            model: "test-model",
            multimodal: false,
        }, {fetchImpl}),
        (error: unknown) => {
            assert.ok(error instanceof GroupModelApiConnectionError);
            assert.equal(error.reason, "provider_rejected");
            assert.match(error.message, /API Key 无效或没有调用权限/u);
            assert.doesNotMatch(error.message, new RegExp(apiKey, "u"));
            return true;
        },
    );
});

test("CORS and browser network failures are distinguished from invalid credentials", async () => {
    const fetchImpl: typeof fetch = async () => {
        throw new TypeError("Failed to fetch");
    };

    await assert.rejects(
        testGroupModelApiConnection({
            apiFormat: "openai",
            baseUrl: "https://provider.example/v1",
            apiKey: "key",
            model: "test-model",
            multimodal: false,
        }, {fetchImpl}),
        (error: unknown) => {
            assert.ok(error instanceof GroupModelApiConnectionError);
            assert.equal(error.reason, "browser_blocked");
            assert.match(error.message, /跨域/u);
            return true;
        },
    );
});
