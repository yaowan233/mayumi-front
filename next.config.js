const { withSentryConfig } = require("@sentry/nextjs");
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 't.mwm.moe',
                port: '',
                pathname: '/moe',
            },
            {
                protocol: 'https',
                hostname: 'assets.ppy.sh',
                port: '',
                pathname: '/',
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

    silent: false, // Can be used to suppress logs
});
