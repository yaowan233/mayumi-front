import * as Sentry from "@sentry/nextjs";
Sentry.init({
  dsn: "https://d703c7ec4a4ead7ec5252a6d7b7c3274@o4505384033189888.ingest.us.sentry.io/4506771213647872",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,
});