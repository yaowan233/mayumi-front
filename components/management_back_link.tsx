import Link from "next/link";

export function ManagementBackLink({tournament}: { tournament: string }) {
    return (
        <Link
            href={`/tournament-management/${encodeURIComponent(tournament)}`}
            className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-default-500 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
            <svg
                aria-hidden="true"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="m15 18-6-6 6-6"/>
            </svg>
            返回管理控制台
        </Link>
    );
}
