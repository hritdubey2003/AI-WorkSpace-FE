import React, { useState } from 'react';
import { aiAPI } from '../services/api';
import Spinner from './Spinner';

const AIPanel = ({ docId, onApplyImprovement }) => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState('');
  const [error, setError] = useState('');

  const run = async (action) => {
    setLoading(true);
    setActiveAction(action);
    setResult('');
    setError('');
    try {
      let res;
      if (action === 'summarize') res = await aiAPI.summarize(docId);
      else if (action === 'improve') res = await aiAPI.improve(docId);
      else if (action === 'tasks') res = await aiAPI.generateTasks(docId);
      setResult(res.result);
    } catch (err) {
      setError(err.message || 'AI request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    {
      key: 'summarize',
      label: 'Summarize',
      desc: 'Extract key points and insights',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      key: 'improve',
      label: 'Improve Writing',
      desc: 'Polish grammar, clarity and style',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
    },
    {
      key: 'tasks',
      label: 'Generate Tasks',
      desc: 'Extract actionable to-do items',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ];

  const resultLabels = {
    summarize: 'Summary',
    improve: 'Improved Version',
    tasks: 'Generated Tasks',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 leading-tight">AI Assistant</h3>
            <p className="text-xs text-slate-400 leading-tight">Powered by GPT-4o mini</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 space-y-2 border-b border-slate-100">
        {actions.map((a) => {
          const isActive = activeAction === a.key && (loading || result);
          return (
            <button
              key={a.key}
              onClick={() => run(a.key)}
              disabled={loading}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all group ${
                isActive
                  ? 'border-primary-200 bg-primary-50'
                  : 'border-slate-200 hover:border-primary-200 hover:bg-slate-50/80'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-primary-500' : 'text-slate-400 group-hover:text-primary-500'
                    }`}
                  >
                    {a.icon}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{a.label}</span>
                </div>
                {activeAction === a.key && loading ? (
                  <Spinner size="sm" />
                ) : (
                  <svg
                    className="w-4 h-4 text-slate-300 group-hover:text-primary-400 transition-colors"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 ml-6">{a.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="mx-4 mt-4 p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {resultLabels[activeAction]}
              </span>
              {activeAction === 'improve' && onApplyImprovement && (
                <button
                  onClick={() => onApplyImprovement(result)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Apply to doc
                </button>
              )}
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPanel;
