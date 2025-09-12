import React from "react";
import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedLayout() {
  const { currentUser } = useAuth();
  return (
    <>
      <Navigation currentUser={currentUser} />
      <Outlet />
    </>
  );
}
