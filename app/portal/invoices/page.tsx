"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api, isInvoiceOverdue } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Invoice } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CustomerPortalInvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const res = await api.getInvoices();
        const own = res.data.filter(
          (i) =>
            i.customerName.toLowerCase() === user?.name.toLowerCase() ||
            i.customerCompany.toLowerCase() === (user as any)?.companyName?.toLowerCase()
        );
        setInvoices(own.length > 0 ? own : res.data.slice(0, 2));
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    loadInvoices();
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Invoices & Receipts"
        description="Review billing statements, verify tax charges, pay online, and print official statements."
        badge="Customer Self-Service"
      />

      <div className="bg-white border border-[#dee2e6] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f1f3f5] text-[#495057] uppercase tracking-wider text-[11px] border-b border-[#dee2e6]">
              <tr>
                <th className="py-3 px-4 font-semibold">Invoice #</th>
                <th className="py-3 px-4 font-semibold">Contract Ref</th>
                <th className="py-3 px-4 font-semibold">Issue Date</th>
                <th className="py-3 px-4 font-semibold">Due Date</th>
                <th className="py-3 px-4 font-semibold">Total Amount</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">View / Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dee2e6] text-[#495057]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6c757d]">Loading invoice records...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6c757d]">No invoices found.</td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isOverdue = isInvoiceOverdue(inv);

                  return (
                    <tr key={inv.id} className="hover:bg-[#f8f9fa] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#212529]">
                        <Link href={`/portal/invoices/${inv.id}`} className="hover:underline text-[#343a40]">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#343a40]">
                        {inv.subscriptionNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#6c757d]">
                        {inv.issueDate}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#495057]">
                        {inv.dueDate}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#212529]">
                        ${inv.total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        {isOverdue ? (
                          <StatusBadge status="OVERDUE" />
                        ) : (
                          <StatusBadge status={inv.status} />
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/portal/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 text-[11px] text-[#343a40] hover:text-[#212529] bg-[#e9ecef] hover:bg-[#dee2e6] border border-[#ced4da] px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <span>Statement</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
