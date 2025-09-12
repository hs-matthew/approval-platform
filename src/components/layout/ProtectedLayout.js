// src/components/layout/ProtectedLayout.js
import React from "react";
import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";
import Footer from "./Footer";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedLayout() {
  const { currentUser } = useAuth();
  return (
    <>
      <Navigation currentUser={currentUser} />
      <Outlet />
      <Footer />   {/* ✅ footer is back on all protected routes */}
    </>
  );
}
