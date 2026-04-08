"use client";

type EmptyStateProps = {
  message: string;
  requiredEvents?: string[];
};

export default function EmptyState({ message, requiredEvents }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl">&#128237;</span>
      <p className="mt-4 text-slate-400">{message}</p>

      {requiredEvents && requiredEvents.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {requiredEvents.map((event) => (
            <span
              key={event}
              className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-300"
            >
              {event}
            </span>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500">
        이벤트를 설정하면 분석을 시작할 수 있습니다
      </p>
    </div>
  );
}
