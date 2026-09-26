import { Badge } from "@/components/ui/badge";

import { roleLabel, staffRoles, type AdminRole } from "./admin-api";

type StaffRoleTagsProps = {
  roles: readonly AdminRole[];
  /** Shown when the account holds no staff role. */
  fallback?: string;
};

/** Moderator and administrator tags. Every account is a member, so that is not repeated. */
export function StaffRoleTags({ roles, fallback = "Member" }: StaffRoleTagsProps) {
  const staff = staffRoles(roles);
  if (staff.length === 0) {
    return <span className="text-sm text-muted-foreground">{fallback}</span>;
  }
  return (
    <span className="inline-flex flex-wrap gap-1">
      {staff.map((role) => (
        <Badge key={role} variant={role === "ADMIN" ? "default" : "secondary"}>
          {roleLabel(role)}
        </Badge>
      ))}
    </span>
  );
}
