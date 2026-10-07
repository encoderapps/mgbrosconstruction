/** A job the logged-in subcontractor is working on, as listed in the portal. */
export interface SubcontractorProject {
  id: string;
  /** Short title for lists: the job's street address, e.g. "930 Mountain View Avenue". */
  name: string;
  /** The full job address, e.g. "930 Mountain View Avenue, Phoenix, AZ, 85016"; empty when unknown. */
  address: string;
}

/** home = the latest 5 (Home screen card); all = every project ("View All"). */
export type SubcontractorProjectsView = 'home' | 'all';
