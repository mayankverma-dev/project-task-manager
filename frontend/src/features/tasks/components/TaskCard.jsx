import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Clock, MessageSquare, Paperclip, Calendar } from 'lucide-react';
import { isPast, isToday, format } from 'date-fns';

const priorityColors = {
  urgent: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20',
  high: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20',
  medium: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20',
  low: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20',
};

export const TaskCard = ({ task, index, onClick }) => {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
  
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`relative flex flex-col gap-3 p-3.5 mb-3 bg-white border rounded-xl shadow-sm group dark:bg-neutral-900 dark:border-neutral-800 cursor-pointer transition-all duration-200 ease-in-out ${
            snapshot.isDragging 
              ? 'shadow-xl border-blue-500/50 scale-[1.02] rotate-1 z-50' 
              : 'hover:shadow-md hover:-translate-y-0.5 hover:border-neutral-300 dark:hover:border-neutral-700'
          }`}
          style={provided.draggableProps.style}
        >
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-semibold leading-snug text-neutral-900 dark:text-neutral-100 line-clamp-2">
              {task.title}
            </h4>
          </div>
          
          {task.description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-1 pt-2 border-t border-neutral-100 dark:border-neutral-800/50">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
              
              {task.dueDate && (
                <div className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border ${
                  isOverdue 
                    ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' 
                    : 'text-neutral-600 bg-neutral-50 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
                }`}>
                  <Calendar className="w-3 h-3" />
                  {format(new Date(task.dueDate), 'MMM d')}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-neutral-400 shrink-0">
              {(task.commentCount > 0 || task.attachmentCount > 0) && (
                <div className="flex items-center gap-2">
                  {task.commentCount > 0 && (
                    <div className="flex items-center text-[11px] font-medium">
                      <MessageSquare className="w-3.5 h-3.5 mr-1 text-neutral-400" />
                      <span>{task.commentCount}</span>
                    </div>
                  )}
                  {task.attachmentCount > 0 && (
                    <div className="flex items-center text-[11px] font-medium">
                      <Paperclip className="w-3.5 h-3.5 mr-1 text-neutral-400" />
                      <span>{task.attachmentCount}</span>
                    </div>
                  )}
                </div>
              )}

              {task.assigneeName && (
                <div 
                  className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] uppercase shadow-sm border border-indigo-200 dark:border-indigo-800"
                  title={`Assigned to ${task.assigneeName}`}
                >
                  {task.assigneeName.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};
