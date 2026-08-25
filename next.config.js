const {withSentryConfig} = require("@sentry/nextjs");

const backendOrigin = (() => {
    try {
        return new URL(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8421").origin;
    } catch {
        return "http://localhost:8421";
    }
})();

const connectSources = ["'self'", backendOrigin];
const scriptSources = ["'self'", "'unsafe-inline'"];
if (process.env.NODE_ENV !== "production") {
    connectSources.push("http://localhost:*", "ws://localhost:*", "http://127.0.0.1:*", "ws://127.0.0.1:*");
    scriptSources.push("'unsafe-eval'");
}

const configPageCsp = [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "worker-src 'self' blob:",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: "/config/:path*",
                headers: [
                    {key: "Cache-Control", value: "no-store, max-age=0"},
                    {key: "Content-Security-Policy", value: configPageCsp},
                    {key: "Cross-Origin-Opener-Policy", value: "same-origin"},
                    {key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()"},
                    {key: "Referrer-Policy", value: "no-referrer"},
                    {key: "X-Content-Type-Options", value: "nosniff"},
                    {key: "X-Frame-Options", value: "DENY"},
                    {key: "X-Robots-Tag", value: "noindex, nofollow, noarchive"},
                ],
            },
        ];
    },
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
