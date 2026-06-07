import React, { useState, useEffect } from 'react';
import { workspaceAPI } from '../services/api';
import Modal from './Modal';
import Spinner from './Spinner';

const ShareModal = ({ isOpen, onClose, workspace }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isOwner = workspace?.role === 'owner';

  useEffect(() => {
    if (isOpen && workspace?.id) {
      loadMembers();
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, workspace?.id]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const ws = await workspaceAPI.getOne(workspace.id);
      setMembers(ws.members || []);
    } catch {
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    setError('');
    setSuccessMsg('');
    try {
      const member = await workspaceAPI.addMember(workspace.id, email.trim());
      setMembers((prev) => [...prev, member]);
      setSuccessMsg(`${email.trim()} added successfully`);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId) => {
    setError('');
    try {
      await workspaceAPI.removeMember(workspace.id, userId);
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Share "${workspace?.name}"`}>
      <div className="space-y-4">
        {isOwner && (
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Invite by email address…"
              className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={inviting || !email.trim()}
              className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60 flex items-center gap-1.5 flex-shrink-0"
            >
              {inviting && <Spinner size="sm" />}
              Invite
            </button>
          </form>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
        {successMsg && <p className="text-xs text-emerald-600">{successMsg}</p>}

        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
            Members ({members.length})
          </p>
          {loading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-1 py-2 rounded-lg hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-700 flex-shrink-0">
                    {m.user.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{m.user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{m.user.email}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      m.role === 'owner'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {m.role}
                  </span>
                  {isOwner && m.role !== 'owner' && (
                    <button
                      onClick={() => handleRemove(m.user.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors text-sm ml-1 flex-shrink-0"
                      title="Remove member"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
          All workspace members can view and edit every document in this workspace.
        </p>
      </div>
    </Modal>
  );
};

export default ShareModal;
