"use client";

type WarningBannerProps = {
  warnings: string[];
};

export default function WarningBanner({ warnings }: WarningBannerProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-700/50 bg-amber-900/20 p-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-sm">&#9888;&#65039;</span>
        <ul className="space-y-1">
          {warnings.map((warning, i) => (
            <li key={i} className="text-sm text-amber-200">
              {warning}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
