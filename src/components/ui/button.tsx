import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — token-driven, RTL-safe (uses gap, not directional margins).
 * `active:scale` gives a subtle tactile press (the platform's micro-animation
 * language). Export `buttonVariants` so links (<a>/<Link>) can wear the same skin.
 */
export const buttonVariants = cva(
  // One radius everywhere via --radius-button (10px). `rounded-[length]` keeps
  // every variant + size visually consistent.
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-button)] font-semibold transition-[transform,filter,background-color,box-shadow,color] duration-[var(--duration-fast)] ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.15em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Signature primary CTA: teal gradient + asymmetric, accent-tinted shadow.
        default:
          "bg-[linear-gradient(135deg,var(--primary-from),var(--primary-to))] text-primary-foreground shadow-[var(--cta-shadow)] hover:brightness-[1.06]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        outline:
          "border border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        success:
          "bg-success text-success-foreground shadow-soft hover:brightness-[1.05]",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-[1.05]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        default: "h-11 px-6 text-base",
        lg: "h-12 px-8 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
