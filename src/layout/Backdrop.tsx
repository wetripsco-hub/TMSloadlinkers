"use client";

import { useSidebar } from "@/context/SidebarContext";
import React from "react";

export const Backdrop: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-gray-950/60 backdrop-blur-xs lg:hidden"
      onClick={toggleMobileSidebar}
    />
  );
};

export default Backdrop;
