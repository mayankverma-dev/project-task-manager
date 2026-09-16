import { useEffect } from 'react';
import { useWebSocket } from './useWebSocket.js';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

export const useRealTimeUpdates = () => {
  const socket = useWebSocket();
  const queryClient = useQueryClient();
  const activeWorkspace = useSelector(state => state.workspaces.activeWorkspace);

  useEffect(() => {
    if (!socket || !activeWorkspace) return;

    const handleTaskCreated = ({ task }) => {
      // Actual cache key pattern: ['tasks', projectId, filters]
      // Partial match on ['tasks', projectId] invalidates all filter variants for this project
      queryClient.invalidateQueries({ queryKey: ['tasks', task.projectId] });
      // Actual dashboard key: ['workspace', workspaceId, 'dashboard']
      queryClient.invalidateQueries({ queryKey: ['workspace', activeWorkspace.id, 'dashboard'] });
    };

    const handleTaskUpdated = ({ task }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.projectId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', activeWorkspace.id, 'dashboard'] });
    };

    const handleTaskDeleted = ({ taskId }) => {
      // No projectId in deletion payload — invalidate all tasks queries broadly
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', activeWorkspace.id, 'dashboard'] });
    };

    const handleCommentCreated = ({ comment }) => {
      // Actual cache key: ['tasks', taskId, 'comments']
      queryClient.invalidateQueries({ queryKey: ['tasks', comment.taskId, 'comments'] });
    };

    const handleCommentDeleted = ({ commentId, taskId }) => {
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'comments'] });
      } else {
        // Fallback: invalidate all tasks queries
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    };

    socket.on('task.created', handleTaskCreated);
    socket.on('task.updated', handleTaskUpdated);
    socket.on('task.deleted', handleTaskDeleted);
    socket.on('comment.created', handleCommentCreated);
    socket.on('comment.deleted', handleCommentDeleted);

    return () => {
      socket.off('task.created', handleTaskCreated);
      socket.off('task.updated', handleTaskUpdated);
      socket.off('task.deleted', handleTaskDeleted);
      socket.off('comment.created', handleCommentCreated);
      socket.off('comment.deleted', handleCommentDeleted);
    };
  }, [socket, queryClient, activeWorkspace]);
};
