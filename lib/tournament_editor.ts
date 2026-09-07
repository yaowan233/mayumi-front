import StarterKit from "@tiptap/starter-kit";
import {Markdown} from "@tiptap/markdown";
import Image from "@tiptap/extension-image";
import {TableKit} from "@tiptap/extension-table";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";

export function tournamentEditorExtensions(placeholder = "从这里开始编写比赛规则…") {
    return [
        StarterKit.configure({underline: false, link: {openOnClick: false}}),
        Image.configure({inline: true}),
        TableKit.configure({table: {resizable: false}}),
        TaskList,
        TaskItem.configure({nested: true}),
        Placeholder.configure({placeholder}),
        Markdown.configure({markedOptions: {gfm: true, breaks: true}}),
    ];
}

export function normalizeEditorUrl(value: string, image = false): string | null {
    try {
        const url = new URL(value.trim());
        const allowed = image ? ["https:", "http:"] : ["https:", "http:", "mailto:"];
        return allowed.includes(url.protocol) ? url.href : null;
    } catch {
        return null;
    }
}
