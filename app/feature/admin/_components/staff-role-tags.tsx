import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { roleLabel, staffRoles, type AdminRole } from "./admin-api";

type StaffRoleTagsProps = {
  roles: readonly AdminRole[];
  /** Shown when the account holds no staff role. */
  fallback?: string;
};

const ROLE_TONE: Record<AdminRole, string> = {
  USER: "bg-muted/60 text-muted-foreground",
  OWNER: "border-primary/30 bg-primary/15 text-primary",
  ADMIN: "border-chart-4/30 bg-chart-4/15 text-chart-4",
  MODERATOR: "border-warning/30 bg-warning/15 text-warning",
};

/** Highest role, with a distinct token-driven color and a readable label. */
export function StaffRoleTags({ roles, fallback = "Member" }: StaffRoleTagsProps) {
  const staff = staffRoles(roles);
  if (staff.length === 0) {
    return <Badge variant="outline" className="bg-muted/60 text-muted-foreground">{fallback}</Badge>;
  }
  return (
    <span className="inline-flex flex-wrap gap-1">
      {staff.map((role) => (
        <Badge key={role} variant="outline" className={cn("border font-semibold", ROLE_TONE[role])}>
          {roleLabel(role)}
        </Badge>
      ))}
    </span>
  );
}
