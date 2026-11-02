import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

register(new URL("../support/typescript-loader.mjs", import.meta.url));

const { NotificationCountBadge, formatNotificationCount, notificationsLabel } = await import(
  "../../components/notifications/notification-count-badge.tsx"
);
const { default: SidebarItem } = await import("../../components/sidebar/sidebar.item.tsx");

function badgeMarkup(count) {
  return renderToStaticMarkup(createElement(NotificationCountBadge, { count }));
}

test("rendersNothingWhenThereIsNothingUnread", () => {
  assert.equal(badgeMarkup(0), "");
});

test("showsTheExactCountUpToNinetyNine", () => {
  assert.equal(formatNotificationCount(1), "1");
  assert.equal(formatNotificationCount(99), "99");
});

test("capsTheDisplayedCountAboveNinetyNine", () => {
  assert.equal(formatNotificationCount(100), "99+");
  assert.match(badgeMarkup(1500), />99\+</);
});

test("keepsTheExactCountInTheAccessibleLabel", () => {
  assert.equal(notificationsLabel(1500), "Notifications, 1500 unread");
  assert.equal(notificationsLabel(0), "Notifications");
});

test("pingsOnlyForPeopleWhoAllowMotion", () => {
  const markup = badgeMarkup(3);
  assert.match(markup, /motion-safe:animate-notification-ping/);
  assert.match(markup, /motion-reduce:hidden/);
});

test("hidesTheBadgeFromAssistiveTechSoTheCountIsNotAnnouncedTwice", () => {
  assert.match(badgeMarkup(3), /^<span aria-hidden="true"/);
});

test("sidebarLinkNamesTheUnreadCountWhileItsVisibleTextStaysPlain", () => {
  const markup = renderToStaticMarkup(
    createElement(SidebarItem, {
      title: "Notifications",
      accessibleLabel: notificationsLabel(3),
      href: "/notifications",
      badge: createElement(NotificationCountBadge, { count: 3 }),
    }),
  );

  assert.match(markup, /aria-label="Notifications, 3 unread"/);
  assert.doesNotMatch(markup, /\(3 unread\)/);
  assert.match(markup, />Notifications</);
});
