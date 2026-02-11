export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'sent' | 'scheduled';
  recipients: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
  sentAt?: string;
  emails: string[];
  content: string;
}

export interface DashboardStats {
  totalCampaigns: number;
  totalEmailsSent: number;
  averageOpenRate: number;
  averageClickRate: number;
  subscribers: number;
  recentGrowth: number;
}

// Empty initial state - real data comes from API
export const initialCampaigns: Campaign[] = [];
