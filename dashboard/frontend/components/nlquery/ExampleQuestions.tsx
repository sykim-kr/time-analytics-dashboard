"use client";

import { TAB_EXAMPLES, type AnalysisTabKey } from "@/lib/nlquery-config";

type Props = {
  tab: AnalysisTabKey;
  onSelect: (question: string) => void;
};

export default function ExampleQuestions({ tab, onSelect }: Props) {
  const examples = TAB_EXAMPLES[tab] || [];

  return (
    <div className="mb-3">
      <p className="text-xs text-slate-400 mb-2">이런 질문을 해보세요:</p>
      <div className="flex flex-wrap gap-2">
        {examples.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="px-3 py-1.5 text-xs text-purple-300 bg-purple-900/30 border border-purple-800/50 rounded-full hover:bg-purple-800/40 hover:border-purple-700 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
