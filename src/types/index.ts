export interface Team {
  name: string;
  points: number;
  active: boolean;
}

export interface Issue {
  id: string;
  title: string;
  tags: string[];
  status: "open" | "occupied" | "closed";
  assignedTo: string | null;
  repo: string;
  occupiedAt?: number;
  closedAt?: number;
  prUrl?: string;
  prStatus?: "pending" | "approved" | "merged" | "rejected";
}

export interface Repository {
  id?: string; // Firestore document ID
  name: string;
  url: string;
}
