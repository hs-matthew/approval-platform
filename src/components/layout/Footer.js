// src/components/layout/Footer.js
import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-gray-200 py-20">
      <div className="text-center text-sm text-gray-600">
        © {year}{" "}
        <a
          href="https://headspace.media"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Headspace Media, LLC.
        </a>{" "}
        All rights reserved.
      </div>
    </footer>
  );
}
