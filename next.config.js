const {withSentryConfig} = require("@sentry/nextjs");
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        qualities: [10, 25, 50, 75, 80, 90, 100],

        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: '**',
            },
        ],
    },
}

// Make sure adding Sentry options is the last code to run before exporting
module.exports = withSentryConfig(nextConfig, {
    org: "yaowan233",
    project: "mayumi",

    // An auth token is required for uploading source maps.
    authToken: process.env.SENTRY_AUTH_TOKEN,
    hideSourceMaps: true,
    silent: false, // Can be used to suppress logs
});
