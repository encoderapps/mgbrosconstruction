export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold' | 'delayed';

export interface Project {
  _id: string;
  name: string;
  location: string;
  client: string;
  startDate: string;
  expectedCompletionDate: string;
  status: ProjectStatus;
  progressPercentage: number;
}

export interface TeamMember {
  _id: string;
  name: string;
  role: string;
}

export interface ProjectDocument {
  _id: string;
  name: string;
  uploadedAt: string;
}

export interface ProjectUpdate {
  _id: string;
  message: string;
  createdAt: string;
  authorName: string;
}

export interface ProjectDetails extends Project {
  team: TeamMember[];
  documents: ProjectDocument[];
  updates: ProjectUpdate[];
}
