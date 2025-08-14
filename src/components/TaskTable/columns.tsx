import { type ColumnDef } from "@tanstack/react-table";
import { type Task } from "@/data/mockTasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";

const getStatusColor = (status: Task["status"]) => {
  switch (status) {
    case "todo":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    case "in-progress":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "completed":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "cancelled":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

const getPriorityColor = (priority: Task["priority"]) => {
  switch (priority) {
    case "low":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "high":
      return "bg-orange-100 text-orange-800 hover:bg-orange-200";
    case "urgent":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

interface TaskActionsProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onView: (task: Task) => void;
}

const TaskActions = ({ task, onEdit, onDelete, onView }: TaskActionsProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => onView(task)}>
        <Eye className="mr-2 h-4 w-4" />
        View
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit(task)}>
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => onDelete(task)}
        className="text-red-600 focus:text-red-600"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const createTaskColumns = (
  onEdit: (task: Task) => void,
  onDelete: (task: Task) => void,
  onView: (task: Task) => void,
): ColumnDef<Task>[] => [
  {
    accessorKey: "title",
    header: "Task",
    cell: ({ row }) => {
      const task = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{task.title}</div>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </div>
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{task.tags.length - 2}
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Task["status"];
      return (
        <Badge className={getStatusColor(status)}>
          {status.replace("-", " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as Task["priority"];
      return <Badge className={getPriorityColor(priority)}>{priority}</Badge>;
    },
  },
  {
    accessorKey: "assignee",
    header: "Assignee",
    cell: ({ row }) => {
      const assignee = row.getValue("assignee") as Task["assignee"];
      return (
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={assignee.avatar} alt={assignee.name} />
            <AvatarFallback>
              {assignee.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{assignee.name}</div>
            <div className="text-xs text-muted-foreground">
              {assignee.email}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "project",
    header: "Project",
    cell: ({ row }) => {
      const project = row.getValue("project") as Task["project"];
      return (
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <span className="font-medium text-sm">{project.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "progress",
    header: "Progress",
    cell: ({ row }) => {
      const progress = row.getValue("progress") as number;
      return (
        <div className="space-y-1">
          <Progress value={progress} className="w-16" />
          <div className="text-xs text-muted-foreground">{progress}%</div>
        </div>
      );
    },
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => {
      const dueDate = row.getValue("dueDate") as string;
      const date = new Date(dueDate);
      const today = new Date();
      const isOverdue = date < today && row.original.status !== "completed";

      return (
        <div
          className={`text-sm ${isOverdue ? "text-red-600 font-medium" : ""}`}
        >
          {format(date, "MMM dd, yyyy")}
          {isOverdue && <div className="text-xs text-red-500">Overdue</div>}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const task = row.original;
      return (
        <TaskActions
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      );
    },
  },
];
