import React, { CSSProperties, ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<"button"> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "#ffffff",
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "100px",
      background = "rgba(0, 0, 0, 1)",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        style={
          {
            "--spread": "90deg",
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--cut": shimmerSize,
            "--bg": background,
          } as CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-white [background:var(--bg)] [border-radius:var(--radius)] dark:text-black",
          "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
          className,
        )}
        ref={ref}
        {...props}
      >
        <div
          className={cn(
            "-z-30 blur-[2px]",
            "absolute inset-0 overflow-visible [container-type:size]",
          )}
        >
          <div className="animate-shimmer absolute inset-0 h-[100cqh] w-[100cqw] [aspect-ratio:1/1] [background-image:conic-gradient(from_0deg,transparent_0_340deg,var(--shimmer-color)_360deg)] [background-position:0_0] [background-repeat:no-repeat] [border-radius:var(--radius)]" />
        </div>
        <div
          className={cn(
            "absolute inset-[var(--cut)] -z-20 [background:var(--bg)] [border-radius:var(--radius)]",
          )}
        />
        <div className="z-10">{children}</div>
      </button>
    );
  },
);

ShimmerButton.displayName = "ShimmerButton";
