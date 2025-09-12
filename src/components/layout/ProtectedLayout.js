// src/components/layout/ProtectedLayout.js
import React from "react";
import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";
import Footer from "./Footer";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedLayout() {
  const { currentUser } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Nav */}
      <Navigation currentUser={currentUser} />

      {/* Main content with light gray background */}
      <main className="flex-grow bg-gray-100">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
