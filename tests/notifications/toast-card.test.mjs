import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

register(new URL("../support/typescript-loader.mjs", import.meta.url));

const { ToastCard } = await import("../../components/toast/toast-card.tsx");
const { MAX_INDIVIDUAL_TOASTS, arrivalsAreSummarised, notificationToastCopy } = await import("../../lib/notifications/live-notifications.ts");

function card(props) {
  return renderToStaticMarkup(createElement(ToastCard, { title: "Plan saved", onDismiss() {}, ...props }));
}

function notification(overrides) {
  return {
    id: "n1", type: "new_follower", actorId: "a1", createdAt: "2026-11-02T00:00:00Z", read: false,
    postId: null, postTitle: null, groupSlug: null, planToken: null, planTitle: null, available: true,
    ...overrides,
  };
}

test("showsEachArrivalUpToTheLimitThenSummarises", () => {
  assert.equal(arrivalsAreSummarised(MAX_INDIVIDUAL_TOASTS), false);
  assert.equal(arrivalsAreSummarised(MAX_INDIVIDUAL_TOASTS + 1), true);
});

test("namesTheActorAndTheSubjectInToastCopy", () => {
  assert.deepEqual(notificationToastCopy(notification(), "Mali"), { title: "Mali started following you", description: null });
  assert.deepEqual(notificationToastCopy(notification({ type: "followed_post", postTitle: "Khao Yai loop" }), "Mali"), { title: "Mali posted", description: "Khao Yai loop" });
  assert.deepEqual(notificationToastCopy(notification({ type: "followed_plan", planTitle: "Chiang Rai" }), "Mali"), { title: "Mali shared a plan", description: "Chiang Rai" });
});

test("everyToneRendersItsOwnAccentAndADismissButton", () => {
  for (const [tone, accent] of [["notification", "notification"], ["error", "destructive"], ["warning", "warning"], ["success", "success"], ["info", "info"]]) {
    const markup = card({ tone });
    assert.match(markup, new RegExp(`\\[--toast-accent:var\\(--${accent}\\)\\]`), tone);
    assert.match(markup, /aria-label="Dismiss"/, tone);
  }
});

test("announcesErrorsAssertivelyAndEverythingElsePolitely", () => {
  assert.match(card({ tone: "error" }), /role="alert"/);
  assert.match(card({ tone: "success" }), /role="status"/);
});

test("linksTheContentOnlyWhenThereIsSomewhereToGo", () => {
  assert.match(card({ tone: "notification", href: "/notifications" }), /<a[^>]+href="\/notifications"/);
  assert.doesNotMatch(card({ tone: "notification", href: null }), /<a /);
});

test("opensInANewTabOnlyWhenAskedAndSaysSo", () => {
  const markup = card({ tone: "notification", href: "/x", newTab: true });
  assert.match(markup, /<a[^>]+target="_blank"/);
  assert.match(markup, /\(opens in a new tab\)/);
  assert.doesNotMatch(card({ tone: "notification", href: "/x" }), /target="_blank"/);
});

test("keepsTheActionButtonOutsideTheLink", () => {
  const markup = card({ tone: "error", href: "/x", action: { label: "Try again", onClick() {} } });
  assert.ok(markup.indexOf("</a>") < markup.indexOf("Try again"));
});

test("mediaReplacesTheToneIcon", () => {
  const markup = card({ tone: "notification", media: createElement("img", { alt: "", src: "/a.png" }) });
  assert.match(markup, /src="\/a\.png"/);
  assert.doesNotMatch(markup, /lucide-bell/);
});
