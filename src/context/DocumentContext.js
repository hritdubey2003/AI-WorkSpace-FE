import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { documentAPI } from '../services/api';
import { useWorkspace } from './WorkspaceContext';

const DocumentContext = createContext(null);

export const DocumentProvider = ({ children }) => {
  const { currentWorkspace } = useWorkspace();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = useCallback(async (workspaceId) => {
    if (!workspaceId) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    try {
      const data = await documentAPI.getByWorkspace(workspaceId);
      setDocuments(data);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments(currentWorkspace?.id);
  }, [currentWorkspace?.id, fetchDocuments]);

  const createDocument = useCallback(async (payload) => {
    const doc = await documentAPI.create(payload);
    setDocuments((prev) => [doc, ...prev]);
    return doc;
  }, []);

  const deleteDocument = useCallback(async (id) => {
    await documentAPI.delete(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // Sync local title/emoji after the editor saves — no extra API call
  const syncDocument = useCallback((id, changes) => {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...changes } : d)));
  }, []);

  return (
    <DocumentContext.Provider value={{ documents, loading, createDocument, deleteDocument, syncDocument }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => useContext(DocumentContext);
