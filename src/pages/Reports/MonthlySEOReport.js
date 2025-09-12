// src/pages/Reports/MonthlySEOReport.js
import React, { useState, useRef } from 'react';
import {
  Upload, ExternalLink, TrendingUp, CheckCircle, Calendar,
  BarChart3, Link as LinkIcon, FileText, MapPin, Globe
} from 'lucide-react';

// Mock monthly report data
const mockMonthlyData = {
  month: 'November 2024',
  package: '40 Credits Package',
  totalCredits: 40,
  usedCredits: 37,
  remainingCredits: 3,
  tasks: [
    { id: 1, task: 'Guest post on industry blog', credits: 8, type: 'backlink',
      deliverableLink: 'https://industryexpert.com/seo-trends-2024',
      deliverableType: 'Backlink', dateCompleted: '2024-11-03',
      description: 'High-authority guest post with dofollow link to homepage' },
    { id: 2, task: 'Monthly blog post creation', credits: 6, type: 'content',
      deliverableLink: 'https://client.com/blog/local-seo-guide',
      deliverableType: 'Blog Post', dateCompleted: '2024-11-08',
      description: '2,500-word comprehensive guide on local SEO strategies' },
    { id: 3, task: 'Google Business Profile posts (4 posts)', credits: 4, type: 'gbp',
      deliverableLink: 'https://business.google.com/dashboard/l/12345',
      deliverableType: 'GBP Posts', dateCompleted: '2024-11-15',
      description: 'Weekly GBP posts: 2 updates, 1 offer, 1 event promotion' },
    { id: 4, task: 'Local directory submissions (5 directories)', credits: 5, type: 'directory',
      deliverableLink: 'https://docs.google.com/spreadsheets/d/directory-list',
      deliverableType: 'Directory Listings', dateCompleted: '2024-11-12',
      description: "Submitted to: Yelp, BBB, Yellow Pages, Angie's List, HomeAdvisor" },
    { id: 5, task: 'Landing page optimization', credits: 7, type: 'onpage',
      deliverableLink: 'https://client.com/services/web-design',
      deliverableType: 'Page Optimization', dateCompleted: '2024-11-20',
      description: 'Optimized title tags, meta descriptions, headers, and internal linking' },
    { id: 6, task: 'Competitor backlink analysis', credits: 4, type: 'research',
      deliverableLink: 'https://docs.google.com/spreadsheets/d/competitor-analysis',
      deliverableType: 'Research Report', dateCompleted: '2024-11-25',
      description: 'Analyzed top 5 competitors, identified 15 link opportunities' },
    { id: 7, task: 'Schema markup implementation', credits: 3, type: 'technical',
      deliverableLink: 'https://client.com/contact',
      deliverableType: 'Technical SEO', dateCompleted: '2024-11-28',
      description: 'Added LocalBusiness schema to contact page' },
  ],
};

const deliverableIcons = {
  'Backlink': <LinkIcon className="w-4 h-4" />,
  'Blog Post': <FileText className="w-4 h-4" />,
  'GBP Posts': <MapPin className="w-4 h-4" />,
  'Directory Listings': <Globe className="w-4 h-4" />,
  'Page Optimization': <TrendingUp className="w-4 h-4" />,
  'Research Report': <BarChart3 className="w-4 h-4" />,
  'Technical SEO': <CheckCircle className="w-4 h-4" />,
};

const deliverableColors = {
  backlink: 'bg-purple-50 border-purple-200 text-purple-800',
  content: 'bg-blue-50 border-blue-200 text-blue-800',
  gbp: 'bg-green-50 border-green-200 text-green-800',
  directory: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  onpage: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  research: 'bg-pink-50 border-pink-200 text-pink-800',
  technical: 'bg-teal-50 border-teal-200 text-teal-800',
};

export default function MonthlySEOReport() {
  const [reportData, setReportData] = useState(mockMonthlyData);
  const [showImport, setShowImport] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('40');
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      console.log('Monthly report CSV uploaded:', file.name);
      setShowImport(false);
      alert('Monthly report imported successfully!');
    }
  };

  const creditUtilization = (reportData.usedCredits / reportData.totalCredits) * 100;

  const tasksByType = reportData.tasks.reduce((acc, task) => {
    acc[task.type] ??= { count: 0, credits: 0 };
    acc[task.type].count++;
    acc[task.type].credits += task.credits;
    return acc;
  }, {});

  const packageOptions = {
    '20': { name: '20 Credits Package', price: '$800/month', description: 'Essential SEO' },
    '40': { name: '40 Credits Package', price: '$1,500/month', description: 'Professional SEO' },
    '80': { name: '80 Credits Package', price: '$2,800/month', description: 'Enterprise SEO' },
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monthly SEO Report</h1>
            <p className="text-gray-600">{reportData.month} • {reportData.package}</p>
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Monthly CSV
          </button>
        </div>

        {/* Credit Usage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Credit Utilization */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">Credit Utilization</span>
              <span className="text-2xl font-bold text-blue-600">{Math.round(creditUtilization)}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${creditUtilization}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-blue-700 mt-2">
              <span>{reportData.usedCredits} credits used</span>
              <span>{reportData.remainingCredits} credits remaining</span>
            </div>
          </div>

          {/* Total Tasks */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="text-sm font-medium text-green-800 mb-1">Tasks Completed</div>
            <div className="text-2xl font-bold text-green-600">{reportData.tasks.length}</div>
            <div className="text-xs text-green-700">This month</div>
          </div>

          {/* Credits Used */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="text-sm font-medium text-purple-800 mb-1">Credits Used</div>
            <div className="text-2xl font-bold text-purple-600">{reportData.usedCredits}</div>
            <div className="text-xs text-purple-700">of {reportData.totalCredits} total</div>
          </div>
        </div>
      </div>

      {/* Work Breakdown by Category */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Breakdown by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(tasksByType).map(([type, data]) => (
            <div key={type} className={`p-4 rounded-lg border ${deliverableColors[type]}`}>
              <div className="flex items-center gap-2 mb-2">
                {deliverableIcons[reportData.tasks.find(t => t.type === type)?.deliverableType] || <CheckCircle className="w-4 h-4" />}
                <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
              </div>
              <div className="text-lg font-bold">{data.count} tasks</div>
              <div className="text-sm opacity-75">{data.credits} credits used</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Task List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Completed Tasks & Deliverables</h2>
          <p className="text-sm text-gray-600">Click links to view completed work</p>
        </div>

        <div className="divide-y divide-gray-200">
          {reportData.tasks
            .sort((a, b) => new Date(b.dateCompleted) - new Date(a.dateCompleted))
            .map((task) => (
              <div key={task.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">{task.task}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${deliverableColors[task.type]}`}>
                        {deliverableIcons[task.deliverableType]}
                        {task.deliverableType}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>

                    <div className="flex items-center gap-4 text-
