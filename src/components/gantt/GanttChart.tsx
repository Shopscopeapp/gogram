import React from 'react';
import NextGanttChart from './NextGanttChart';
import type { Task } from '../../types';

interface GanttChartProps {
  tasks: Task[];
  onTaskMove?: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
  onTaskClick?: (task: Task) => void;
  onTaskReorder?: (activeId: string, overId: string) => void;
  readOnly?: boolean;
  showDependencies?: boolean;
  timelineStart?: Date;
  timelineEnd?: Date;
  onAddTask?: () => void;
}

export default function GanttChart({
  tasks,
  onTaskMove,
  onTaskClick,
  onTaskReorder,
  readOnly = false,
  showDependencies = true,
  timelineStart,
  timelineEnd,
  onAddTask
}: GanttChartProps) {

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    if (onTaskMove && updates.start_date && updates.end_date) {
      onTaskMove(taskId, new Date(updates.start_date), new Date(updates.end_date));
    }
  };

  const handleTaskReorder = (draggedTaskId: string, targetIndex: number) => {
    if (onTaskReorder && targetIndex >= 0 && targetIndex < tasks.length) {
      const targetTask = tasks[targetIndex];
      onTaskReorder(draggedTaskId, targetTask.id);
    }
  };

  return (
    <NextGanttChart
      tasks={tasks}
      onTaskClick={onTaskClick}
      onTaskUpdate={handleTaskUpdate}
      readOnly={readOnly}
      showDependencies={showDependencies}
      timelineStart={timelineStart}
      timelineEnd={timelineEnd}
    />
  );
}