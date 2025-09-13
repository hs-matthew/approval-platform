// src/pages/Reports/MonthlySEOReport.js
import React, { useRef, useState } from "react";
import {
  Upload,
  ExternalLink,
  TrendingUp,
  CheckCircle,
  Calendar,
  BarChart3,
  Link as LinkIcon,
  FileText,
  MapPin,
  Globe,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { mockReportIndex } from "./ReportsList"; // named export

// --- Mock monthly report data (kept ABOVE the component) ---
const mockMonthlyData = {
  month: "November 2024",
  package: "40 Credits Package",
  totalCredits: 40,
  usedCredits: 37,
  remainingCredits: 3,
  tasks: [
    {
      id: 1,
      task: "Guest post on industry blog",
      credits: 8,
      type: "backlink",
      deliverableLink: "https://industryexpert.com/seo-trends-2024",
      deliverableType: "Backlink",
      dateCompleted: "2024-11-03",
      description: `High-authority guest post with dofollow link to homepage`,
    },
    {
      id: 2,
      task: "Monthly blog post creation",
      credits: 6,
      type: "content",
      deliverableLink: "https://client.com/blog/local-seo-guide",
      deliverableType: "Blog Post",
      dateCompleted: "2024-11-08",
      description: `2,500-word comprehensive guide on local SEO strategies`,
    },
    {
      id: 3,
      task: "Google Business Profile posts (4 posts)",
      credits: 4,
      type: "gbp",
      deliverableLink: "https://business.google.com/dashboard/l/12345",
      deliverableType: "GBP Posts",
      dateCompleted: "2024-11-15",
      description: `Weekly GBP posts: 2 updates, 1 offer, 1 event promotion`,
    },
    {
      id: 4,
      task: "Local directory submissions (5 directories)",
      credits: 5,
      type: "directory",
      deliverableLink: "https://docs.google.com/spreadsheets/d/directory-list",
      deliverableType: "Directory Listings",
      dateCompleted: "2024-11-12",
      description: `Submitted to: Yelp, BBB, Yellow Pages, Angie's List, HomeAdvisor`,
    },
    {
      id: 5,
      task: "Landing page optimization",
      credits: 7,
      type: "onpage",
      deliverableLink: "https://client.com/services/web-design",
      deliverableType: "Page Optimization",
      dateCompleted: "2024-11-20",
      description: `Optimized title tags, meta descriptions, headers, and internal linking`,
    },
    {
      id: 6,
      task: "Compe
