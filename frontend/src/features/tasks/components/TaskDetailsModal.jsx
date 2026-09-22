import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Send, Trash2, Paperclip, Download, UploadCloud, Calendar, User, Check, Edit2 } from 'lucide-react';
import { useComments, useCreateComment, useDeleteComment } from '../hooks/useComments';
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '../hooks/useAttachments';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { CommentSkeleton } from './CommentSkeleton.jsx';
import { AttachmentSkeleton } from './AttachmentSkeleton.jsx';
import { useOptimisticTaskUpdate } from '../hooks/useOptimisticTaskUpdate';
import { useWorkspaceMembers } from '../../workspaces/hooks/useWorkspaces';

const commentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(5000),
});

const priorityColors = {
  urgent: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  high: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
  medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20',
  low: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
};

export const TaskDetailsModal = ({ task, workspaceId, isOpen, onClose }) => {
  const user = useSelector((state) => state.auth.user);
  
  const { data: membersResponse } = useWorkspaceMembers(workspaceId);
  const members = membersResponse?.data || [];
  
  const { mutate: updateTask } = useOptimisticTaskUpdate();

  const {
    data: commentsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useComments(isOpen ? task?.id : null);

  const { mutate: createComment, isPending: isCreating } = useCreateComment(task?.id);
  const { mutate: deleteComment } = useDeleteComment(task?.id);

  const { data: attachmentsData, isLoading: isLoadingAttachments } = useAttachments(isOpen ? task?.id : null);
  const { mutate: uploadAttachment, isPending: isUploading } = useUploadAttachment(task?.id);
  const { mutate: deleteAttachment } = useDeleteAttachment(task?.id);

  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: { body: '' },
  });

  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    if (task) {
      setEditValues({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        assigneeId: task.assigneeId || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      });
    }
  }, [task]);

  useEffect(() => {
    if (editingField === 'title' || editingField === 'description') {
      inputRef.current?.focus();
    }
  }, [editingField]);

  if (!isOpen || !task) return null;

  const handleUpdateField = (field, value) => {
    if (value !== task[field]) {
      const updateData = { [field]: value };
      if (value === '') updateData[field] = null;
      updateTask({ projectId: task.projectId, taskId: task.id, data: updateData });
    }
    setEditingField(null);
  };

  const onSubmitComment = (data) => {
    createComment(data.body, {
      onSuccess: () => reset()
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size exceeds 50MB limit');
        return;
      }
      uploadAttachment(file);
    }
  };

  const comments = commentsData?.pages.flatMap(page => page.data) || [];
  const attachments = attachmentsData?.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-4xl h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl dark:bg-neutral-900 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex-1 mr-4">
            {editingField === 'title' ? (
              <input
                ref={inputRef}
                value={editValues.title}
                onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                onBlur={() => handleUpdateField('title', editValues.title)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateField('title', editValues.title)}
                className="w-full text-xl font-bold bg-white dark:bg-neutral-950 border-blue-500 border-2 rounded px-2 py-1 outline-none text-neutral-900 dark:text-white"
              />
            ) : (
              <h2
                onClick={() => setEditingField('title')}
                className="text-xl font-bold text-neutral-900 dark:text-white cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2 py-1 rounded transition-colors"
                title="Click to edit"
              >
                {task.title}
              </h2>
            )}
            
            <div className="flex items-center gap-3 mt-3 px-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-neutral-200/50 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                {task.status.replace('_', ' ')}
              </span>
              
              <div className="relative group">
                <select
                  value={editValues.priority}
                  onChange={(e) => {
                    setEditValues({ ...editValues, priority: e.target.value });
                    handleUpdateField('priority', e.target.value);
                  }}
                  className={`appearance-none cursor-pointer pl-2.5 pr-8 py-1 text-xs font-semibold uppercase tracking-wider rounded-md border transition-colors outline-none ${priorityColors[editValues.priority]}`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-50">
                  ▼
                </div>
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Main Column */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-8 border-r dark:border-neutral-800">
            {/* Description */}
            <section>
              <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Description</h3>
              {editingField === 'description' ? (
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={editValues.description}
                    onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                    rows={4}
                    className="w-full text-sm bg-white dark:bg-neutral-950 border-2 border-blue-500 rounded-lg p-3 outline-none text-neutral-800 dark:text-neutral-200 resize-none"
                    placeholder="Add a description..."
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button 
                      onClick={() => setEditingField(null)}
                      className="px-3 py-1.5 text-xs font-medium bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 rounded hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleUpdateField('description', editValues.description)}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setEditingField('description')}
                  className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 p-3 rounded-lg border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-all min-h-[4rem]"
                >
                  {task.description || <span className="text-neutral-400 italic">Click to add description...</span>}
                </div>
              )}
            </section>

            {/* Attachments */}
            <section>
              <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Attachments</h3>
              <div className="mb-4 relative border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:border-blue-500/50 transition-colors group">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <UploadCloud className="w-5 h-5 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300 group-hover:text-blue-500 transition-colors">
                  {isUploading ? 'Uploading...' : 'Drop files or click to upload'}
                </span>
              </div>

              {isLoadingAttachments ? (
                <AttachmentSkeleton />
              ) : attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-3 p-3 border rounded-xl dark:border-neutral-800 group hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors bg-white dark:bg-neutral-900 shadow-sm">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg shrink-0">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate" title={attachment.filename}>
                          {attachment.filename}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {(attachment.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-neutral-800 rounded-md"
                          title="Download/View"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => deleteAttachment(attachment.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-neutral-800 rounded-md"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
            
            {/* Comments */}
            <section>
              <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">Comments</h3>
              <form onSubmit={handleSubmit(onSubmitComment)} className="mb-6 relative">
                <textarea
                  {...register('body')}
                  placeholder="Write a comment..."
                  className="w-full p-4 pr-12 text-sm border rounded-xl resize-none dark:bg-neutral-950 dark:border-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  rows={2}
                />
                <button
                  type="submit"
                  disabled={isCreating}
                  className="absolute right-3 bottom-3 p-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <div className="space-y-5">
                {isLoading ? (
                  <CommentSkeleton count={2} />
                ) : comments.length === 0 ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">No comments yet.</p>
                ) : (
                  <>
                    {comments.map((comment) => (
                      <div key={comment.id} className={`flex gap-3 ${comment.isOptimistic ? 'opacity-50' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                          {(comment.userName || user?.name || 'U').charAt(0)}
                        </div>
                        <div className="flex-1 bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded-2xl rounded-tl-none relative group border border-neutral-100 dark:border-neutral-800 shadow-sm">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="text-xs font-bold text-neutral-900 dark:text-white">
                              {comment.userName || user?.name || 'User'}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {comment.isOptimistic ? 'Sending...' : new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                            {comment.body}
                          </p>
                          {!comment.isOptimistic && (
                            <button
                              onClick={() => deleteComment(comment.id)}
                              className="absolute -right-2 -top-2 p-1.5 bg-white dark:bg-neutral-900 text-neutral-400 hover:text-red-500 border dark:border-neutral-700 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {hasNextPage && (
                      <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="w-full py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 rounded-xl transition-colors"
                      >
                        {isFetchingNextPage ? 'Loading...' : 'Load more comments'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar / Properties Column */}
          <div className="w-full md:w-64 bg-neutral-50/50 dark:bg-neutral-900/30 p-5 space-y-6 overflow-y-auto border-t md:border-t-0 border-neutral-200 dark:border-neutral-800">
            
            {/* Assignee */}
            <div>
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <User className="w-4 h-4" /> Assignee
              </h3>
              <div className="relative group">
                <select
                  value={editValues.assigneeId}
                  onChange={(e) => {
                    setEditValues({ ...editValues, assigneeId: e.target.value });
                    handleUpdateField('assigneeId', e.target.value);
                  }}
                  className="w-full appearance-none cursor-pointer text-sm font-medium text-neutral-900 dark:text-white bg-transparent hover:bg-neutral-200/50 dark:hover:bg-neutral-800 p-2 rounded-lg border border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 outline-none transition-colors"
                >
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Due Date
              </h3>
              <div className="relative group">
                <input
                  type="date"
                  value={editValues.dueDate}
                  onChange={(e) => {
                    setEditValues({ ...editValues, dueDate: e.target.value });
                    handleUpdateField('dueDate', e.target.value ? new Date(e.target.value).toISOString() : null);
                  }}
                  className="w-full appearance-none cursor-pointer text-sm font-medium text-neutral-900 dark:text-white bg-transparent hover:bg-neutral-200/50 dark:hover:bg-neutral-800 p-2 rounded-lg border border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
                <p>Created by: <span className="font-medium text-neutral-700 dark:text-neutral-300">{task.createdByName || 'Unknown'}</span></p>
                <p>Created: <span className="font-medium text-neutral-700 dark:text-neutral-300">{new Date(task.createdAt).toLocaleDateString()}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
