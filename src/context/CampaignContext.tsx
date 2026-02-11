import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  getCampaigns,
  createCampaign as createCampaignApi,
  updateCampaign as updateCampaignApi,
  deleteCampaignApi,
  sendCampaign as sendCampaignApiCall,
  type Campaign,
} from '../services/api';

interface CampaignContextType {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  fetchCampaigns: () => Promise<void>;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'openRate' | 'clickRate' | 'recipients'>) => Promise<{ success: boolean; message: string }>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<{ success: boolean; message: string }>;
  deleteCampaign: (id: string) => Promise<{ success: boolean; message: string }>;
  sendCampaign: (id: string) => Promise<{ success: boolean; message: string }>;
  sendNewCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'openRate' | 'clickRate' | 'recipients' | 'status'>) => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Fetch all campaigns from backend
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await getCampaigns();
      if (response.success && response.data) {
        setCampaigns(response.data);
      }
    } catch (err) {
      setError('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  // Load campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Create campaign via API
  const addCampaign = async (
    campaign: Omit<Campaign, 'id' | 'createdAt' | 'openRate' | 'clickRate' | 'recipients'>
  ): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    try {
      const response = await createCampaignApi(campaign);
      if (response.success && response.data) {
        setCampaigns((prev) => [...prev, response.data!]);
        return { success: true, message: 'Campaign created successfully!' };
      }
      return { success: false, message: response.error || 'Failed to create campaign' };
    } catch (err) {
      return { success: false, message: 'Failed to create campaign' };
    } finally {
      setLoading(false);
    }
  };

  // Update campaign via API
  const updateCampaign = async (
    id: string,
    updates: Partial<Campaign>
  ): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    try {
      const response = await updateCampaignApi(id, updates);
      if (response.success && response.data) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === id ? response.data! : c))
        );
        return { success: true, message: 'Campaign updated successfully!' };
      }
      return { success: false, message: response.error || 'Failed to update campaign' };
    } catch (err) {
      return { success: false, message: 'Failed to update campaign' };
    } finally {
      setLoading(false);
    }
  };

  // Delete campaign via API
  const deleteCampaign = async (id: string): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    try {
      const response = await deleteCampaignApi(id);
      if (response.success) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        return { success: true, message: 'Campaign deleted successfully!' };
      }
      return { success: false, message: response.error || 'Failed to delete campaign' };
    } catch (err) {
      return { success: false, message: 'Failed to delete campaign' };
    } finally {
      setLoading(false);
    }
  };

  // Send existing campaign via API
  const sendCampaign = async (id: string): Promise<{ success: boolean; message: string }> => {
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) {
      return { success: false, message: 'Campaign not found' };
    }

    if (campaign.emails.length === 0) {
      return { success: false, message: 'No recipients in campaign' };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await sendCampaignApiCall({
        emails: campaign.emails,
        subject: campaign.subject,
        content: campaign.content,
        campaignName: campaign.name,
        campaignId: campaign.id,
      });

      if (response.success) {
        // Update local state
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: 'sent' as const,
                  sentAt: new Date().toISOString().split('T')[0],
                  recipients: c.emails.length,
                }
              : c
          )
        );
        return { success: true, message: response.message || 'Campaign sent successfully!' };
      } else {
        setError(response.error || 'Failed to send campaign');
        return { success: false, message: response.error || 'Failed to send campaign' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send campaign';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Create and send new campaign directly
  const sendNewCampaign = async (
    campaign: Omit<Campaign, 'id' | 'createdAt' | 'openRate' | 'clickRate' | 'recipients' | 'status'>
  ): Promise<{ success: boolean; message: string }> => {
    if (campaign.emails.length === 0) {
      return { success: false, message: 'No recipients added' };
    }

    setLoading(true);
    setError(null);

    try {
      // First create the campaign
      const createResponse = await createCampaignApi({
        ...campaign,
        status: 'draft',
      });

      if (!createResponse.success || !createResponse.data) {
        return { success: false, message: 'Failed to create campaign' };
      }

      const newCampaign = createResponse.data;

      // Then send it
      const sendResponse = await sendCampaignApiCall({
        emails: campaign.emails,
        subject: campaign.subject,
        content: campaign.content,
        campaignName: campaign.name,
        campaignId: newCampaign.id,
      });

      if (sendResponse.success) {
        // Update local state with sent campaign
        const sentCampaign: Campaign = {
          ...newCampaign,
          status: 'sent',
          sentAt: new Date().toISOString().split('T')[0],
          recipients: campaign.emails.length,
        };
        setCampaigns((prev) => [...prev, sentCampaign]);
        return { success: true, message: sendResponse.message || 'Campaign sent successfully!' };
      } else {
        // Campaign created but failed to send - add as draft
        setCampaigns((prev) => [...prev, newCampaign]);
        setError(sendResponse.error || 'Failed to send campaign');
        return { success: false, message: sendResponse.error || 'Failed to send campaign (saved as draft)' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send campaign';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        loading,
        error,
        fetchCampaigns,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        sendCampaign,
        sendNewCampaign,
        clearError,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaigns = () => {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaigns must be used within a CampaignProvider');
  }
  return context;
};
