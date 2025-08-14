export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  project: {
    id: string;
    name: string;
    color: string;
  };
  tags: string[];
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  estimatedHours?: number;
  actualHours?: number;
  progress: number; // 0-100
  order: number;
}

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design new landing page',
    description: 'Create a modern and responsive landing page for the new product launch. Include hero section, features, testimonials, and CTA.',
    status: 'in-progress',
    priority: 'high',
    assignee: {
      id: 'user1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face'
    },
    project: {
      id: 'proj1',
      name: 'Website Redesign',
      color: '#3b82f6'
    },
    tags: ['design', 'frontend', 'ui/ux'],
    dueDate: '2024-01-15',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-10',
    estimatedHours: 16,
    actualHours: 12,
    progress: 75,
    order: 1
  },
  {
    id: '2',
    title: 'Implement user authentication',
    description: 'Set up secure user authentication system with JWT tokens, password hashing, and session management.',
    status: 'todo',
    priority: 'urgent',
    assignee: {
      id: 'user2',
      name: 'Mike Chen',
      email: 'mike.chen@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face'
    },
    project: {
      id: 'proj2',
      name: 'Backend API',
      color: '#10b981'
    },
    tags: ['backend', 'security', 'authentication'],
    dueDate: '2024-01-12',
    createdAt: '2024-01-02',
    updatedAt: '2024-01-08',
    estimatedHours: 24,
    progress: 0,
    order: 2
  },
  {
    id: '3',
    title: 'Write API documentation',
    description: 'Create comprehensive API documentation using OpenAPI/Swagger. Include examples, error codes, and authentication details.',
    status: 'completed',
    priority: 'medium',
    assignee: {
      id: 'user3',
      name: 'Emily Davis',
      email: 'emily.davis@example.com',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face'
    },
    project: {
      id: 'proj2',
      name: 'Backend API',
      color: '#10b981'
    },
    tags: ['documentation', 'api', 'technical-writing'],
    dueDate: '2024-01-08',
    createdAt: '2023-12-28',
    updatedAt: '2024-01-07',
    estimatedHours: 8,
    actualHours: 10,
    progress: 100,
    order: 3
  },
  {
    id: '4',
    title: 'Set up CI/CD pipeline',
    description: 'Configure automated testing, building, and deployment pipeline using GitHub Actions.',
    status: 'in-progress',
    priority: 'medium',
    assignee: {
      id: 'user4',
      name: 'David Wilson',
      email: 'david.wilson@example.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
    },
    project: {
      id: 'proj3',
      name: 'DevOps',
      color: '#f59e0b'
    },
    tags: ['devops', 'ci/cd', 'automation'],
    dueDate: '2024-01-20',
    createdAt: '2024-01-03',
    updatedAt: '2024-01-09',
    estimatedHours: 12,
    actualHours: 8,
    progress: 60,
    order: 4
  },
  {
    id: '5',
    title: 'Mobile app testing',
    description: 'Conduct thorough testing of the mobile application across different devices and operating systems.',
    status: 'todo',
    priority: 'high',
    assignee: {
      id: 'user5',
      name: 'Lisa Anderson',
      email: 'lisa.anderson@example.com',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=32&h=32&fit=crop&crop=face'
    },
    project: {
      id: 'proj4',
      name: 'Mobile App',
      color: '#8b5cf6'
    },
    tags: ['testing', 'mobile', 'qa'],
    dueDate: '2024-01-25',
    createdAt: '2024-01-04',
    updatedAt: '2024-01-04',
    estimatedHours: 20,
    progress: 0,
    order: 5
  },
  {
    id: '6',
    title: 'Database optimization',
    description: 'Optimize database queries and implement indexing to improve application performance.',
    status: 'completed',
    priority: 'low',
    assignee: {
      id: 'user2',
      name: 'Mike Chen',
      email: 'mike.chen@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face'
    },
    project: {
      id: 'proj2',
      name: 'Backend API',
      color: '#10b981'
    },
    tags: ['database', 'performance', 'optimization'],
    dueDate: '2024-01-05',
    createdAt: '2023-12-20',
    updatedAt: '2024-01-04',
    estimatedHours: 6,
    actualHours: 8,
    progress: 100,
    order: 6
  },
  {
    id: '7',
    title: 'User feedback analysis',
    description: 'Analyze user feedback from beta testing and create actionable insights for product improvement.',
    status: 'in-progress',
    priority: 'medium',
    assignee: {
      id: 'user6',
      name: 'Alex Thompson',
      email: 'alex.thompson@example.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face'
    },
    project: {
      id: 'proj5',
      name: 'Product Research',
      color: '#ef4444'
    },
    tags: ['research', 'user-feedback', 'analysis'],
    dueDate: '2024-01-18',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-11',
    estimatedHours: 10,
    actualHours: 6,
    progress: 40,
    order: 7
  },
  {
    id: '8',
    title: 'Security audit',
    description: 'Perform comprehensive security audit of the application including penetration testing and vulnerability assessment.',
    status: 'todo',
    priority: 'urgent',
    assignee: {
      id: 'user7',
      name: 'Rachel Green',
      email: 'rachel.green@example.com',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=32&h=32&fit=crop&crop=face'
    },
    project: {
      id: 'proj6',
      name: 'Security',
      color: '#dc2626'
    },
    tags: ['security', 'audit', 'penetration-testing'],
    dueDate: '2024-01-14',
    createdAt: '2024-01-06',
    updatedAt: '2024-01-06',
    estimatedHours: 32,
    progress: 0,
    order: 8
  }
];

export const getTasksByStatus = (status: Task['status']) => {
  return mockTasks.filter(task => task.status === status);
};

export const getTasksByPriority = (priority: Task['priority']) => {
  return mockTasks.filter(task => task.priority === priority);
};

export const getTasksByProject = (projectId: string) => {
  return mockTasks.filter(task => task.project.id === projectId);
};

export const getTasksByAssignee = (assigneeId: string) => {
  return mockTasks.filter(task => task.assignee.id === assigneeId);
};

export const getOverdueTasks = () => {
  const today = new Date().toISOString().split('T')[0];
  return mockTasks.filter(task => 
    task.status !== 'completed' && 
    task.status !== 'cancelled' && 
    task.dueDate < today
  );
};

export const getTaskStats = () => {
  const total = mockTasks.length;
  const completed = getTasksByStatus('completed').length;
  const inProgress = getTasksByStatus('in-progress').length;
  const todo = getTasksByStatus('todo').length;
  const overdue = getOverdueTasks().length;
  
  return {
    total,
    completed,
    inProgress,
    todo,
    overdue,
    completionRate: Math.round((completed / total) * 100)
  };
};
