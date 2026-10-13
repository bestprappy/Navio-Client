"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import { expenseCategories, getExpenseCategory } from "./budget.data";

type ExpenseCategorySelectProps = {
  value: string;
  onValueChange: (value: string) => void;
};

export function ExpenseCategorySelect({
  value,
  onValueChange,
}: ExpenseCategorySelectProps) {
  const category = getExpenseCategory(value);
  const Icon = category.Icon;

  return (
    <Select
      value={category.id}
      onValueChange={(nextValue) => {
        if (nextValue) onValueChange(nextValue);
      }}
    >
      <SelectTrigger
        className="w-full gap-3 rounded-sm border-border bg-background px-4 text-sm font-medium data-[size=default]:h-13 dark:bg-background dark:hover:bg-muted hover:bg-muted"
        aria-label={`Expense type: ${category.label}`}
      >
        <Icon className="size-4 text-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left text-foreground">
          {category.label}
        </span>
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        className="rounded-sm p-1.5"
        aria-label="Expense types"
      >
        <SelectGroup className="grid grid-cols-3 gap-1 p-0">
          {expenseCategories.map(({ id, label, Icon: CategoryIcon }) => (
            <SelectItem
              key={id}
              value={id}
              className="min-h-16 justify-center rounded-sm border border-transparent px-1.5 py-2 text-muted-foreground data-[selected]:border-primary/40 data-[selected]:bg-primary/10 data-[selected]:text-foreground data-[highlighted]:bg-muted data-[highlighted]:text-foreground data-[highlighted]:ring-1 data-[highlighted]:ring-inset data-[highlighted]:ring-ring/40 focus:bg-muted focus:text-foreground not-data-[variant=destructive]:focus:**:text-foreground data-[selected]:focus:bg-primary/10 data-[selected]:data-[highlighted]:bg-primary/10 [&>span:last-child]:top-1.5 [&>span:last-child]:right-1 [&>span:last-child]:size-3 [&>span:last-child]:text-primary"
            >
              <span className="flex w-full flex-col items-center gap-1.5 text-xs font-medium">
                <CategoryIcon className="size-5" aria-hidden="true" />
                <span>{label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
