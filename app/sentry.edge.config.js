import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: 'https://b0873992335f201f0131d68424908a36@o4505384033189888.ingest.us.sentry.io/4506771213647872',

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,

    // ...

    // Note: if you want to override the automatic release value, do not set a
    // `release` value here - use the environment variable `SENTRY_RELEASE`, so
    // that it will also get attached to your source maps
});
