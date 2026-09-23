import { Project, ProjectDetails } from '../types/project';
import { Task } from '../types/task';
import { SubcontractorCompanyProfile } from '../types/company';

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

/**
 * Placeholder data for the Home screen's company info card, shown right
 * after the temporary dummy login. Replace with the real company-profile
 * API response once it exists.
 */
export const MOCK_SUBCONTRACTOR_COMPANY: SubcontractorCompanyProfile = {
  name: 'High Tech Air Inc',
  addressLines: ['185 N Addison Rd', 'Wood Dale, IL 60191', 'US'],
  email: 'hightechairinc@gmail.com',
  phone: '(224) 612-6823',
};

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
