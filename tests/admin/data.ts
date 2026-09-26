// Test fixtures shaped like user-management-service responses.

export const TARGET_ID = "00000000-0000-4000-8000-0000000000b1";
export const STAFF_ID = "00000000-0000-4000-8000-0000000000a1";

export const statisticsFixture = {
  totalUsers: 42,
  activeUsers: 39,
  suspendedUsers: 3,
  joinedLast30Days: 7,
  joinedSince: "2026-08-25T10:00:00Z",
  asOf: "2026-09-24T10:00:00Z",
};

export const userPageFixture = {
  content: [
    {
      id: TARGET_ID,
      displayName: "Jane",
      email: "jane@example.com",
      status: "suspended",
      roles: ["USER"],
      createdAt: "2026-09-01T00:00:00Z",
      suspendedUntil: null,
    },
  ],
  number: 1,
  size: 20,
  totalElements: 21,
  totalPages: 2,
  last: true,
  first: false,
  numberOfElements: 1,
  empty: false,
};

export const userDetailFixture = {
  ...userPageFixture.content[0],
  status: "active",
  rolesVerified: true,
  updatedAt: "2026-09-24T10:00:00Z",
  deletedAt: null,
  activeSuspension: null,
};

export const historyFixture = Array.from({ length: 21 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  action: index % 2 === 0 ? "USER_REACTIVATED" : "USER_SUSPENDED",
  actorUserId: STAFF_ID,
  actorDisplayName: "Navio moderator",
  reason: index === 20 ? "Oldest history entry" : `Reviewed report ${index + 1}`,
  role: null,
  createdAt: new Date(Date.UTC(2026, 8, 24 - index, 10)).toISOString(),
}));
