import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { documentAPI } from '../services/api';
import DocumentCard from '../components/DocumentCard';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

const Dashboard = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (currentWorkspace) loadDocs();
  }, [currentWorkspace]);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await documentAPI.getByWorkspace(currentWorkspace.id);
      setDocuments(data);
    } catch {}
    finally { setLoading(false); }
  };

  const handleNewDoc = async () => {
    if (!currentWorkspace) return;
    try {
      const doc = await documentAPI.create({
        title: 'Untitled',
        workspaceId: currentWorkspace.id,
      });
      navigate(`/document/${doc.id}`);
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await documentAPI.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setToast({ message: 'Document deleted', type: 'success' });
    } catch {
      setToast({ message: 'Failed to delete document', type: 'error' });
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const filtered = documents.filter(
    (d) => !search || (d.title || 'Untitled').toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    {
      label: 'Total Documents',
      value: documents.length,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      bg: 'bg-blue-50',
      color: 'text-blue-600',
    },
    {
      label: 'Workspace',
      value: currentWorkspace?.name || '—',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      bg: 'bg-violet-50',
      color: 'text-violet-600',
    },
    {
      label: 'Your Role',
      value: currentWorkspace?.role
        ? currentWorkspace.role.charAt(0).toUpperCase() + currentWorkspace.role.slice(1)
        : 'Member',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      bg: 'bg-emerald-50',
      color: 'text-emerald-600',
    },
  ];

  return (
    <div className="h-full overflow-auto">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {greeting()}, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {currentWorkspace
                ? `${documents.length} document${documents.length !== 1 ? 's' : ''} in ${currentWorkspace.name}`
                : 'Create or select a workspace to get started'}
            </p>
          </div>
          {currentWorkspace && (
            <button
              onClick={handleNewDoc}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New Document
            </button>
          )}
        </div>

        {/* Stats */}
        {currentWorkspace && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-card"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg} ${s.color}`}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 mb-0.5">{s.label}</p>
                  <p className="text-lg font-bold text-slate-900 truncate leading-tight">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Document list */}
        {!currentWorkspace ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-card">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-slate-800 mb-2">No workspace selected</h2>
            <p className="text-slate-500 text-sm">Create or select a workspace from the sidebar to get started.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-card">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-slate-800 mb-2">No documents yet</h2>
            <p className="text-slate-500 text-sm mb-6">
              Create your first document and start writing with AI assistance.
            </p>
            <button
              onClick={handleNewDoc}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Create Document
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-slate-700">
                All Documents
                <span className="ml-2 text-slate-400 font-normal">({documents.length})</span>
              </h2>
              <div className="relative">
                <svg
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search documents..."
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white w-56"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No documents match "{search}"
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
