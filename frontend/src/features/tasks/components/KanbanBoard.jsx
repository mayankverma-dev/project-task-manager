import React, { useMemo, useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';
import { useOptimisticTaskUpdate } from '../hooks/useOptimisticTaskUpdate';
import { TaskDetailsModal } from './TaskDetailsModal';
import { useThrottledCallback } from '../../../hooks/useThrottle';

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' }
];

export const KanbanBoard = ({ projectId, tasks = [] }) => {
  const { mutate: updateTask } = useOptimisticTaskUpdate();
  const [selectedTask, setSelectedTask] = useState(null);

  // Throttle the network call to at most once per 300ms.
  // Local UI updates instantly on every drop via onMutate — only the
  // PATCH request is throttled here so rapid sequential drops don't
  // flood the server.
  const throttledUpdateTask = useThrottledCallback(updateTask, 300);

  const groupedTasks = useMemo(() => {
    const groups = { todo: [], in_progress: [], in_review: [], done: [] };
    tasks.forEach(task => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    });
    
    // Sort tasks in each group by position
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.position - b.position);
    });

    return groups;
  }, [tasks]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const destColumn = groupedTasks[newStatus];
    
    let newPosition = 0;
    if (destColumn.length === 0) {
      newPosition = 1024;
    } else if (destination.index === 0) {
      newPosition = destColumn[0].position / 2;
    } else if (destination.index === destColumn.length) {
      newPosition = destColumn[destColumn.length - 1].position + 1024;
    } else {
      const prevPosition = destColumn[destination.index - 1].position;
      const nextPosition = destColumn[destination.index].position;
      newPosition = (prevPosition + nextPosition) / 2;
    }

    // Call API (Optimistic update runs under the hood)
    throttledUpdateTask({
      projectId,
      taskId: draggableId,
      data: { status: newStatus, position: newPosition }
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-full gap-4 p-4 overflow-x-auto">
        {COLUMNS.map(column => (
          <div key={column.id} className="flex flex-col flex-shrink-0 w-80">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {column.title} <span className="ml-2 text-neutral-400">{(groupedTasks[column.id] || []).length}</span>
              </h3>
            </div>
            
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 p-2 rounded-xl bg-neutral-100/50 dark:bg-neutral-900/50 ${
                    snapshot.isDraggingOver ? 'ring-2 ring-blue-500/20' : ''
                  }`}
                >
                  {(groupedTasks[column.id] || []).map((task, index) => (
                    <TaskCard key={task.id} task={task} index={index} onClick={() => setSelectedTask(task)} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
      <TaskDetailsModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </DragDropContext>
  );
};
