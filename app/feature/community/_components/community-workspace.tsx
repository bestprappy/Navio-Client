import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import styles from "./community-workspace.module.css";

type WorkspaceProps = {
  children: ReactNode;
  className?: string;
};

function CommunityWorkspaceRoot({ children, className }: WorkspaceProps) {
  return <div className={cn(styles.workspace, className)}>{children}</div>;
}

function CommunityWorkspaceContent({ children, className }: WorkspaceProps) {
  return (
    <div
      className={cn(styles.content, className)}
      role="region"
      aria-label="Community content"
      tabIndex={0}
    >
      {children}
    </div>
  );
}

function CommunityWorkspaceAside({ children, className }: WorkspaceProps) {
  return (
    <div
      className={cn(styles.aside, className)}
      role="region"
      aria-label="Community information"
      tabIndex={0}
    >
      {children}
    </div>
  );
}

export const CommunityWorkspace = Object.assign(CommunityWorkspaceRoot, {
  Content: CommunityWorkspaceContent,
  Aside: CommunityWorkspaceAside,
});
