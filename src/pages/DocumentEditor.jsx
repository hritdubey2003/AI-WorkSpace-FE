import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

import { documentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDocumentSocket } from '../hooks/useDocumentSocket';
import { useAutoSave } from '../hooks/useAutoSave';
import EditorToolbar from '../components/EditorToolbar';
import AIPanel from '../components/AIPanel';
import DocShareModal from '../components/DocShareModal';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

const EMOJIS = ['📄', '📝', '💡', '🚀', '🎯', '📊', '🔥', '✅', '🌟', '📌'];

const AVATAR_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
const getAvatarColor = (uid) => {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const SaveStatusBadge = ({ status }) => {
  const config = {
    saved: {
      color: 'text-emerald-500',
      label: 'Saved',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    saving: {
      color: 'text-amber-500',
      label: 'Saving…',
      icon: <Spinner size="sm" />,
    },
    unsaved: {
      color: 'text-slate-400',
      label: 'Unsaved',
      icon: <div className="w-1.5 h-1.5 rounded-full bg-current" />,
    },
  };
  const c = config[status];
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${c.color}`}>
      {c.icon}
      {c.label}
    </span>
  );
};

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📄');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [showAI, setShowAI] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [toast, setToast] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const isRemoteUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (isRemoteUpdate.current) return;
      setSaveStatus('unsaved');
      triggerAutoSave();
      emitChange({ content: editor.getHTML(), title });
    },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const d = await documentAPI.getOne(id);
        setDoc(d);
        setTitle(d.title);
        setEmoji(d.emoji);
        editor?.commands.setContent(d.content || '');
      } catch {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (editor) load();
  }, [id, editor]);

  const handleRemoteUpdate = useCallback(
    ({ content, title: remoteTitle }) => {
      isRemoteUpdate.current = true;
      if (content && editor) editor.commands.setContent(content);
      if (remoteTitle) setTitle(remoteTitle);
      isRemoteUpdate.current = false;
    },
    [editor]
  );

  const handleDocumentLoaded = useCallback(
    ({ content, title: loadedTitle }) => {
      isRemoteUpdate.current = true;
      if (content && editor) editor.commands.setContent(content);
      if (loadedTitle) setTitle(loadedTitle);
      isRemoteUpdate.current = false;
    },
    [editor]
  );

  const { emitChange, emitTyping, typingUsers, collaboratorIds } = useDocumentSocket({
    docId: id,
    onRemoteUpdate: handleRemoteUpdate,
    onDocumentLoaded: handleDocumentLoaded,
  });

  const save = useCallback(async () => {
    if (!editor || !doc) return;
    setSaveStatus('saving');
    try {
      await documentAPI.update(id, { title, content: editor.getHTML(), emoji });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('unsaved');
    }
  }, [editor, doc, id, title, emoji]);

  const triggerAutoSave = useAutoSave(save, 2000);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setSaveStatus('unsaved');
    triggerAutoSave();
    emitChange({ content: editor?.getHTML(), title: e.target.value });
    emitTyping();
  };

  const handleEmojiSelect = (e) => {
    setEmoji(e);
    setShowEmojiPicker(false);
    setSaveStatus('unsaved');
    triggerAutoSave();
  };

  const handleApplyImprovement = (text) => {
    if (editor) {
      editor.commands.clearContent();
      editor.commands.insertContent(`<p>${text}</p>`);
      setSaveStatus('unsaved');
      triggerAutoSave();
      setToast({ message: 'AI improvements applied to document', type: 'success' });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this document permanently?')) return;
    try {
      await documentAPI.delete(id);
      navigate('/dashboard');
    } catch {
      setToast({ message: 'Failed to delete document', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-slate-400 text-sm mt-3">Loading document…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Editor column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Document header bar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-white">
          {/* Emoji + Title */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowEmojiPicker((v) => !v)}
                className="w-9 h-9 flex items-center justify-center text-xl hover:bg-slate-100 rounded-xl transition-colors"
              >
                {emoji}
              </button>
              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-panel p-2.5 grid grid-cols-5 gap-0.5 z-30">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => handleEmojiSelect(e)}
                      className="w-9 h-9 text-xl hover:bg-slate-100 rounded-xl flex items-center justify-center transition-colors"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled"
              className="text-base font-bold text-slate-900 bg-transparent border-none outline-none placeholder-slate-300 w-full min-w-0"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-4">
            {/* Collaborator avatars */}
            {collaboratorIds.length > 0 && (
              <div className="flex items-center -space-x-1.5 mr-2">
                {collaboratorIds.slice(0, 4).map((uid, i) => (
                  <div
                    key={uid}
                    className="w-6 h-6 rounded-full border-2 border-white flex-shrink-0"
                    style={{ backgroundColor: getAvatarColor(uid), zIndex: 4 - i }}
                    title="Collaborator online"
                  />
                ))}
                {collaboratorIds.length > 4 && (
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ zIndex: 0 }}
                  >
                    +{collaboratorIds.length - 4}
                  </div>
                )}
              </div>
            )}

            <SaveStatusBadge status={saveStatus} />

            <div className="w-px h-4 bg-slate-200 mx-1" />

            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Share
            </button>

            <button
              onClick={() => setShowAI((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showAI
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
              </svg>
              AI
            </button>

            <button
              onClick={handleDelete}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              title="Delete document"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Formatting toolbar */}
        <EditorToolbar editor={editor} />

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="px-6 py-1.5 text-xs text-slate-400 italic border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
            <span className="flex items-end gap-0.5 h-3">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
            {typingUsers.length === 1
              ? 'Someone is typing…'
              : `${typingUsers.length} people are typing…`}
          </div>
        )}

        {/* Editor body */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-12 py-10">
            <EditorContent editor={editor} className="min-h-[500px]" />
          </div>
        </div>
      </div>

      {/* AI Panel */}
      {showAI && (
        <div className="w-80 border-l border-slate-200 bg-white overflow-y-auto flex-shrink-0">
          <AIPanel docId={id} onApplyImprovement={handleApplyImprovement} />
        </div>
      )}

      {/* Share Modal */}
      <DocShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        docId={id}
        docTitle={title}
        isOwner={doc?.authorId === user?.id}
      />
    </div>
  );
};

export default DocumentEditor;
