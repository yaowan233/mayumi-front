import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

export function TournamentMarkdown({children}: {children: string}) {
    return (
        <article className="prose max-w-none break-words font-sans text-lg tracking-wide dark:prose-invert prose-p:font-medium prose-p:leading-loose prose-p:text-gray-700 dark:prose-p:text-gray-200 prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-black prose-strong:text-gray-900 dark:prose-strong:text-white prose-li:text-gray-700 dark:prose-li:text-gray-200 prose-pre:overflow-x-auto prose-img:rounded-lg">
            <Markdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                    a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer"/>,
                    table: ({node, ...props}) => <div className="overflow-x-auto"><table {...props}/></div>,
                }}
            >
                {children}
            </Markdown>
        </article>
    );
}
