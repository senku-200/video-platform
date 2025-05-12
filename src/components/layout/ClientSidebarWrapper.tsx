"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function ClientSidebarWrapper() {
  const pathname = usePathname();
  const hideSidebar = pathname?.startsWith("/login") || pathname?.startsWith("/register");

  if (hideSidebar) return null;

  return <Sidebar isOpen={false} onClose={function (): void {
      throw new Error("Function not implemented.");
  } } onToggle={function (): void {
      throw new Error("Function not implemented.");
  } } />;
}