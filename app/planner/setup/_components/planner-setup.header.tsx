type PlannerSetupHeaderProps = {
  title: string;
  subtitle?: string;
};

export function PlannerSetupHeader({
  title,
  subtitle,
}: PlannerSetupHeaderProps) {
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
