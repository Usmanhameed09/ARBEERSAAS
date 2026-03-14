import Link from "next/link";
import type { ComponentType } from "react";

interface StatusCardProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  count: number;
  iconBg: string;
  iconColor: string;
  href?: string;
}

export default function StatusCard({
  icon: Icon,
  label,
  count,
  iconBg,
  iconColor,
  href,
}: StatusCardProps) {
  const content = (
    <>
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-md ${iconBg}`}
        >
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        </div>
        <p className="text-[12px] text-slate-700 font-semibold leading-none">
          {label}
        </p>
      </div>
      <div className="flex items-end gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-md ${iconBg}`}
        >
          <Icon className={`h-5.5 w-5.5 ${iconColor}`} />
        </div>
        <p className="text-[2.1rem] font-bold text-slate-900 leading-none">{count}</p>
      </div>
    </>
  );

  const className =
    "bg-[#f7f7f8] rounded-xl border border-slate-200/80 p-4 min-h-[88px] hover:border-slate-300 transition-colors block";

  if (href) {
    return (
      <Link href={href} className={`${className} cursor-pointer`}>
        {content}
      </Link>
    );
  }

  return <div className={`${className} cursor-default`}>{content}</div>;
}
