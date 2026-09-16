import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Clock, MessageSquare, Paperclip } from 'lucide-react';

const priorityColors = {
  urgent: 'text-red-500 bg-red-50 dark:bg-red-500/10',
  high: 'text-orange-500 bg-orange-50 dark:bg-orange-500/10',
  medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10',
  low: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
};

export const TaskCard = ({ task, index, onClick }) => {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`relative flex flex-col gap-3 p-3 mb-2 bg-white border rounded-lg shadow-sm group dark:bg-neutral-900 dark:border-neutral-800 cursor-pointer ${
            snapshot.isDragging ? 'shadow-lg border-blue-500/50' : 'hover:border-neutral-300 dark:hover:border-neutral-700'
          }`}
          style={provided.draggableProps.style}
        >
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-medium leading-snug text-neutral-900 dark:text-neutral-100 line-clamp-2">
              {task.title}
            </h4>
          </div>
          
          {task.description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-neutral-400">
              <div className="flex items-center text-[11px]">
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                <span>{task.commentCount || 0}</span>
              </div>
              <div className="flex items-center text-[11px]">
                <Paperclip className="w-3.5 h-3.5 mr-1" />
                <span>0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};
