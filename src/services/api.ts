// Backend API - use env in production (Vercel), localhost in dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  emails: string[];
  status: 'draft' | 'sent' | 'scheduled';
  recipients: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
  sentAt?: string;
}

interface SendEmailPayload {
  to: string;
  subject: string;
  content: string;
  html?: string;
}

interface SendCampaignPayload {
  emails: string[];
  subject: string;
  content: string;
  html?: string;
  campaignName: string;
  campaignId?: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

interface CampaignStats {
  total: number;
  successful: number;
  failed: number;
}

// Check if backend server is running
export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
};

// ============ CAMPAIGN CRUD APIs ============

// GET all campaigns
export const getCampaigns = async (): Promise<ApiResponse<Campaign[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/campaigns`);
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch campaigns',
    };
  }
};

// GET single campaign
export const getCampaign = async (id: string): Promise<ApiResponse<Campaign>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/campaigns/${id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch campaign',
    };
  }
};

// POST create campaign
export const createCampaign = async (
  campaign: Omit<Campaign, 'id' | 'createdAt' | 'openRate' | 'clickRate' | 'recipients'>
): Promise<ApiResponse<Campaign>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(campaign),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create campaign',
    };
  }
};

// PUT update campaign
export const updateCampaign = async (
  id: string,
  updates: Partial<Campaign>
): Promise<ApiResponse<Campaign>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update campaign',
    };
  }
};

// DELETE campaign
export const deleteCampaignApi = async (id: string): Promise<ApiResponse<Campaign>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete campaign',
    };
  }
};

// ============ FILE UPLOAD API ============

// Upload email sheet (CSV/Excel)
export const uploadEmailSheet = async (
  file: File
): Promise<ApiResponse<{ emails: string[]; total: number }>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload-emails`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
};

// ============ EMAIL SENDING APIs ============

// Send a single email
export const sendEmail = async (payload: SendEmailPayload): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
};

// Send a campaign
export const sendCampaign = async (
  payload: SendCampaignPayload
): Promise<ApiResponse<{ stats: CampaignStats }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/send-campaign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send campaign',
    };
  }
};

export default {
  checkHealth,
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaignApi,
  uploadEmailSheet,
  sendEmail,
  sendCampaign,
};
