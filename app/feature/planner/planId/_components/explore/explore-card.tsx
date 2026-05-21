"use client";

import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type ExploreCardProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  subtitle: string;
  source: string;
  imageUrl: string;
  gradient: string;
};

export const ExploreCard = React.forwardRef<HTMLDivElement, ExploreCardProps>(
  (
    { className, title, subtitle, source, imageUrl, gradient, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          " group relative w-30 h-70 p-3 shrink-0 snap-start overflow-hidden rounded-xl border border-border shadow-md",
          "transition-all duration-300 ease-in-out hover:shadow-2xl ",
          className,
        )}
        {...props}
      >
        {/* Background */}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: gradient }} />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-end p-4 text-white">
          <div className="transition-transform duration-500 ease-in-out group-hover:-translate-y-8">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60 mb-1">
              {source}
            </p>
            <h3 className="text-sm font-bold leading-snug">{title}</h3>
            <p className="mt-1 text-xs text-white/70">{subtitle}</p>
          </div>
        </div>
      </div>
    );
  },
);
ExploreCard.displayName = "ExploreCard";
