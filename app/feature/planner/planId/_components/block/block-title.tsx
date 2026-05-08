"use client";

import { type ChangeEvent, type MouseEvent } from "react";

type BlockTitleProps = {
  value: string;
  onChange: (title: string) => void;
  onClick?: (e: MouseEvent<HTMLInputElement>) => void;
  onMouseDown?: (e: MouseEvent<HTMLInputElement>) => void;
};

export function BlockTitle({
  value,
  onChange,
  onClick,
  onMouseDown,
}: BlockTitleProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      onClick={onClick}
      onMouseDown={onMouseDown}
      aria-label="Trip block title"
      placeholder="Add a title"
      className=" w-full rounded-sm border border-transparent bg-transparent px-0 py-1 text-2xl font-bold leading-tight text-foreground transition-colors placeholder:text-muted-foreground hover:border-border focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
    />
  );
}
