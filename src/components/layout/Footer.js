// components/layout/Footer.js
import React from 'react';

const Footer = () => (
  <footer className="bg-gray-800 text-white py-8 mt-12">
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Content Approval Platform</h3>
          <p className="text-gray-300 text-sm">
            Streamline your content approval workflow with our powerful platform.
          </p>
        </div>
        <div>
          <h4 className="text-md font-semibold mb-4">Features</h4>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>• Blog Post Management</li>
            <li>• GBP Service Listings</li>
            <li>• User Role Management</li>
            <li>• Real-time Collaboration</li>
          </ul>
        </div>
        <div>
          <h4 className="text-md font-semibold mb-4">Support</h4>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>• Documentation</li>
            <li>• Help Center</li>
            <li>• Contact Support</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-700 mt-8 pt-8 text-center">
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} Headspace Media, LLC. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
