import "server-only";

// Server requests may use the loopback/internal service address; browsers cannot.
export function backendServerUrl(): string {
    return (process.env.BACKEND_INTERNAL_URL
        || process.env.NEXT_PUBLIC_BACKEND_URL
        || "http://localhost:8421").replace(/\/$/, "");
}
