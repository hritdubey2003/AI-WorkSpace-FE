import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

export const useDocumentSocket = ({
  docId,
  onRemoteUpdate,
  onCollaborators,
  onDocumentLoaded,
}) => {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [collaboratorIds, setCollaboratorIds] = useState([]);
  const typingTimers = useRef({});

  useEffect(() => {
    if (!docId || !token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    if (!socket.connected) socket.connect();

    socket.emit('join-document', { docId });

    socket.on('document-loaded', (data) => {
      onDocumentLoaded && onDocumentLoaded(data);
    });

    socket.on('document-updated', (data) => {
      onRemoteUpdate && onRemoteUpdate(data);
    });

    socket.on('collaborators-update', (data) => {
      setCollaboratorIds(data.userIds || []);
      onCollaborators && onCollaborators(data);
    });

    socket.on('collaborator-typing', ({ userId }) => {
      setTypingUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
      if (typingTimers.current[userId]) clearTimeout(typingTimers.current[userId]);
      typingTimers.current[userId] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((id) => id !== userId));
      }, 3000);
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err.message);
    });

    return () => {
      socket.emit('leave-document', { docId });
      socket.off('document-loaded');
      socket.off('document-updated');
      socket.off('collaborators-update');
      socket.off('collaborator-typing');
      socket.off('error');
      Object.values(typingTimers.current).forEach(clearTimeout);
    };
  }, [docId, token]);

  const emitChange = useCallback(
    ({ content, title }) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('document-change', { docId, content, title });
      }
    },
    [docId]
  );

  const emitTyping = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('user-typing', { docId });
    }
  }, [docId]);

  return { emitChange, emitTyping, typingUsers, collaboratorIds };
};
