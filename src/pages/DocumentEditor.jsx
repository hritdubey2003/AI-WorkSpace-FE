import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

import { documentAPI } from "../services/api";
import { useDocuments } from "../context/DocumentContext";
import { getFriendlyError } from "../utils/errorMessages";
import { useDocumentSocket } from "../hooks/useDocumentSocket";
import { useAutoSave } from "../hooks/useAutoSave";
import EditorToolbar from "../components/EditorToolbar";
import AIPanel from "../components/AIPanel";
import DocShareModal from "../components/DocShareModal";
import Spinner from "../components/Spinner";
import Toast from "../components/Toast";

const EMOJIS = ["📄", "📝", "💡", "🚀", "🎯", "📊", "🔥", "✅", "🌟", "📌"];

const AVATAR_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];
const getAvatarColor = (uid) => {
  let hash = 0;
  for (let i = 0; i < uid.length; i++)
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const SaveStatusBadge = ({ status }) => {
  const config = {
    saved: {
      color: "text-emerald-500",
      label: "Saved",
      icon: (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
    },
    saving: {
      color: "text-amber-500",
      label: "Saving…",
      icon: <Spinner size="sm" />,
    },
    unsaved: {
      color: "text-slate-400",
      label: "Unsaved",
      icon: <div className="w-1.5 h-1.5 rounded-full bg-current" />,
    },
  };
  const c = config[status];
  return (
    <span
      className={`flex items-center gap-1.5 text-xs font-medium ${c.color}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
};

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteDocument, syncDocument } = useDocuments();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("📄");
  const [saveStatus, setSaveStatus] = useState("saved");
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
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      if (isRemoteUpdate.current) return;
      setSaveStatus("unsaved");
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
        editor?.commands.setContent(d.content || "");
        editor?.setEditable(d.canEdit !== false);
      } catch {
        navigate("/dashboard");
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
    [editor],
  );

  const handleDocumentLoaded = useCallback(
    ({ content, title: loadedTitle }) => {
      isRemoteUpdate.current = true;
      if (content && editor) editor.commands.setContent(content);
      if (loadedTitle) setTitle(loadedTitle);
      isRemoteUpdate.current = false;
    },
    [editor],
  );

  const { emitChange, emitTyping, typingUsers, collaboratorIds } =
    useDocumentSocket({
      docId: id,
      onRemoteUpdate: handleRemoteUpdate,
      onDocumentLoaded: handleDocumentLoaded,
    });

  const save = useCallback(async () => {
    if (!editor || !doc) return;
    setSaveStatus("saving");
    try {
      await documentAPI.update(id, { title, content: editor.getHTML(), emoji });
      setSaveStatus("saved");
      syncDocument(id, { title, emoji });
    } catch {
      setSaveStatus("unsaved");
    }
  }, [editor, doc, id, title, emoji, syncDocument]);

  const triggerAutoSave = useAutoSave(save, 2000);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setSaveStatus("unsaved");
    triggerAutoSave();
    emitChange({ content: editor?.getHTML(), title: e.target.value });
    emitTyping();
  };

  const handleEmojiSelect = (e) => {
    setEmoji(e);
    setShowEmojiPicker(false);
    setSaveStatus("unsaved");
    triggerAutoSave();
  };

  const handleApplyImprovement = (text) => {
    if (editor) {
      editor.commands.clearContent();
      editor.commands.insertContent(`<p>${text}</p>`);
      setSaveStatus("unsaved");
      triggerAutoSave();
      setToast({
        message: "AI improvements applied to document",
        type: "success",
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this document permanently?")) return;
    try {
      await deleteDocument(id);
      navigate("/dashboard");
    } catch (err) {
      setToast({ message: getFriendlyError(err), type: "error" });
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
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Editor column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Document header */}
        <div className="border-b border-slate-100 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-6">
            {/* Left */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Emoji */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => doc?.canEdit !== false && setShowEmojiPicker((v) => !v)}
                  disabled={doc?.canEdit === false}
                  className="
            w-14 h-14
            flex items-center justify-center
            text-3xl
            bg-slate-50
            border border-slate-200
            rounded-2xl
            hover:bg-white
            hover:border-slate-300
            hover:shadow-sm
            transition-all
          "
                >
                  {emoji}
                </button>

                {showEmojiPicker && (
                  <div
                    className="
              absolute top-full left-0 mt-3
              bg-white
              border border-slate-200
              rounded-3xl
              shadow-xl
              p-3
              grid grid-cols-5 gap-2
              z-30
              w-72
            "
                  >
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => handleEmojiSelect(e)}
                        className="
                  h-11 w-11
                  text-2xl
                  rounded-xl
                  hover:bg-slate-100
                  transition-colors
                  flex items-center justify-center
                "
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title + Save */}
              <div className="flex flex-col flex-1 min-w-0">
                <input
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Untitled"
                  disabled={doc?.canEdit === false}
                  className="
            text-2xl
            font-semibold
            text-slate-900
            bg-transparent
            border-none
            outline-none
            placeholder:text-slate-300
            w-full
            min-w-0
          "
                />

                <div className="mt-1">
                  <SaveStatusBadge status={saveStatus} />
                </div>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Collaborators */}
              {collaboratorIds.length > 0 && (
                <div className="flex items-center -space-x-2">
                  {collaboratorIds.slice(0, 4).map((uid, i) => (
                    <div
                      key={uid}
                      className="
                w-8 h-8
                rounded-full
                border-2 border-white
                shadow-sm
              "
                      style={{
                        backgroundColor: getAvatarColor(uid),
                        zIndex: 4 - i,
                      }}
                      title="Collaborator online"
                    />
                  ))}

                  {collaboratorIds.length > 4 && (
                    <div
                      className="
                w-8 h-8
                rounded-full
                border-2 border-white
                bg-slate-300
                flex items-center justify-center
                text-xs font-semibold text-white
              "
                    >
                      +{collaboratorIds.length - 4}
                    </div>
                  )}
                </div>
              )}

              {/* Share */}
              <button
                onClick={() => setShowShare(true)}
                className="
          flex items-center gap-2
          px-4 py-2
          rounded-xl
          text-sm font-medium
          text-slate-700
          border border-slate-200
          hover:bg-slate-50
          transition-colors
        "
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Share
              </button>

              {/* AI */}
              <button
                onClick={() => setShowAI((v) => !v)}
                className={`
          flex items-center gap-2
          px-4 py-2
          rounded-xl
          text-sm font-medium
          transition-all
          ${
            showAI
              ? "bg-primary-600 text-white shadow-sm"
              : "border border-slate-200 text-slate-700 hover:bg-slate-50"
          }
        `}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2"
                  />
                </svg>
                AI Assistant
              </button>

              {/* Delete */}
              <button
                onClick={handleDelete}
                className="
          w-10 h-10
          rounded-xl
          flex items-center justify-center
          text-slate-400
          hover:text-red-500
          hover:bg-red-50
          transition-colors
        "
                title="Delete document"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
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
              ? "Someone is typing…"
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
        isOwner={doc?.isWorkspaceOwner === true}
      />
    </div>
  );
};

export default DocumentEditor;
