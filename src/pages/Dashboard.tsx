import React, { useMemo } from 'react';
import {
  Mail,
  Send,
  Eye,
  MousePointer,
  Users,
  Activity,
  Inbox,
} from 'lucide-react';
import { useCampaigns } from '../context/CampaignContext';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
}> = ({ title, value, icon: Icon, subtitle }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {subtitle && (
          <p className="text-sm mt-2 text-slate-400">{subtitle}</p>
        )}
      </div>
      <div className="p-3 bg-blue-50 rounded-lg">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { campaigns } = useCampaigns();
  
  const sentCampaigns = campaigns.filter((c) => c.status === 'sent');
  const totalSent = sentCampaigns.reduce((acc, c) => acc + c.recipients, 0);
  const avgOpenRate =
    sentCampaigns.length > 0
      ? sentCampaigns.reduce((acc, c) => acc + c.openRate, 0) / sentCampaigns.length
      : 0;
  const avgClickRate =
    sentCampaigns.length > 0
      ? sentCampaigns.reduce((acc, c) => acc + c.clickRate, 0) / sentCampaigns.length
      : 0;

  // Generate recent activity from campaigns
  const recentActivity = useMemo(() => {
    const sortedCampaigns = [...campaigns]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return sortedCampaigns.map((campaign, index) => ({
      id: index + 1,
      action: campaign.status === 'sent' ? 'Campaign sent' : 
              campaign.status === 'draft' ? 'Draft created' : 'Campaign scheduled',
      campaign: campaign.name,
      time: campaign.sentAt || campaign.createdAt,
    }));
  }, [campaigns]);

  // Generate chart data from campaigns
  const chartData = useMemo(() => {
    if (sentCampaigns.length === 0) {
      return { labels: [], emailsSent: [] };
    }

    const sortedSent = [...sentCampaigns]
      .sort((a, b) => new Date(a.sentAt || a.createdAt).getTime() - new Date(b.sentAt || b.createdAt).getTime())
      .slice(-5);

    return {
      labels: sortedSent.map(c => c.name.slice(0, 15) + (c.name.length > 15 ? '...' : '')),
      emailsSent: sortedSent.map(c => c.recipients),
    };
  }, [sentCampaigns]);

  const maxEmails = Math.max(...chartData.emailsSent, 1);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here's your email marketing overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Campaigns"
          value={campaigns.length}
          icon={Mail}
          subtitle={`${sentCampaigns.length} sent`}
        />
        <StatCard
          title="Emails Sent"
          value={totalSent.toLocaleString()}
          icon={Send}
          subtitle="Total recipients"
        />
        <StatCard
          title="Avg. Open Rate"
          value={`${avgOpenRate.toFixed(1)}%`}
          icon={Eye}
          subtitle={sentCampaigns.length > 0 ? `From ${sentCampaigns.length} campaigns` : 'No data yet'}
        />
        <StatCard
          title="Avg. Click Rate"
          value={`${avgClickRate.toFixed(1)}%`}
          icon={MousePointer}
          subtitle={sentCampaigns.length > 0 ? `From ${sentCampaigns.length} campaigns` : 'No data yet'}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Emails Sent Per Campaign
          </h2>
          {chartData.labels.length > 0 ? (
            <div className="h-64 flex items-end justify-between gap-4 px-4">
              {chartData.labels.map((label, index) => (
                <div key={label} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                    style={{
                      height: `${Math.max((chartData.emailsSent[index] / maxEmails) * 200, 10)}px`,
                    }}
                  />
                  <p className="text-xs text-slate-500 mt-2 text-center truncate w-full">{label}</p>
                  <p className="text-xs font-medium text-slate-700">
                    {chartData.emailsSent[index].toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No campaigns sent yet</p>
                <p className="text-sm text-slate-400">Send your first campaign to see stats here</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Recent Activity
          </h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <div>
                    <p className="text-sm text-slate-700">{activity.action}</p>
                    <p className="text-xs text-slate-500">{activity.campaign}</p>
                    <p className="text-xs text-slate-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No activity yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Campaign Status Overview */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Total Recipients</h2>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-800">
            {campaigns.reduce((acc, c) => acc + c.emails.length, 0).toLocaleString()}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Across all campaigns
          </p>
          <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
              style={{ width: campaigns.length > 0 ? '100%' : '0%' }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Campaign Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Sent</span>
              <span className="text-sm font-medium text-green-600">
                {campaigns.filter((c) => c.status === 'sent').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Scheduled</span>
              <span className="text-sm font-medium text-blue-600">
                {campaigns.filter((c) => c.status === 'scheduled').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Draft</span>
              <span className="text-sm font-medium text-slate-500">
                {campaigns.filter((c) => c.status === 'draft').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
