"use client";

type Props = {
  data: { columns: string[]; rows: (string | number)[][] };
  title: string;
  eventLabel?: string;
};

function getCellBg(value: number): string {
  if (value >= 40) return "rgba(126, 34, 206, 0.5)";   // purple-700/50
  if (value >= 20) return "rgba(107, 33, 168, 0.4)";   // purple-800/40
  if (value >= 10) return "rgba(88, 28, 135, 0.3)";    // purple-900/30
  return "transparent";
}

export default function CohortTable({ data, title, eventLabel }: Props) {
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 overflow-x-auto">
      <p className="text-sm font-semibold text-slate-100">{title}</p>
      {eventLabel && (
        <p className="text-xs text-purple-400 mb-3">{eventLabel}</p>
      )}
      {!eventLabel && <div className="mb-3" />}

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900">
            {data.columns.map((col) => (
              <th
                key={col}
                className="px-3 py-2 text-xs uppercase text-slate-400 text-left font-medium"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri} className="border-b border-slate-700">
              {row.map((cell, ci) => {
                const isFirstCol = ci === 0;
                const numVal = typeof cell === "number" ? cell : NaN;
                const isNum = !isNaN(numVal) && !isFirstCol;

                return (
                  <td
                    key={ci}
                    className={`px-3 py-2 ${
                      isFirstCol
                        ? "font-medium text-slate-200"
                        : "text-center text-slate-300"
                    }`}
                    style={
                      isNum
                        ? { backgroundColor: getCellBg(numVal) }
                        : undefined
                    }
                  >
                    {isNum ? `${numVal}%` : cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
