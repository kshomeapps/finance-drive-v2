import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = ({ children }: { children: React.ReactNode }) => {
  return <div className="relative">{children}</div>;
};

export const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, children, ...props }, ref) => (
  <button ref={ref} className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>
    {children}
  </button>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectValue = ({ placeholder }: { placeholder?: string }) => <span className="text-muted-foreground">{placeholder}</span>;

export const SelectContent = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
    {children}
  </div>
);

export const SelectItem = ({ value, children, onSelect }: { value: string; children: React.ReactNode; onSelect?: (v: string) => void }) => (
  <div className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground" onClick={() => onSelect?.(value)}>
    {children}
  </div>
);
