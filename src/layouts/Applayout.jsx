import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useDocuments } from '../context/DocumentContext';
import { documentAPI } from '../services/api';
import Modal from '../components/Modal';
import ShareModal from '../components/ShareModal';
import Spinner from '../components/Spinner';

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { workspaces, currentWorkspace, setCurrentWorkspace, fetchWorkspaces, createWorkspace } =
    useWorkspace();
  const { documents, loading: docsLoading, createDocument } = useDocuments();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNewWs, setShowNewWs] = useState(false);
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [sharedDocs, setSharedDocs] = useState([]);
  const [sharedLoading, setSharedLoading] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const loadSharedDocs = useCallback(async () => {
    setSharedLoading(true);
    try {
      const docs = await documentAPI.getSharedWithMe();
      setSharedDocs(docs);
    } catch {
      setSharedDocs([]);
    } finally {
      setSharedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSharedDocs();
  }, [loadSharedDocs, location.pathname]);

  const handleLeaveShared = async (docId) => {
    try {
      await documentAPI.leaveShared(docId);
      setSharedDocs((prev) => prev.filter((d) => d.id !== docId));
      if (location.pathname === `/document/${docId}`) navigate('/dashboard');
    } catch {}
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    setCreating(true);
    try {
      await createWorkspace({ name: wsName, description: wsDesc });
      setShowNewWs(false);
      setWsName('');
      setWsDesc('');
      navigate('/dashboard');
    } catch {}
    finally { setCreating(false); }
  };

  const canCreate = !!currentWorkspace && currentWorkspace.role !== 'VIEWER';

  const handleNewDoc = async () => {
    if (!canCreate) return;
    try {
      const doc = await createDocument({
        title: 'Untitled',
        workspaceId: currentWorkspace.id,
      });
      navigate(`/document/${doc.id}`);
    } catch {}
  };

  const handleWorkspaceChange = (workspaceId) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    setCurrentWorkspace(ws);
    // Avoid leaving a document from the previous workspace open under the new selection
    navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-[#f8f9fb] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-[220px]' : 'w-0 overflow-hidden'
        } flex-shrink-0 bg-[#0f1117] text-white flex flex-col transition-all duration-300 ease-in-out`}
      >
        {/* Brand */}
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-primary-900/40 flex-shrink-0">
              AI
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white leading-tight truncate">AI WorkSpace</p>
              <p className="text-[10px] text-white/35 leading-tight">Collaborative Editor</p>
            </div>
          </div>
        </div>

        {/* Workspace selector */}
        <div className="px-3 py-3 border-b border-white/[0.06]">
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mb-2 px-1">
            Workspace
          </p>
          {workspaces.length > 0 ? (
            <select
              value={currentWorkspace?.id || ''}
              onChange={(e) => handleWorkspaceChange(e.target.value)}
              className="w-full bg-white/[0.07] text-white text-xs rounded-lg px-2.5 py-2 border border-white/[0.08] focus:outline-none focus:border-primary-500/50 cursor-pointer"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id} className="bg-[#1a1d27] text-white">
                  {ws.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-white/25 px-1 py-1">No workspaces yet</p>
          )}

          <div className="mt-2 flex items-center justify-between px-0.5">
            <button
              onClick={() => setShowNewWs(true)}
              className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New workspace
            </button>
            {currentWorkspace && (
              <button
                onClick={() => setShowShare(true)}
                className="text-white/35 hover:text-white/65 transition-colors p-0.5"
                title="Manage members"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Nav links */}
        <nav className="px-3 py-2.5 border-b border-white/[0.06]">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
              isActive('/dashboard')
                ? 'bg-white/[0.12] text-white'
                : 'text-white/45 hover:text-white/75 hover:bg-white/[0.06]'
            }`}
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>
        </nav>

        {/* Documents list */}
        <div className="flex-1 overflow-y-auto px-3 py-2.5">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest">
              Documents
            </p>
            <button
              onClick={handleNewDoc}
              disabled={!canCreate}
              className="text-white/35 hover:text-white/65 transition-colors disabled:opacity-30"
              title="New document"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {docsLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-[11px] text-white/20 px-1 py-1">No documents yet</p>
          ) : (
            <div className="space-y-0.5">
              {documents.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/document/${doc.id}`}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors truncate ${
                    isActive(`/document/${doc.id}`)
                      ? 'bg-white/[0.12] text-white'
                      : 'text-white/45 hover:text-white/75 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="text-sm flex-shrink-0">{doc.emoji || '📄'}</span>
                  <span className="truncate">{doc.title || 'Untitled'}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Shared with me */}
          <div className="flex items-center justify-between mb-2 px-1 mt-5">
            <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest">
              Shared with me
            </p>
          </div>

          {sharedLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : sharedDocs.length === 0 ? (
            <p className="text-[11px] text-white/20 px-1 py-1">Nothing shared yet</p>
          ) : (
            <div className="space-y-0.5">
              {sharedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`group flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-lg text-[12px] transition-colors ${
                    isActive(`/document/${doc.id}`)
                      ? 'bg-white/[0.12] text-white'
                      : 'text-white/45 hover:text-white/75 hover:bg-white/[0.06]'
                  }`}
                >
                  <Link to={`/document/${doc.id}`} className="flex items-center gap-2 flex-1 min-w-0 truncate">
                    <span className="text-sm flex-shrink-0">{doc.emoji || '📄'}</span>
                    <span className="truncate">{doc.title || 'Untitled'}</span>
                  </Link>
                  <button
                    onClick={() => handleLeaveShared(doc.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all flex-shrink-0"
                    title="Remove from my shared list"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User profile */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 px-1.5 py-1.5 rounded-xl hover:bg-white/[0.06] transition-colors group cursor-default">
            <div className="w-7 h-7 rounded-lg bg-primary-600/80 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-white/75 truncate leading-tight">{user?.name}</p>
              <p className="text-[10px] text-white/30 truncate leading-tight">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/60 transition-all p-0.5 flex-shrink-0"
              title="Sign out"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-11 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          {currentWorkspace && (
            <span className="text-xs text-slate-400 font-medium">{currentWorkspace.name}</span>
          )}
          <button
            onClick={handleNewDoc}
            disabled={!canCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Doc
          </button>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Workspace share modal */}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        workspace={currentWorkspace}
      />

      {/* New workspace modal */}
      <Modal isOpen={showNewWs} onClose={() => setShowNewWs(false)} title="Create Workspace">
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Workspace name <span className="text-red-400">*</span>
            </label>
            <input
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              placeholder="e.g. Marketing Team"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              value={wsDesc}
              onChange={(e) => setWsDesc(e.target.value)}
              placeholder="What's this workspace for?"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !wsName.trim()}
            className="w-full py-2.5 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {creating && <Spinner size="sm" />}
            Create Workspace
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AppLayout;
