import type { ComponentType } from "react";

type IconComponent = ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

interface AppIconProps {
  icon: IconComponent;
  className?: string;
  iconClassName?: string;
  size?: "sm" | "md" | "lg";
  tone?: "slate" | "blue" | "amber" | "green" | "red";
}

const sizeClasses = {
  sm: {
    shell: "h-7 w-7 rounded-xl",
    icon: "h-3.5 w-3.5",
  },
  md: {
    shell: "h-9 w-9 rounded-2xl",
    icon: "h-[18px] w-[18px]",
  },
  lg: {
    shell: "h-11 w-11 rounded-[1.15rem]",
    icon: "h-5 w-5",
  },
};

const toneClasses = {
  slate:
    "bg-gradient-to-br from-white via-slate-50 to-slate-200 text-slate-700 ring-slate-200/[0.8] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_18px_rgba(15,23,42,0.08)]",
  blue: "bg-gradient-to-br from-sky-50 via-blue-50 to-blue-200 text-blue-700 ring-blue-200/[0.8] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_12px_24px_rgba(37,99,235,0.14)]",
  amber:
    "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-200 text-amber-700 ring-amber-200/[0.8] shadow-[inset_0_1px_0_rgba(255,251,235,0.92),0_12px_24px_rgba(217,119,6,0.14)]",
  green:
    "bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-200 text-emerald-700 ring-emerald-200/[0.8] shadow-[inset_0_1px_0_rgba(236,253,245,0.92),0_12px_24px_rgba(5,150,105,0.14)]",
  red: "bg-gradient-to-br from-rose-50 via-red-50 to-red-200 text-red-700 ring-red-200/[0.8] shadow-[inset_0_1px_0_rgba(255,241,242,0.92),0_12px_24px_rgba(220,38,38,0.14)]",
};

export default function AppIcon({
  icon: Icon,
  className = "",
  iconClassName = "",
  size = "md",
  tone = "slate",
}: AppIconProps) {
  const currentSize = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center justify-center ring-1 ${currentSize.shell} ${toneClasses[tone]} ${className}`}
    >
      <Icon
        strokeWidth={2.15}
        className={`${currentSize.icon} drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] ${iconClassName}`}
      />
    </span>
  );
}
