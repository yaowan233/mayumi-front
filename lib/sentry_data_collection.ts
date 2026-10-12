import type { init } from "@sentry/nextjs";

// Preserve the installed v10 SDK's sendDefaultPii:false policy on the server
// and Edge runtime. v11 otherwise enables user info, HTTP bodies and AI data.
const piiHeaderSnippets = ["forwarded", "-ip", "remote-", "via", "-user"];

export const serverDataCollection: NonNullable<Parameters<typeof init>[0]["dataCollection"]> = {
    userInfo: false,
    cookies: { deny: piiHeaderSnippets },
    httpHeaders: {
        request: { deny: piiHeaderSnippets },
        response: { deny: piiHeaderSnippets },
    },
    httpBodies: [],
    urlQueryParams: { deny: piiHeaderSnippets },
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    queues: false,
    graphQL: { document: true, variables: true },
    stackFrameVariables: true,
    frameContextLines: 7,
};
