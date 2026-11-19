import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaceAPI } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { getFriendlyError } from '../utils/errorMessages';
import Modal from './Modal';
import Spinner from './Spinner';

const ROLE_STYLES = {
  OWNER: 'bg-amber-50 text-amber-600',
  EDITOR: 'bg-slate-100 text-slate-500',
  VIEWER: 'bg-blue-50 text-blue-600',
};

const ShareModal = ({ isOpen, onClose, workspace }) => {
  const { deleteWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [inviteRole, setInviteRole] = useState('EDITOR');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isOwner = workspace?.role === 'OWNER';

  useEffect(() => {
    if (isOpen && workspace?.id) {
      loadMembers();
      setError('');
      setSuccessMsg('');
      setQuery('');
      setResults([]);
    }
  }, [isOpen, workspace?.id]);

  useEffect(() => {
    if (!isOpen || !isOwner || query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const users = await workspaceAPI.searchUsers(workspace.id, query.trim());
        setResults(users);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, isOpen, isOwner, workspace?.id]);

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

  const handleInvite = async (user) => {
    setInviting(true);
    setError('');
    setSuccessMsg('');
    try {
      const member = await workspaceAPI.addMember(workspace.id, user.id, inviteRole);
      setMembers((prev) => [...prev, member]);
      setSuccessMsg(`${user.name} added as ${inviteRole.toLowerCase()}`);
      setQuery('');
      setResults([]);
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setError('');
    try {
      const member = await workspaceAPI.updateMemberRole(workspace.id, userId, newRole);
      setMembers((prev) => prev.map((m) => (m.user.id === userId ? member : m)));
    } catch (err) {
      setError(getFriendlyError(err));
    }
  };

  const handleRemove = async (userId) => {
    setError('');
    try {
      await workspaceAPI.removeMember(workspace.id, userId);
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
    } catch (err) {
      setError(getFriendlyError(err));
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!window.confirm(`Delete "${workspace.name}" permanently? This removes all its documents.`)) return;
    setDeleting(true);
    setError('');
    try {
      await deleteWorkspace(workspace.id);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setError(getFriendlyError(err));
      setDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Share "${workspace?.name}"`}>
      <div className="space-y-4">
        {isOwner && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email to invite…"
                disabled={inviting}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {query.trim().length >= 2 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {searching ? (
                    <div className="flex justify-center py-3">
                      <Spinner size="sm" />
                    </div>
                  ) : results.length === 0 ? (
                    <p className="text-xs text-slate-400 px-3 py-2">No matching users found.</p>
                  ) : (
                    results.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        disabled={inviting}
                        onClick={() => handleInvite(user)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-60"
                      >
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700 flex-shrink-0">
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="border border-slate-300 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent flex-shrink-0"
            >
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
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
                  {isOwner && m.role !== 'OWNER' ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.user.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 border-none focus:outline-none focus:ring-2 focus:ring-primary-500 ${ROLE_STYLES[m.role]}`}
                    >
                      <option value="EDITOR">editor</option>
                      <option value="VIEWER">viewer</option>
                    </select>
                  ) : (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ROLE_STYLES[m.role]}`}
                    >
                      {m.role.toLowerCase()}
                    </span>
                  )}
                  {isOwner && m.role !== 'OWNER' && (
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
          Editors can view, edit, and create documents in this workspace; viewers can only view.
        </p>

        {isOwner && (
          <button
            onClick={handleDeleteWorkspace}
            disabled={deleting}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-60"
          >
            {deleting && <Spinner size="sm" />}
            Delete this workspace
          </button>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;
