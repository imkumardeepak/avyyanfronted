import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DragDropTable } from '@/components/DragDropTable';
import { TaskDialog } from '@/components/TaskDialog';
import { TaskDeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { createTaskColumns } from '@/components/TaskTable/columns';
import {
  useTasks,
  useTaskStats,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useReorderTasks,
} from '@/hooks/useTasks';
import { type Task } from '@/data/mockTasks';
import { Plus, Search, Filter, ArrowUpDown, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/DataTable';

const TasksPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // React Query hooks
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: stats } = useTaskStats();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const reorderTasksMutation = useReorderTasks();

  // Handlers
  const handleCreateTask = async (taskData: any) => {
    try {
      await createTaskMutation.mutateAsync({
        ...taskData,
        assignee: {
          id: taskData.assigneeId,
          name: 'User',
          email: 'user@example.com',
        },
        project: { id: taskData.projectId, name: 'Project', color: '#3b82f6' },
        progress: 0,
      });
      setIsAddTaskOpen(false);
      toast.success('Task created successfully!');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTask = async (taskData: any) => {
    if (!editingTask) return;
    try {
      await updateTaskMutation.mutateAsync({
        id: editingTask.id,
        updates: {
          ...taskData,
          assignee: {
            id: taskData.assigneeId,
            name: 'User',
            email: 'user@example.com',
          },
          project: {
            id: taskData.projectId,
            name: 'Project',
            color: '#3b82f6',
          },
        },
      });
      setEditingTask(null);
      toast.success('Task updated successfully!');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    try {
      await deleteTaskMutation.mutateAsync(deletingTask.id);
      setDeletingTask(null);
      toast.success('Task deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleReorderTasks = async (newTasks: Task[]) => {
    try {
      const taskIds = newTasks.map((task) => task.id);
      await reorderTasksMutation.mutateAsync(taskIds);
      toast.success('Tasks reordered successfully!');
    } catch (error) {
      toast.error('Failed to reorder tasks');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleViewTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleDeleteTaskClick = (task: Task) => {
    setDeletingTask(task);
  };

  const columns = createTaskColumns(handleEditTask, handleDeleteTaskClick, handleViewTask);

  return (
    <div className="space-y-6">
      {/* Header */}

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                <p className="text-muted-foreground">Manage and track your tasks efficiently</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsAddTaskOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Task Statistics */}
          {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats?.inProgress || 0}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats?.overdue || 0}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </div>
          </div> */}

          {/* Data Table */}
          {tasksLoading ? (
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
              <p className="text-lg font-medium mb-2">Loading Tasks...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={tasks}
              searchKey="title"
              searchPlaceholder="Search tasks..."
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TaskDialog
        open={isAddTaskOpen || !!editingTask}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddTaskOpen(false);
            setEditingTask(null);
          }
        }}
        task={editingTask}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
      />

      <TaskDeleteConfirmDialog
        open={!!deletingTask}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        taskTitle={deletingTask?.title}
        onConfirm={handleDeleteTask}
        isLoading={deleteTaskMutation.isPending}
      />
    </div>
  );
};

export default TasksPage;
