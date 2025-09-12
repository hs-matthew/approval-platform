// src/components/layout/Footer.js
import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-900 py-5">
      <div className="text-center text-sm text-gray-300">
        © {year}{" "}
        <a
          href="https://headspace.media"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          Headspace Media, LLC.
        </a>{" "}
        All rights reserved.
      </div>
    </footer>
  );
}
