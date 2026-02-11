import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, X, Send, Save, Mail, Loader2, CheckCircle, AlertCircle, Upload, FileSpreadsheet } from 'lucide-react';
import { useCampaigns } from '../context/CampaignContext';
import { uploadEmailSheet } from '../services/api';

const CreateCampaign: React.FC = () => {
  const navigate = useNavigate();
  const { addCampaign, sendNewCampaign, loading } = useCampaigns();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    
    if (!validateEmail(email)) {
      setErrors((prev) => ({ ...prev, email: 'Invalid email format' }));
      return;
    }
    
    if (emails.includes(email)) {
      setErrors((prev) => ({ ...prev, email: 'Email already added' }));
      return;
    }
    
    setEmails((prev) => [...prev, email]);
    setEmailInput('');
    setErrors((prev) => ({ ...prev, email: '' }));
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails((prev) => prev.filter((email) => email !== emailToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setNotification(null);

    try {
      const response = await uploadEmailSheet(file);
      
      if (response.success && response.data) {
        // Add new emails, avoiding duplicates
        const newEmails = response.data.emails.filter(
          (email) => !emails.includes(email.toLowerCase())
        );
        setEmails((prev) => [...prev, ...newEmails]);
        setNotification({
          type: 'success',
          message: `${newEmails.length} new emails added from file (${response.data.total} total found, ${response.data.total - newEmails.length} duplicates skipped)`,
        });
      } else {
        setNotification({
          type: 'error',
          message: response.error || 'Failed to process file',
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to upload file',
      });
    } finally {
      setUploadingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearAllEmails = () => {
    setEmails([]);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = 'Campaign name is required';
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (!content.trim()) newErrors.content = 'Email content is required';
    if (emails.length === 0) newErrors.emails = 'Add at least one recipient';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!name.trim()) {
      setErrors({ name: 'Campaign name is required to save' });
      return;
    }
    
    const result = await addCampaign({
      name,
      subject,
      content,
      emails,
      status: 'draft',
    });
    
    if (result.success) {
      setNotification({ type: 'success', message: 'Campaign saved as draft!' });
      setTimeout(() => navigate('/campaigns'), 1500);
    } else {
      setNotification({ type: 'error', message: result.message });
    }
  };

  const handleSend = async () => {
    if (!validateForm()) return;
    
    setNotification(null);
    
    const result = await sendNewCampaign({
      name,
      subject,
      content,
      emails,
    });

    if (result.success) {
      setNotification({ type: 'success', message: result.message });
      setTimeout(() => navigate('/campaigns'), 2000);
    } else {
      setNotification({ type: 'error', message: result.message });
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Create New Campaign</h1>
        <p className="text-slate-500">Set up your email campaign and reach your audience.</p>
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        {/* Campaign Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Campaign Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., January Newsletter"
            disabled={loading}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.name ? 'border-red-500' : 'border-slate-200'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500`}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email Subject */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Check out our latest updates!"
            disabled={loading}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.subject ? 'border-red-500' : 'border-slate-200'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500`}
          />
          {errors.subject && (
            <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
          )}
        </div>

        {/* Email Content */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your email content here..."
            rows={8}
            disabled={loading}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.content ? 'border-red-500' : 'border-slate-200'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-slate-50 disabled:text-slate-500`}
          />
          {errors.content && (
            <p className="text-red-500 text-sm mt-1">{errors.content}</p>
          )}
        </div>

        {/* Recipients Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Recipients
          </label>
          
          {/* File Upload Area */}
          <div className="mb-4 p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={loading || uploadingFile}
              className="hidden"
              id="email-file-upload"
            />
            <label
              htmlFor="email-file-upload"
              className="flex flex-col items-center cursor-pointer"
            >
              {uploadingFile ? (
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
              ) : (
                <FileSpreadsheet className="w-10 h-10 text-slate-400 mb-2" />
              )}
              <span className="text-sm font-medium text-slate-700">
                {uploadingFile ? 'Processing file...' : 'Upload Email Sheet'}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                CSV, Excel (.xlsx, .xls) supported
              </span>
            </label>
          </div>

          {/* Manual Email Input */}
          <div className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter email address manually"
              disabled={loading}
              className={`flex-1 px-4 py-3 rounded-lg border ${
                errors.email ? 'border-red-500' : 'border-slate-200'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500`}
            />
            <button
              type="button"
              onClick={addEmail}
              disabled={loading}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-blue-400"
            >
              <PlusCircle className="w-5 h-5" />
              Add
            </button>
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
          {errors.emails && (
            <p className="text-red-500 text-sm mt-1">{errors.emails}</p>
          )}

          {/* Email Count and Clear Button */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-slate-500">
              {emails.length} recipient{emails.length !== 1 ? 's' : ''} added
            </p>
            {emails.length > 0 && (
              <button
                type="button"
                onClick={clearAllEmails}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Email Tags */}
          {emails.length > 0 && (
            <div className="mt-4 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {emails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-full text-sm"
                  >
                    <Mail className="w-3 h-3" />
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      disabled={loading}
                      className="ml-1 hover:text-red-500 disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading}
            className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <Save className="w-5 h-5" />
            Save as Draft
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-blue-400"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Campaign
              </>
            )}
          </button>
        </div>
      </div>

      {/* Help Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Upload an Excel or CSV file with email addresses. The system will automatically extract all valid emails from any column.
        </p>
      </div>
    </div>
  );
};

export default CreateCampaign;
