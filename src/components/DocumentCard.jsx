import React from 'react';
import { useNavigate } from 'react-router-dom';

const DocumentCard = ({ doc, onDelete }) => {
  const navigate = useNavigate();

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div
      className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-primary-200 hover:shadow-card-hover transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/document/${doc.id}`)}
    >
      {/* Card top */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
          {doc.emoji || '📄'}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(doc.id);
          }}
          className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all"
          title="Delete document"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Title + author */}
      <h3 className="font-semibold text-slate-800 text-sm mb-1 truncate">
        {doc.title || 'Untitled'}
      </h3>
      {doc.author?.name && (
        <p className="text-xs text-slate-400 mb-3 truncate">{doc.author.name}</p>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400">{formatDate(doc.updatedAt)}</span>
        <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">
          Document
        </span>
      </div>
    </div>
  );
};

export default DocumentCard;
