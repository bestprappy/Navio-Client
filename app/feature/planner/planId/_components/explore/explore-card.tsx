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
          "group relative w-full h-56 shrink-0 snap-start overflow-hidden rounded-xl border border-border shadow-md",
          "transition-shadow duration-200 hover:shadow-lg ",
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
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: gradient }} />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-scrim/80 via-scrim/30 to-transparent" />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-end p-4 text-on-media">
          <div className="transition-transform duration-500 ease-in-out group-hover:-translate-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-on-media/60 mb-1">
              {source}
            </p>
            <h3 className="text-base font-semibold leading-snug">{title}</h3>
            <p className="mt-1 text-xs text-on-media/70">{subtitle}</p>
          </div>
        </div>
      </div>
    );
  },
);
ExploreCard.displayName = "ExploreCard";
