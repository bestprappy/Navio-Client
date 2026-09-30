import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  title: string;
  description: string;
  children: ReactNode;
};

/** Page frame shared by the admin screens: one heading, one line, then the work. */
export function AdminPageHeader({ title, description, children }: AdminPageHeaderProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </header>
      {children}
    </div>
  );
}
