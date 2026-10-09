import { Project, ProjectDetails } from '../types/project';
import { Task } from '../types/task';
import { AppNotification } from '../types/notification';

/**
 * Placeholder data for screens whose backing APIs (/api/projects, /api/tasks)
 * are not part of this foundation phase yet. Replace with projectService /
 * taskService calls once those endpoints ship.
 */
export const MOCK_PROJECTS: Project[] = [
  {
    _id: 'p1',
    name: 'Riverside Residential Tower',
    location: 'Pune, Maharashtra',
    client: 'Skyline Developers',
    startDate: '2026-01-15',
    expectedCompletionDate: '2027-06-30',
    status: 'in_progress',
    progressPercentage: 62,
  },
  {
    _id: 'p2',
    name: 'Greenfield Industrial Park',
    location: 'Nashik, Maharashtra',
    client: 'Vertex Infra Ltd',
    startDate: '2025-09-01',
    expectedCompletionDate: '2026-11-15',
    status: 'delayed',
    progressPercentage: 38,
  },
  {
    _id: 'p3',
    name: 'Lakeview Commercial Plaza',
    location: 'Mumbai, Maharashtra',
    client: 'Horizon Realty',
    startDate: '2026-03-01',
    expectedCompletionDate: '2026-12-20',
    status: 'planned',
    progressPercentage: 5,
  },
  {
    _id: 'p4',
    name: 'Sunrise School Campus',
    location: 'Nagpur, Maharashtra',
    client: 'Nagpur Municipal Corporation',
    startDate: '2024-05-10',
    expectedCompletionDate: '2025-08-01',
    status: 'completed',
    progressPercentage: 100,
  },
];

export const MOCK_PROJECT_DETAILS: Record<string, ProjectDetails> = Object.fromEntries(
  MOCK_PROJECTS.map((project) => [
    project._id,
    {
      ...project,
      team: [
        { _id: 't1', name: 'Rohan Mehta', role: 'Site Engineer' },
        { _id: 't2', name: 'Priya Sharma', role: 'Project Manager' },
      ],
      documents: [{ _id: 'd1', name: 'Site Plan.pdf', uploadedAt: '2026-02-01' }],
      updates: [
        {
          _id: 'u1',
          message: 'Foundation work completed on schedule.',
          createdAt: '2026-02-20',
          authorName: 'Rohan Mehta',
        },
      ],
    },
  ]),
);

export const MOCK_TASKS: Task[] = [
  {
    _id: 'tk1',
    name: 'Pour concrete for Block A foundation',
    projectName: 'Riverside Residential Tower',
    assignedTo: 'Rohan Mehta',
    dueDate: '2026-09-20',
    priority: 'high',
    status: 'in_progress',
  },
  {
    _id: 'tk2',
    name: 'Submit electrical layout for approval',
    projectName: 'Greenfield Industrial Park',
    assignedTo: 'Priya Sharma',
    dueDate: '2026-09-18',
    priority: 'medium',
    status: 'todo',
  },
  {
    _id: 'tk3',
    name: 'Order structural steel batch #4',
    projectName: 'Lakeview Commercial Plaza',
    assignedTo: 'Amit Verma',
    dueDate: '2026-09-25',
    priority: 'low',
    status: 'todo',
  },
];

/** Sample notifications for the Notifications screen until a notifications API exists. */
export const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', kind: 'bidAccepted', title: 'Bid Accepted', message: 'Your bid BID-2002 for Duct Work has been accepted', timeAgo: '2h ago', isRead: false },
  { id: 'n2', kind: 'poUpdated', title: 'PO Updated', message: 'Purchase Order PO-1003 has been modified', timeAgo: '3h ago', isRead: false },
  { id: 'n3', kind: 'invoiceReminder', title: 'Invoice Reminder', message: 'Invoice INV-3002 for 914 Greenwood is overdue', timeAgo: '5h ago', isRead: false },
  { id: 'n4', kind: 'documentExpiring', title: 'Document Expiring', message: 'Your Workers Comp insurance expires in 7 days', timeAgo: 'Yesterday', isRead: true },
  { id: 'n5', kind: 'paymentReceived', title: 'Payment Received', message: 'Payment of $4,200 received for INV-3001', timeAgo: 'Yesterday', isRead: true },
  { id: 'n6', kind: 'projectAssigned', title: 'New Project Assigned', message: 'You have been assigned to 567 Oak Ave project', timeAgo: '2d ago', isRead: true },
  { id: 'n7', kind: 'bidDueSoon', title: 'Bid Due Soon', message: 'Bid BID-2009 for Concrete is due in 3 days', timeAgo: '2d ago', isRead: true },
  { id: 'n8', kind: 'contactAdded', title: 'Contact Added', message: 'Sarah Johnson has been added as Accountant', timeAgo: '3d ago', isRead: true },
];
