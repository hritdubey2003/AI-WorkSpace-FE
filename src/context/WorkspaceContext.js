import React, { createContext, useContext, useState, useCallback } from 'react';
import { workspaceAPI } from '../services/api';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const data = await workspaceAPI.getAll();
      setWorkspaces(data);
      if (data.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  const createWorkspace = async (payload) => {
    const ws = await workspaceAPI.create(payload);
    setWorkspaces((prev) => [ws, ...prev]);
    setCurrentWorkspace(ws);
    return ws;
  };

  const deleteWorkspace = async (id) => {
    await workspaceAPI.delete(id);
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    if (currentWorkspace?.id === id) {
      setCurrentWorkspace(workspaces.find((w) => w.id !== id) || null);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        loading,
        fetchWorkspaces,
        createWorkspace,
        deleteWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);