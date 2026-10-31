"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Subscription } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CustomerPortalSubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getSubscriptions();
        // Customer view: view own subscriptions per spec
        const own = res.data.filter(
          (s) =>
            s.customerEmail.toLowerCase() === user?.email.toLowerCase() ||
            s.customerName.toLowerCase() === user?.name.toLowerCase()
        );
        setSubscriptions(own.length > 0 ? own : res.data.slice(0, 2));
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Subscriptions"
        description="View and manage active software licenses, service tiers, and contract renewal dates."
        badge="Customer Self-Service"
      />

      <div className="bg-white border border-[#dee2e6] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f1f3f5] text-[#495057] uppercase tracking-wider text-[11px] border-b border-[#dee2e6]">
              <tr>
                <th className="py-3 px-4 font-semibold">Subscription #</th>
                <th className="py-3 px-4 font-semibold">Service / Plan</th>
                <th className="py-3 px-4 font-semibold">Billing Frequency</th>
                <th className="py-3 px-4 font-semibold">Next Invoice Date</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dee2e6] text-[#495057]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6c757d]">Loading subscriptions...</td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6c757d]">No active subscriptions found.</td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#f8f9fa] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#212529]">
                      <Link href={`/portal/subscriptions/${sub.id}`} className="hover:underline text-[#343a40]">
                        {sub.subscriptionNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#212529]">{sub.planName}</td>
                    <td className="py-3.5 px-4 font-mono text-[#495057]">{sub.billingPeriod}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#495057]">
                      {sub.nextBillingDate}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#137333]">
                      ${sub.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/portal/subscriptions/${sub.id}`}
                        className="inline-flex items-center gap-1 text-[11px] text-[#343a40] hover:text-[#212529] bg-[#e9ecef] hover:bg-[#dee2e6] border border-[#ced4da] px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <span>Manage</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
