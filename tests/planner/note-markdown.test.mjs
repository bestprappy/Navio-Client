import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.(?:ts|tsx|js|mjs|json)$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });

const { parseNoteMarkdown, serializeNoteMarkdown } = await import("../../components/block-editor/note-markdown.ts");
const { normalizeHref } = await import("../../components/block-editor/note-document.ts");

const doc = (...content) => ({ type: "doc", content });
const p = (...content) => (content.length ? { type: "paragraph", content } : { type: "paragraph" });
const t = (text, ...marks) => (marks.length ? { type: "text", text, marks } : { type: "text", text });
const br = { type: "hardBreak" };
const h = (level, ...content) => ({ type: "heading", attrs: { level }, ...(content.length ? { content } : {}) });
const bold = { type: "bold" };
const italic = { type: "italic" };
const underline = { type: "underline" };
const strike = { type: "strike" };
const code = { type: "code" };
const link = (href) => ({ type: "link", attrs: { href } });
const color = (name) => ({ type: "textColor", attrs: { color: name } });
const highlight = (name) => ({ type: "highlight", attrs: { color: name } });
const li = (...content) => ({ type: "listItem", content });
const ul = (...items) => ({ type: "bulletList", content: items });
const ol = (start, ...items) => ({ type: "orderedList", attrs: { start }, content: items });
const task = (checked, ...content) => ({ type: "taskItem", attrs: { checked }, content });
const tasks = (...items) => ({ type: "taskList", content: items });
const quote = (...content) => ({ type: "blockquote", content });
const callout = (tone, ...content) => ({ type: "callout", attrs: { tone }, content });
const toggle = (open, summary, ...content) => ({
  type: "details",
  attrs: { open },
  content: [
    summary.length ? { type: "detailsSummary", content: summary } : { type: "detailsSummary" },
    { type: "detailsContent", content },
  ],
});
const codeBlock = (language, text) => ({
  type: "codeBlock",
  attrs: { language },
  ...(text ? { content: [t(text)] } : {}),
});
const hr = { type: "horizontalRule" };

function assertRoundTrip(document) {
  const markdown = serializeNoteMarkdown(document);
  assert.deepEqual(parseNoteMarkdown(markdown), document, `markdown was:\n${markdown}`);
  return markdown;
}

test("an empty note is a single empty paragraph and saves as nothing", () => {
  assert.deepEqual(parseNoteMarkdown(""), doc(p()));
  assert.deepEqual(parseNoteMarkdown("  \n "), doc(p()));
  assert.equal(serializeNoteMarkdown(doc(p())), "");
});

test("plain-text notes written before markdown keep every line break", () => {
  const note = "Charge at Hsinchu\nBuy snacks\n\nCheck in after 3pm";
  const parsed = parseNoteMarkdown(note);
  assert.deepEqual(parsed, doc(p(t("Charge at Hsinchu"), br, t("Buy snacks")), p(t("Check in after 3pm"))));
  assert.equal(serializeNoteMarkdown(parsed), note);
});

test("headings round-trip and deeper markdown headings become the smallest heading", () => {
  assertRoundTrip(doc(h(1, t("Day 1")), h(2, t("Morning")), h(3, t("Stops")), h(4, t("Notes"))));
  assert.deepEqual(parseNoteMarkdown("###### Tiny"), doc(h(4, t("Tiny"))));
});

test("every inline mark round-trips, including nested and overlapping ones", () => {
  assertRoundTrip(doc(p(
    t("Plain "),
    t("bold", bold),
    t(" and "),
    t("both", bold, italic),
    t(" "),
    t("under", underline),
    t(" "),
    t("gone", strike),
    t(" "),
    t("npm run dev", code),
    t(" "),
    t("red", color("red")),
    t(" "),
    t("marked", highlight("yellow")),
  )));
  assertRoundTrip(doc(p(t("a", bold), t("b", bold, underline), t("c", underline))));
});

test("whitespace at the edge of a mark moves outside it so the mark still parses", () => {
  const markdown = serializeNoteMarkdown(doc(p(t("Pack "), t("the adapter ", bold), t("tonight"))));
  assert.equal(markdown, "Pack **the adapter** tonight");
});

test("links round-trip with formatted text and unusual addresses", () => {
  assertRoundTrip(doc(p(t("Book "), t("the hotel", link("https://example.com/a_b?x=1")), t(" now"))));
  assertRoundTrip(doc(p(t("Map", link("https://maps.example.com/place (1)"), bold))));
});

test("unsafe link targets are dropped but their text is kept", () => {
  assert.deepEqual(parseNoteMarkdown("[click](javascript:alert(1))"), doc(p(t("click"))));
  assert.deepEqual(parseNoteMarkdown("![photo](https://example.com/x.png)"), doc(p(t("photo", link("https://example.com/x.png")))));
});

test("markdown characters typed as text stay text", () => {
  assertRoundTrip(doc(p(t("# not a heading * _ ` [x] <b> ~ | & 1. not a list"))));
  assertRoundTrip(doc(p(t("- dash"), br, t("1) item"), br, t("> quote"), br, t("+ plus"))));
  assertRoundTrip(doc(h(2, t("Price #"))));
});

test("raw HTML other than the understood tags is shown as text, never parsed", () => {
  assert.deepEqual(parseNoteMarkdown("<script>alert(1)</script>"), doc(p(t("<script>alert(1)</script>"))));
  assert.deepEqual(parseNoteMarkdown('a <span style="color:red">b</span>'), doc(p(t('a <span style="color:red">b</span>'))));
  assert.deepEqual(parseNoteMarkdown('<span data-color="neon">x</span>'), doc(p(t('<span data-color="neon">x</span>'))));
});

test("lists of every kind round-trip, with nesting", () => {
  assertRoundTrip(doc(ul(li(p(t("Charger cable")), ul(li(p(t("Type 2"))), li(p(t("CCS2"))))), li(p(t("Snacks"))))));
  assertRoundTrip(doc(ol(1, li(p(t("Drive"))), li(p(t("Charge"))), li(p(t("Hike"))))));
  assertRoundTrip(doc(ol(7, li(p(t("Seven"))), li(p(t("Eight"))))));
  assertRoundTrip(doc(tasks(task(false, p(t("Book ferry"))), task(true, p(t("Rent car"))))));
});

test("empty list items and empty to-dos survive", () => {
  assertRoundTrip(doc(tasks(task(false, p()), task(true, p()))));
  assertRoundTrip(doc(ul(li(p()), li(p(t("x"))))));
});

test("adjacent lists stay separate", () => {
  assertRoundTrip(doc(ul(li(p(t("a")))), ul(li(p(t("b"))))));
  assertRoundTrip(doc(ol(1, li(p(t("a")))), ol(1, li(p(t("b"))))));
  assertRoundTrip(doc(tasks(task(false, p(t("a")))), ul(li(p(t("b")))), tasks(task(true, p(t("c"))))));
});

test("a markdown list mixing to-dos and bullets splits into separate lists", () => {
  assert.deepEqual(
    parseNoteMarkdown("- [ ] Pack\n- Passport\n- [x] Charge"),
    doc(tasks(task(false, p(t("Pack")))), ul(li(p(t("Passport")))), tasks(task(true, p(t("Charge"))))),
  );
});

test("quotes, callouts, code and dividers round-trip", () => {
  assertRoundTrip(doc(quote(p(t("Drive slowly")), p(t("Second line")))));
  assertRoundTrip(doc(callout("tip", p(t("Charge to 80% before the pass")))));
  assertRoundTrip(doc(callout("warning", h(3, t("Road closed")), ul(li(p(t("Detour")))))));
  assertRoundTrip(doc(callout("note", p())));
  assertRoundTrip(doc(codeBlock("bash", "echo ```\nls")), hr, p(t("after")));
  assertRoundTrip(doc(codeBlock(null, null)));
});

test("GitHub alert syntax is read as a callout, but an escaped marker is not", () => {
  assert.deepEqual(parseNoteMarkdown("> [!CAUTION]\n> Tolls ahead"), doc(callout("caution", p(t("Tolls ahead")))));
  assert.deepEqual(parseNoteMarkdown("> \\[!TIP]"), doc(quote(p(t("[!TIP]")))));
});

test("toggles round-trip with formatted summaries, nesting and open state", () => {
  assertRoundTrip(doc(toggle(false, [t("Day 2 "), t("backup", bold)], p(t("Rain plan")))));
  assertRoundTrip(doc(toggle(true, [], p())));
  assertRoundTrip(doc(toggle(true, [t("Outer")], toggle(false, [t("Inner")], p(t("Deep"))), p(t("After inner")))));
  assertRoundTrip(doc(ul(li(p(t("Item")), toggle(false, [t("In a list")], p(t("x")))))));
});

test("toggles written on one HTML block by other tools are understood", () => {
  assert.deepEqual(
    parseNoteMarkdown("<details><summary>Hi</summary>Body text</details>"),
    doc(toggle(false, [t("Hi")], p(t("Body text")))),
  );
});

test("blank lines between blocks are kept, but not at the start or end", () => {
  const document = doc(p(t("a")), p(), p(), p(t("b")));
  assertRoundTrip(document);
  assert.equal(serializeNoteMarkdown(doc(p(), p(t("a")), p())), "a");
});

test("line breaks at the edges of a paragraph and in a row are kept", () => {
  assertRoundTrip(doc(p(br, t("a"))));
  assertRoundTrip(doc(p(t("a"), br, br, t("b"))));
  assertRoundTrip(doc(p(t("a"), br)));
});

test("typed addresses become safe links and anything else is refused", () => {
  assert.equal(normalizeHref("example.com/path"), "https://example.com/path");
  assert.equal(normalizeHref("https://a.example"), "https://a.example");
  assert.equal(normalizeHref("me@example.com"), "mailto:me@example.com");
  assert.equal(normalizeHref("javascript:alert(1)"), null);
  assert.equal(normalizeHref("not a link"), null);
});
