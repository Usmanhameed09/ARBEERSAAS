import Link from "next/link";
import type { ComponentType } from "react";

interface StatusCardProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  count: number;
  iconBg: string;
  iconColor: string;
  href?: string;
  subtitle?: string;
}

export default function StatusCard({
  icon: Icon,
  label,
  count,
  iconBg,
  iconColor,
  href,
  subtitle,
}: StatusCardProps) {
  const content = (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
        <div
          className={`flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-md ${iconBg}`}
        >
          <Icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${iconColor}`} />
        </div>
        <p className="text-[10px] sm:text-[12px] text-slate-700 font-semibold leading-none">
          {label}
        </p>
      </div>
      <div className="flex items-end gap-1.5 sm:gap-2">
        <div
          className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md ${iconBg}`}
        >
          <Icon className={`h-4 w-4 sm:h-5.5 sm:w-5.5 ${iconColor}`} />
        </div>
        <p className="text-2xl sm:text-[2.1rem] font-bold text-slate-900 leading-none">{count}</p>
      </div>
      {subtitle && (
        <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-1.5">{subtitle}</p>
      )}
    </>
  );

  const className =
    "bg-[#f7f7f8] rounded-xl border border-slate-200/80 p-3 sm:p-4 min-h-[72px] sm:min-h-[88px] hover:border-slate-300 transition-colors block";

  if (href) {
    return (
      <Link href={href} className={`${className} cursor-pointer`}>
        {content}
      </Link>
    );
  }

  return <div className={`${className} cursor-default`}>{content}</div>;
}
