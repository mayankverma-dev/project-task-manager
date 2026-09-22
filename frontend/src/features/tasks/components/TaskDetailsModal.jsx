import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Send, Trash2, Paperclip, Download, UploadCloud } from 'lucide-react';
import { useComments, useCreateComment, useDeleteComment } from '../hooks/useComments';
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '../hooks/useAttachments';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { CommentSkeleton } from './CommentSkeleton.jsx';
import { AttachmentSkeleton } from './AttachmentSkeleton.jsx';

const commentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(5000),
});

export const TaskDetailsModal = ({ task, isOpen, onClose }) => {
  const user = useSelector((state) => state.auth.user);
  
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

  if (!isOpen || !task) return null;

  const onSubmit = (data) => {
    createComment(data.body, {
      onSuccess: () => {
        reset();
      }
    });
  };

  const comments = commentsData?.pages.flatMap(page => page.data) || [];
  const attachments = attachmentsData?.data || [];

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl h-[80vh] flex flex-col bg-white rounded-lg shadow-lg dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b dark:border-neutral-800">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              {task.title}
            </h2>
            <div className="flex items-center gap-2 mt-2">
               <span className={`px-2 py-0.5 text-xs font-semibold uppercase rounded bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400`}>
                 {task.status.replace('_', ' ')}
               </span>
               <span className="px-2 py-0.5 text-xs font-semibold uppercase rounded bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                 {task.priority}
               </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {task.createdByName && (
            <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span>Created by {task.createdByName}</span>
              {task.createdByEmail && <span className="text-xs">({task.createdByEmail})</span>}
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
              {task.description || 'No description provided.'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">Attachments</h3>
            
            <div className="mb-4 relative border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
              <input 
                type="file" 
                onChange={handleFileUpload} 
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
              />
              <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isUploading ? 'Uploading...' : 'Click or drag file to this area to upload'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max size: 50MB</p>
            </div>

            {isLoadingAttachments ? (
              <AttachmentSkeleton />
            ) : attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center gap-3 p-3 border rounded-lg dark:border-neutral-800 group">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-md shrink-0">
                      <Paperclip className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {attachment.filename}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB • {new Date(attachment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-neutral-800 rounded-md"
                        title="Download/View"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => deleteAttachment(attachment.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-neutral-800 rounded-md"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">Comments</h3>
            
            {/* Comment Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mb-6 relative">
              <textarea
                {...register('body')}
                placeholder="Write a comment..."
                className="w-full p-3 pr-12 text-sm border rounded-lg resize-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
              />
              <button
                type="submit"
                disabled={isCreating}
                className="absolute right-3 bottom-3 p-1.5 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {isLoading ? (
                <CommentSkeleton count={2} />
              ) : comments.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">No comments yet.</p>
              ) : (
                <>
                  {comments.map((comment) => (
                    <div key={comment.id} className={`flex gap-3 ${comment.isOptimistic ? 'opacity-50' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                        {(comment.userName || user?.name || 'U').charAt(0)}
                      </div>
                      <div className="flex-1 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-lg relative group">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-medium text-neutral-900 dark:text-white">
                            {comment.userName || user?.name || 'User'}
                          </span>
                          {(comment.userEmail || user?.email) && <span className="text-[10px] text-neutral-500">{comment.userEmail || user?.email}</span>}
                          <span className="text-[10px] text-neutral-500 ml-auto">
                            {comment.isOptimistic ? 'Sending...' : new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                          {comment.body}
                        </p>
                        
                        {/* Only show delete if not optimistic and user is author (we'd need real user check, simplified here) */}
                        {!comment.isOptimistic && (
                          <button 
                            onClick={() => deleteComment(comment.id)}
                            className="absolute top-3 right-3 p-1 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
                      className="w-full py-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                    >
                      {isFetchingNextPage ? 'Loading...' : 'Load more comments'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
