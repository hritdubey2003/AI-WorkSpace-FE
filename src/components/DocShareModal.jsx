import React, { useState, useEffect } from 'react';
import { documentAPI } from '../services/api';
import { getFriendlyError } from '../utils/errorMessages';
import Modal from './Modal';
import Spinner from './Spinner';

const DocShareModal = ({ isOpen, onClose, docId, docTitle, isOwner }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EDITOR');
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && docId && isOwner) {
      loadCollaborators();
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, docId]);

  const loadCollaborators = async () => {
    setLoading(true);
    try {
      const data = await documentAPI.getCollaborators(docId);
      setCollaborators(data);
    } catch {
      setError('Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSharing(true);
    setError('');
    setSuccessMsg('');
    try {
      const entry = await documentAPI.shareDoc(docId, email.trim(), role);
      setCollaborators((prev) => [...prev.filter((c) => c.userId !== entry.userId), entry]);
      setSuccessMsg(`${email.trim()} now has ${role.toLowerCase()} access`);
      setEmail('');
      setRole('EDITOR');
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setSharing(false);
    }
  };

  const handleRoleChange = async (collaborator, newRole) => {
    setError('');
    try {
      const entry = await documentAPI.shareDoc(docId, collaborator.user.email, newRole);
      setCollaborators((prev) => prev.map((c) => (c.userId === entry.userId ? entry : c)));
    } catch (err) {
      setError(getFriendlyError(err));
    }
  };

  const handleRemove = async (userId) => {
    setError('');
    try {
      await documentAPI.removeCollaborator(docId, userId);
      setCollaborators((prev) => prev.filter((c) => c.userId !== userId));
    } catch (err) {
      setError(getFriendlyError(err));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Share "${docTitle || 'Document'}"`}>
      <div className="space-y-4">
        {!isOwner ? (
          <p className="text-sm text-slate-500">Only the document owner can manage sharing.</p>
        ) : (
          <>
            <form onSubmit={handleShare} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Share with email address…"
                className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border border-slate-300 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent flex-shrink-0"
              >
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={sharing || !email.trim()}
                className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60 flex items-center gap-1.5 flex-shrink-0"
              >
                {sharing && <Spinner size="sm" />}
                Share
              </button>
            </form>

            {error && <p className="text-xs text-red-500">{error}</p>}
            {successMsg && <p className="text-xs text-emerald-600">{successMsg}</p>}

            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
                People with access ({collaborators.length})
              </p>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : collaborators.length === 0 ? (
                <p className="text-xs text-slate-400 px-1">
                  No collaborators yet. Share with someone above.
                </p>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {collaborators.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 px-1 py-2 rounded-lg hover:bg-slate-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-700 flex-shrink-0">
                        {c.user.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {c.user.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{c.user.email}</p>
                      </div>
                      <select
                        value={c.role}
                        onChange={(e) => handleRoleChange(c, e.target.value)}
                        className="text-xs px-2 py-1 rounded-full font-medium bg-slate-100 text-slate-500 flex-shrink-0 border-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="EDITOR">editor</option>
                        <option value="VIEWER">viewer</option>
                      </select>
                      <button
                        onClick={() => handleRemove(c.userId)}
                        className="text-slate-300 hover:text-red-400 transition-colors text-sm ml-1 flex-shrink-0"
                        title="Remove access"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
          Editors can view and edit this document; viewers have read-only access.
        </p>
      </div>
    </Modal>
  );
};

export default DocShareModal;
