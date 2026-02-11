import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  MoreVertical,
  Send,
  Trash2,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useCampaigns } from '../context/CampaignContext';
import type { Campaign } from '../services/api';

const StatusBadge: React.FC<{ status: Campaign['status'] }> = ({ status }) => {
  const styles = {
    sent: 'bg-green-100 text-green-700',
    scheduled: 'bg-blue-100 text-blue-700',
    draft: 'bg-slate-100 text-slate-600',
  };

  const icons = {
    sent: CheckCircle,
    scheduled: Clock,
    draft: FileText,
  };

  const Icon = icons[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}
    >
      <Icon className="w-4 h-4" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const ITEMS_PER_PAGE = 25;

const AllCampaigns: React.FC = () => {
  const navigate = useNavigate();
  const { campaigns, deleteCampaign, sendCampaign, loading } = useCampaigns();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || campaign.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when filter changes
  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSend = async (id: string) => {
    setSendingId(id);
    setActiveMenu(null);
    setNotification(null);

    const result = await sendCampaign(id);
    
    setSendingId(null);
    setNotification({
      type: result.success ? 'success' : 'error',
      message: result.message,
    });

    // Clear notification after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      const result = await deleteCampaign(id);
      setNotification({ 
        type: result.success ? 'success' : 'error', 
        message: result.message 
      });
      setTimeout(() => setNotification(null), 3000);
    }
    setActiveMenu(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Campaigns</h1>
          <p className="text-slate-500">
            Manage and monitor all your email campaigns.
          </p>
        </div>
        <button
          onClick={() => navigate('/campaign/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Campaign
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Campaign
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Status
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Recipients
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Open Rate
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Click Rate
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Date
              </th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedCampaigns.map((campaign) => (
              <tr
                key={campaign.id}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-800">{campaign.name}</p>
                    <p className="text-sm text-slate-500 truncate max-w-xs">
                      {campaign.subject}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={campaign.status} />
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {campaign.recipients > 0
                    ? campaign.recipients.toLocaleString()
                    : campaign.emails.length || '-'}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {campaign.openRate > 0 ? `${campaign.openRate.toFixed(1)}%` : '-'}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {campaign.clickRate > 0 ? `${campaign.clickRate.toFixed(1)}%` : '-'}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {campaign.sentAt || campaign.createdAt}
                </td>
                <td className="px-6 py-4 text-right relative">
                  <button
                    onClick={() =>
                      setActiveMenu(activeMenu === campaign.id ? null : campaign.id)
                    }
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-slate-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenu === campaign.id && (
                    <div className="absolute right-6 top-12 bg-white rounded-lg shadow-lg border border-slate-100 py-2 z-10 min-w-[160px]">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleSend(campaign.id)}
                          disabled={sendingId === campaign.id}
                          className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 disabled:opacity-50"
                        >
                          {sendingId === campaign.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send Now
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedCampaigns.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No campaigns found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-sm rounded-lg ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Sent</p>
          <p className="text-2xl font-bold text-green-700">
            {campaigns.filter((c) => c.status === 'sent').length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Scheduled</p>
          <p className="text-2xl font-bold text-blue-700">
            {campaigns.filter((c) => c.status === 'scheduled').length}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-slate-600 font-medium">Drafts</p>
          <p className="text-2xl font-bold text-slate-700">
            {campaigns.filter((c) => c.status === 'draft').length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AllCampaigns;
