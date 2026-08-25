import * as Sentry from "@sentry/nextjs";

const isGroupModelConfigPage = /^\/config\/[^/]+\/?$/u.test(window.location.pathname);

// Read the fragment before telemetry starts. Fragments are not sent to the
// server, and this keeps the one-time submit token out of Sentry navigation,
// tracing, feedback screenshots, and Replay data as well.
if (isGroupModelConfigPage) {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const submitToken = fragment.get("token")?.trim();
  if (submitToken) {
    window.__MAYUMI_GROUP_CONFIG_SUBMIT_TOKEN__ = submitToken;
  }
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

Sentry.init({
  enabled: !isGroupModelConfigPage,
  dsn: "https://d703c7ec4a4ead7ec5252a6d7b7c3274@o4505384033189888.ingest.us.sentry.io/4506771213647872",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: !isGroupModelConfigPage,
  integrations: isGroupModelConfigPage ? [] : [
    // Replay may only be enabled for the client-side
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
    }),
  ],
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: isGroupModelConfigPage ? 0 : 1.0,
  // Capture Replay for 10% of all
  // plus for 100% of sessions with an error
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
  replaysSessionSampleRate: isGroupModelConfigPage ? 0 : 0.1,
  replaysOnErrorSampleRate: isGroupModelConfigPage ? 0 : 1.0,
});
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
