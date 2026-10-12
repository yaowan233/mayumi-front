import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { serverDataCollection } from "../lib/sentry_data_collection.ts";

const Sentry: typeof import("@sentry/nextjs") = createRequire(import.meta.url)("@sentry/nextjs");

test("Sentry 11 server requests retain filtering without enabling body or AI collection", async () => {
    const client = new Sentry.NodeClient({
        enabled: false,
        dataCollection: serverDataCollection,
        integrations: [],
        stackParser: Sentry.defaultStackParser,
        transport: () => ({ send: async () => ({ statusCode: 200 }), flush: async () => true }),
    });
    try {
        const event = await Sentry.requestDataIntegration().processEvent!({
            sdkProcessingMetadata: {
                normalizedRequest: {
                    url: "https://example.test/api?token=test-secret&mode=osu",
                    method: "POST",
                    headers: {
                        "x-forwarded-for": "192.0.2.1",
                        authorization: "Bearer test-secret",
                        "content-type": "application/json",
                    },
                    cookies: { session: "test-secret", preference: "dark" },
                },
                ipAddress: "192.0.2.1",
            },
        }, {}, client);
        assert.equal(event?.user?.ip_address, undefined);
        assert.equal(event?.request?.headers?.["x-forwarded-for"], undefined);
        assert.equal(event?.request?.headers?.authorization, "[Filtered]");
        assert.equal(event?.request?.headers?.["content-type"], "application/json");
        assert.equal(event?.request?.cookies?.session, "[Filtered]");
        assert.equal(event?.request?.cookies?.preference, "dark");
        assert.equal(new URL(event!.request!.url!).searchParams.get("token"), "[Filtered]");
        const policy = client.getDataCollectionOptions();
        assert.deepEqual(policy.httpBodies, []);
        assert.deepEqual(policy.genAI, { inputs: false, outputs: false });
        assert.equal(policy.databaseQueryData, false);
        assert.equal(policy.queues, false);
    } finally {
        await client.close();
    }
});

function runClientInstrumentation(url: string) {
    const window = {
        location: new URL(url),
        __MAYUMI_GROUP_CONFIG_SUBMIT_TOKEN__: undefined as string | undefined,
        history: {
            replaceState(_data: unknown, _unused: string, path: string) {
                window.location = new URL(path, window.location.origin);
            },
        },
    };
    const initializations: { options: import("@sentry/nextjs").BrowserOptions; hash: string; token?: string }[] = [];
    const source = readFileSync(new URL("../instrumentation-client.js", import.meta.url), "utf8")
        .replace(/^import .*;\r?$/gmu, "")
        .replace(/^export const onRouterTransitionStart = .*;\r?$/gmu, "");
    runInNewContext(source, {
        window,
        URLSearchParams,
        Sentry: {
            init(options: import("@sentry/nextjs").BrowserOptions) {
                initializations.push({ options, hash: window.location.hash, token: window.__MAYUMI_GROUP_CONFIG_SUBMIT_TOKEN__ });
            },
            replayIntegration: () => ({ name: "Replay" }),
            feedbackIntegration: () => ({ name: "Feedback" }),
        },
    });
    assert.equal(initializations.length, 1);
    return initializations[0];
}

test("configuration submit tokens are removed before initialization and telemetry stays disabled", () => {
    const { options, hash, token } = runClientInstrumentation("https://example.test/config/123#token=one-time-secret");
    assert.equal(hash, "");
    assert.equal(token, "one-time-secret");
    assert.equal(options.enabled, false);
    assert.equal(options.dataCollection?.userInfo, false);
    assert.equal((options.integrations as unknown[]).length, 0);
    assert.equal(options.tracesSampleRate, 0);
    assert.equal(options.replaysSessionSampleRate, 0);
    assert.equal(options.replaysOnErrorSampleRate, 0);
});

test("ordinary pages retain the existing telemetry opt-in and Replay sampling", () => {
    const { options } = runClientInstrumentation("https://example.test/tournaments/123/home");
    assert.equal(options.enabled, true);
    assert.equal(options.dataCollection?.userInfo, true);
    assert.equal((options.integrations as unknown[]).length, 2);
    assert.equal(options.tracesSampleRate, 1);
    assert.equal(options.replaysSessionSampleRate, 0.1);
    assert.equal(options.replaysOnErrorSampleRate, 1);
});
