"use client";

import {Button, Input, Label, Modal, TextField} from "@heroui/react";
import {EditorContent, useEditor} from "@tiptap/react";
import {useDeferredValue, useEffect, useId, useRef, useState} from "react";
import {TournamentMarkdown} from "@/components/tournament_markdown";
import {normalizeEditorUrl, tournamentEditorExtensions} from "@/lib/tournament_editor";
import styles from "./markdown_editor.module.css";

type Mode = "visual" | "source" | "preview";
type InsertKind = "link" | "image" | "table";
const modes: {key: Mode; label: string}[] = [
    {key: "visual", label: "可视编辑"}, {key: "source", label: "Markdown"}, {key: "preview", label: "预览"},
];

export function MarkdownEditor({label, value, onChange, errorMessage, isRequired, placeholder}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    errorMessage?: string;
    isRequired?: boolean;
    placeholder?: string;
}) {
    const id = useId();
    const [mode, setMode] = useState<Mode>("visual");
    const [expanded, setExpanded] = useState(false);
    const [insertKind, setInsertKind] = useState<InsertKind | null>(null);
    const [linkText, setLinkText] = useState("");
    const [url, setUrl] = useState("");
    const [rows, setRows] = useState(3);
    const [columns, setColumns] = useState(2);
    const [insertError, setInsertError] = useState("");
    const [selection, setSelection] = useState({from: 0, to: 0});
    const appliedValue = useRef(value);
    const preview = useDeferredValue(value);

    const editor = useEditor({
        extensions: tournamentEditorExtensions(placeholder),
        content: value,
        contentType: "markdown",
        immediatelyRender: false,
        shouldRerenderOnTransaction: true,
        editorProps: {
            attributes: {
                role: "textbox",
                "aria-label": label,
                "aria-multiline": "true",
                "aria-required": String(Boolean(isRequired)),
                "aria-invalid": String(Boolean(errorMessage)),
                "aria-describedby": `${id}-hint${errorMessage ? ` ${id}-error` : ""}`,
                class: "prose max-w-none text-base dark:prose-invert prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg",
            },
        },
        onUpdate: ({editor: updated}) => {
            const markdown = updated.isEmpty ? "" : updated.getMarkdown();
            appliedValue.current = markdown;
            onChange(markdown);
        },
    });

    useEffect(() => {
        if (!editor || value === appliedValue.current) return;
        // Apply source edits and loaded drafts without resetting visual undo
        // history after every keystroke or rewriting untouched Markdown.
        editor.commands.setContent(value, {contentType: "markdown", emitUpdate: false});
        appliedValue.current = value;
    }, [editor, value]);

    const openInsert = (kind: InsertKind) => {
        if (!editor) return;
        if (kind === "link") editor.commands.extendMarkRange("link");
        const {from, to} = editor.state.selection;
        setSelection({from, to});
        setLinkText(kind === "image" ? editor.getAttributes("image").alt || "" : editor.state.doc.textBetween(from, to));
        setUrl(kind === "link" ? editor.getAttributes("link").href || "" : kind === "image" ? editor.getAttributes("image").src || "" : "");
        setInsertError("");
        setInsertKind(kind);
    };

    const insert = () => {
        if (!editor || !insertKind) return;
        const chain = editor.chain().focus().setTextSelection(selection);
        if (insertKind === "table") {
            chain.insertTable({rows, cols: columns, withHeaderRow: true}).run();
        } else {
            const href = normalizeEditorUrl(url, insertKind === "image");
            if (!href) {
                setInsertError(insertKind === "image" ? "请填写以 https:// 或 http:// 开头的图片地址" : "请填写完整网址，例如 https://example.com");
                return;
            }
            if (insertKind === "image") {
                chain.setImage({src: href, alt: linkText.trim()}).run();
            } else if (selection.from !== selection.to && linkText === editor.state.doc.textBetween(selection.from, selection.to)) {
                chain.setLink({href}).run();
            } else {
                chain.insertContent({type: "text", text: linkText.trim() || href, marks: [{type: "link", attrs: {href}}]}).run();
            }
        }
        setInsertKind(null);
    };

    const tool = (name: string, text: string, run: () => void, active?: boolean, disabled = false) => (
        <span key={name} title={name}>
            <Button type="button" size="sm" variant={active ? "secondary" : "ghost"} aria-label={name} aria-pressed={active} isDisabled={!editor || disabled} onPress={run}>
                {text}
            </Button>
        </span>
    );

    const surface = (
        <div className={`min-w-0 overflow-hidden rounded-xl border ${errorMessage ? "border-danger" : "border-default-200 dark:border-white/10"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-default-200 bg-default-100/50 px-3 py-2 dark:border-white/10">
                <div role="group" aria-label={`${label}编辑模式`} className="flex gap-1">
                    {modes.map(item => <Button key={item.key} type="button" size="sm" variant={mode === item.key ? "secondary" : "ghost"} aria-pressed={mode === item.key} onPress={() => setMode(item.key)}>{item.label}</Button>)}
                </div>
                <span className="px-1 text-xs text-default-500">{mode === "visual" ? "直接编辑正文，无需输入格式符号" : mode === "source" ? "适合粘贴或精细修改 Markdown" : "公开页面的排版效果"}</span>
            </div>

            {mode === "visual" && <>
                <div role="group" aria-label={`${label}格式工具`} className="flex flex-wrap items-center gap-1 border-b border-default-200 p-2 dark:border-white/10">
                    {tool("撤销 (Ctrl/⌘ Z)", "↶", () => editor?.chain().focus().undo().run(), undefined, !editor?.can().undo())}
                    {tool("重做 (Ctrl/⌘ Shift Z)", "↷", () => editor?.chain().focus().redo().run(), undefined, !editor?.can().redo())}
                    <span className="mx-1 h-5 border-l border-default-200 dark:border-white/10"/>
                    <select aria-label="段落格式" className="h-8 max-w-28 rounded-lg bg-default-100 px-2 text-sm text-foreground outline-primary"
                        value={editor?.isActive("heading") ? String(editor.getAttributes("heading").level) : "0"}
                        onChange={event => {
                            const level = Number(event.target.value) as 1 | 2 | 3 | 4 | 5 | 6;
                            if (level) editor?.chain().focus().setHeading({level}).run();
                            else editor?.chain().focus().setParagraph().run();
                        }}
                    ><option value="0">正文</option><option value="1">一级标题</option><option value="2">二级标题</option><option value="3">三级标题</option><option value="4">四级标题</option><option value="5">五级标题</option><option value="6">六级标题</option></select>
                    {tool("加粗 (Ctrl/⌘ B)", "加粗", () => editor?.chain().focus().toggleBold().run(), editor?.isActive("bold"))}
                    {tool("斜体 (Ctrl/⌘ I)", "斜体", () => editor?.chain().focus().toggleItalic().run(), editor?.isActive("italic"))}
                    {tool("删除线", "删除线", () => editor?.chain().focus().toggleStrike().run(), editor?.isActive("strike"))}
                    {tool("无序列表", "• 列表", () => editor?.chain().focus().toggleBulletList().run(), editor?.isActive("bulletList"))}
                    {tool("有序列表", "1. 列表", () => editor?.chain().focus().toggleOrderedList().run(), editor?.isActive("orderedList"))}
                    {tool("引用", "引用", () => editor?.chain().focus().toggleBlockquote().run(), editor?.isActive("blockquote"))}
                    {tool("插入或编辑链接", "链接", () => openInsert("link"), editor?.isActive("link"))}
                    {tool("插入图片", "图片", () => openInsert("image"), editor?.isActive("image"))}
                    {tool("插入表格", "表格", () => openInsert("table"))}
                    {tool("插入分隔线", "分隔线", () => editor?.chain().focus().setHorizontalRule().run())}
                    {tool("清除格式", "清除格式", () => editor?.chain().focus().unsetAllMarks().clearNodes().run())}
                </div>
                {editor?.isActive("table") && <div role="group" aria-label="表格操作" className="flex flex-wrap items-center gap-1 border-b border-default-200 bg-primary/5 px-2 py-1 dark:border-white/10">
                    <span className="px-2 text-xs text-default-500">当前表格</span>
                    {tool("在下方增加一行", "+ 行", () => editor.chain().focus().addRowAfter().run())}
                    {tool("在右侧增加一列", "+ 列", () => editor.chain().focus().addColumnAfter().run())}
                    {tool("删除当前行", "删行", () => editor.chain().focus().deleteRow().run())}
                    {tool("删除当前列", "删列", () => editor.chain().focus().deleteColumn().run())}
                    {tool("删除表格", "删除表格", () => editor.chain().focus().deleteTable().run())}
                    <span className="px-2 text-xs text-default-500">Tab 切换单元格</span>
                </div>}
            </>}

            <div className={`overflow-auto ${expanded ? "h-[60vh]" : "max-h-[36rem]"}`}>
                {mode === "visual" && <div className={styles.document}>{editor ? <EditorContent editor={editor}/> : <p className="p-6 text-sm text-default-400">正在准备编辑器…</p>}</div>}
                {mode === "source" && <textarea
                    aria-label={`${label} Markdown 源码`} aria-required={isRequired} aria-invalid={Boolean(errorMessage)}
                    className="block min-h-96 w-full resize-y bg-transparent p-6 font-mono text-sm leading-7 text-foreground outline-primary"
                    spellCheck={false} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}
                />}
                {mode === "preview" && <section aria-label={`${label}预览`} className="min-h-96 p-6">
                    {value.trim() ? <TournamentMarkdown>{preview}</TournamentMarkdown> : <p className="py-20 text-center text-sm text-default-400">还没有内容，切换到可视编辑开始编写。</p>}
                </section>}
            </div>
            <div id={`${id}-hint`} className="flex flex-wrap justify-between gap-2 border-t border-default-200 px-4 py-2 text-xs text-default-500 dark:border-white/10">
                <span>{mode === "visual" ? "选中文字设置格式 · 回车继续列表 · Ctrl/⌘ Z 撤销" : "切换模式会保留当前内容"}</span>
                <span>{value.length.toLocaleString()} 字符</span>
            </div>
            {errorMessage && <p id={`${id}-error`} role="alert" className="px-4 pb-3 text-sm text-danger">{errorMessage}</p>}
        </div>
    );

    return (
        <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{label}{isRequired && <span className="ml-1 text-danger">*</span>}</span>
                <Modal isOpen={expanded} onOpenChange={setExpanded}>
                    <Button type="button" size="sm" variant="secondary">放大编辑</Button>
                    <Modal.Backdrop><Modal.Container size="cover" scroll="inside"><Modal.Dialog>
                        <Modal.CloseTrigger/>
                        <Modal.Header><Modal.Heading>{label}</Modal.Heading></Modal.Header>
                        <Modal.Body>{expanded && surface}</Modal.Body>
                        <Modal.Footer>
                            <p className="mr-auto text-xs text-default-500">关闭后保留内容，回到页面保存草稿或发布。</p>
                            <Button type="button" variant="primary" onPress={() => setExpanded(false)}>完成编辑</Button>
                        </Modal.Footer>
                    </Modal.Dialog></Modal.Container></Modal.Backdrop>
                </Modal>
            </div>
            {!expanded && surface}

            <Modal isOpen={insertKind !== null} onOpenChange={open => {if (!open) setInsertKind(null);}}>
                <Modal.Backdrop><Modal.Container><Modal.Dialog>
                    <Modal.CloseTrigger/>
                    <Modal.Header><Modal.Heading>{insertKind === "table" ? "插入表格" : insertKind === "image" ? "插入图片" : "设置链接"}</Modal.Heading></Modal.Header>
                    <form onSubmit={event => {event.preventDefault(); insert();}}>
                        <Modal.Body className="flex flex-col gap-4">
                            {insertKind === "table" ? <>
                                <p className="text-sm text-default-500">第一行作为表头，插入后直接点击单元格填写。</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <TextField><Label>行数（含表头）</Label><Input type="number" min={2} max={20} value={String(rows)} onChange={event => setRows(Math.max(2, Math.min(20, Number(event.target.value) || 2)))}/></TextField>
                                    <TextField><Label>列数</Label><Input type="number" min={1} max={8} value={String(columns)} onChange={event => setColumns(Math.max(1, Math.min(8, Number(event.target.value) || 1)))}/></TextField>
                                </div>
                            </> : <>
                                <TextField><Label>{insertKind === "image" ? "图片说明" : "显示文字"}</Label><Input value={linkText} onChange={event => setLinkText(event.target.value)} placeholder={insertKind === "image" ? "例如：赛事流程图" : "例如：报名入口"}/></TextField>
                                <TextField isRequired isInvalid={Boolean(insertError)}><Label>{insertKind === "image" ? "图片地址" : "链接地址"}</Label><Input autoFocus value={url} onChange={event => {setUrl(event.target.value); setInsertError("");}} placeholder="https://…"/></TextField>
                                {insertError && <p role="alert" className="text-sm text-danger">{insertError}</p>}
                            </>}
                        </Modal.Body>
                        <Modal.Footer>
                            {insertKind === "link" && editor?.isActive("link") && <Button type="button" variant="ghost" onPress={() => {editor.chain().focus().setTextSelection(selection).unsetLink().run(); setInsertKind(null);}}>移除链接</Button>}
                            <Button type="button" variant="ghost" onPress={() => setInsertKind(null)}>取消</Button>
                            <Button type="submit" variant="primary">{insertKind === "link" ? "确定" : "插入"}</Button>
                        </Modal.Footer>
                    </form>
                </Modal.Dialog></Modal.Container></Modal.Backdrop>
            </Modal>
        </div>
    );
}
