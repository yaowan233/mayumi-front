import assert from "node:assert/strict";
import test from "node:test";
import {MarkdownManager} from "@tiptap/markdown";
import {normalizeEditorUrl, tournamentEditorExtensions} from "../lib/tournament_editor.ts";

const manager = new MarkdownManager({
    extensions: tournamentEditorExtensions(),
    markedOptions: {gfm: true, breaks: true},
});

test("rules retain headings, marks, lists, links and images across visual editing", () => {
    const original = "## 规则\n\n**加粗**、*斜体*、~~删除线~~和 `代码`。\n\n- 签到\n- 比赛\n\n[官网](https://mayumi.xyz)\n\n![流程图](https://example.com/image.png)";
    const parsed = manager.parse(original);
    assert.deepEqual(manager.parse(manager.serialize(parsed)), parsed);
});

test("tables and task lists retain their content after Markdown serialization", () => {
    const original = "| 轮次 | 时间 |\n| --- | --- |\n| 资格赛 | 9/14 |\n\n- [x] 已报名\n- [ ] 待签到";
    const parsed = manager.parse(original);
    const serialized = manager.serialize(parsed);
    assert.ok(serialized.includes("资格赛"));
    assert.ok(serialized.includes("9/14"));
    assert.ok(serialized.includes("[x]"));
    assert.deepEqual(manager.parse(serialized), parsed);
});

test("single line breaks match the public renderer", () => {
    const parsed = manager.parse("第一行\n第二行");
    assert.ok(JSON.stringify(parsed).includes('"hardBreak"'));
    assert.deepEqual(manager.parse(manager.serialize(parsed)), parsed);
});

test("URL dialogs accept supported addresses and reject malformed or executable URLs", () => {
    assert.equal(normalizeEditorUrl(" https://example.com/rules "), "https://example.com/rules");
    assert.equal(normalizeEditorUrl("mailto:host@example.com"), "mailto:host@example.com");
    assert.equal(normalizeEditorUrl("mailto:host@example.com", true), null);
    assert.equal(normalizeEditorUrl("not a url"), null);
    assert.equal(normalizeEditorUrl("javascript:alert(1)"), null);
    assert.equal(normalizeEditorUrl("data:text/html,hello"), null);
});
