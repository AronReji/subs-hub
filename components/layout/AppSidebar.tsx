"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  TrendingUp,
  UserCheck,
  Package,
  CalendarDays,
  Percent,
  Tag,
  FileCheck2,
  Users,
  Layers,
  FileText,
  CreditCard,
  FileEdit,
  Shield,
} from "lucide-react";

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const { role } = useAuth();

  // C. ADMIN NAVIGATION
  const adminNav = [
    { label: "Finance Dashboard", href: "/dashboard", icon: TrendingUp },
    { label: "Staff Management", href: "/admin/staff", icon: UserCheck },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Plans", href: "/admin/plans", icon: CalendarDays },
    { label: "Taxes", href: "/admin/taxes", icon: Percent },
    { label: "Discounts", href: "/admin/discounts", icon: Tag },
    { label: "Quotation Templates", href: "/admin/templates", icon: FileCheck2 },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Subscriptions", href: "/subscriptions", icon: Layers },
    { label: "Invoices", href: "/invoices", icon: FileText },
    { label: "Payments", href: "/payments", icon: CreditCard },
  ];

  // D. STAFF NAVIGATION
  const staffNav = [
    { label: "Finance Dashboard", href: "/dashboard", icon: TrendingUp },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Quotations", href: "/subscriptions?status=QUOTATION", icon: FileEdit },
    { label: "Subscriptions", href: "/subscriptions", icon: Layers },
    { label: "Invoices", href: "/invoices", icon: FileText },
    { label: "Payments", href: "/payments", icon: CreditCard },
  ];

  const navItems = role === "ADMIN" ? adminNav : staffNav;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#212529]/40 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-[#dee2e6] p-4 flex flex-col justify-between transition-transform duration-200 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-4">
          <div className="px-2 py-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6c757d] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#343a40]" />
              {role === "ADMIN" ? "Admin Navigation" : "Staff Navigation"}
            </span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : item.href.includes("?")
                  ? pathname === "/subscriptions"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#343a40] text-[#f8f9fa] font-semibold shadow-xs"
                      : "text-[#495057] hover:text-[#212529] hover:bg-[#e9ecef]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom System Status */}
        <div className="p-3 rounded-xl bg-[#f8f9fa] border border-[#dee2e6] text-[11px] text-[#6c757d] space-y-1">
          <div className="font-semibold text-[#212529]">Brightloop Platform</div>
          <div>API Version: <span className="text-[#343a40] font-mono font-bold">v1</span></div>
          <div className="text-[10px] text-[#adb5bd]">Light Steel Theme • RBAC Enabled</div>
        </div>
      </aside>
    </>
  );
}
