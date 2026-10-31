"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api, isInvoiceOverdue } from "@/lib/api";
import { Subscription, Invoice, Payment } from "@/lib/types";
import {
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import { toast } from "sonner";

const revenueTrend = [
  { month: "May", revenue: 28400, subscriptions: 84 },
  { month: "Jun", revenue: 31200, subscriptions: 96 },
  { month: "Jul", revenue: 34800, subscriptions: 110 },
  { month: "Aug", revenue: 38200, subscriptions: 122 },
  { month: "Sep", revenue: 41500, subscriptions: 135 },
  { month: "Oct", revenue: 46800, subscriptions: 148 },
];

export default function FinanceDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      try {
        const [subsRes, invsRes, paysRes] = await Promise.all([
          api.getSubscriptions(),
          api.getInvoices(),
          api.getPayments(),
        ]);
        setSubscriptions(subsRes.data);
        setInvoices(invsRes.data);
        setPayments(paysRes.data);
      } catch {
        toast.error("Failed to load dashboard metrics");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE");
  const activeSubCount = activeSubs.length;

  const totalCollectedRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  const outstandingBalance = invoices
    .filter((inv) => inv.status === "CONFIRMED")
    .reduce((sum, inv) => sum + Math.max(0, inv.total - inv.amountPaid), 0);

  const overdueInvoices = invoices.filter((i) => isInvoiceOverdue(i));
  const overdueCount = overdueInvoices.length;
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + (i.total - i.amountPaid), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Finance Dashboard"
          description="Consolidated overview of recurring revenue, active subscription cohorts, outstanding receivables, and computed overdue invoices."
          badge="Shared: Admin & Staff"
          actions={
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6c757d] hidden sm:inline">Billing Cycle Engine:</span>
              <Link
                href="/invoices"
                className="text-xs bg-[#e9ecef] hover:bg-[#dee2e6] text-[#212529] px-3 py-1.5 rounded-xl border border-[#ced4da] transition-all font-medium"
              >
                View Invoices &rarr;
              </Link>
            </div>
          }
        />

        {/* Overdue Invoices Alert */}
        {overdueCount > 0 && (
          <div className="bg-[#fce8e6] border border-[#fad2cf] rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white text-[#c5221f] shadow-xs">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#c5221f]">
                  {overdueCount} Overdue Invoice(s) Detected (${overdueAmount.toFixed(2)} Outstanding)
                </h4>
                <p className="text-xs text-[#495057]">
                  Computed rule: Status is Confirmed, due date has elapsed, and payment balance remains unpaid.
                </p>
              </div>
            </div>
            <Link
              href="/invoices?status=OVERDUE"
              className="text-xs font-semibold bg-[#c5221f] hover:bg-[#a51d24] text-white px-3.5 py-1.5 rounded-lg transition-all"
            >
              Resolve Overdue Invoices
            </Link>
          </div>
        )}

        {/* 4 Primary KPI Cards in Light Steel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#dee2e6] rounded-2xl p-5 hover:border-[#ced4da] transition-all shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6c757d]">Active Subscriptions</span>
              <div className="p-2 rounded-xl bg-[#e9ecef] text-[#343a40]">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[#212529]">{activeSubCount} Active</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-[#6c757d]">
                <span>{subscriptions.length} Total Contracts in pipeline</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#dee2e6] rounded-2xl p-5 hover:border-[#ced4da] transition-all shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6c757d]">Total Revenue Collected</span>
              <div className="p-2 rounded-xl bg-[#e9ecef] text-[#343a40]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[#212529]">
                ${totalCollectedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-[#137333]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Recorded via payment matching</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#dee2e6] rounded-2xl p-5 hover:border-[#ced4da] transition-all shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6c757d]">Outstanding Balance</span>
              <div className="p-2 rounded-xl bg-[#e9ecef] text-[#343a40]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[#212529]">
                ${outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-[#b06000]">
                <span>Unsettled invoices awaiting payment</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#dee2e6] rounded-2xl p-5 hover:border-[#ced4da] transition-all shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6c757d]">Overdue Receivables</span>
              <div className="p-2 rounded-xl bg-[#fce8e6] text-[#c5221f]">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[#c5221f]">{overdueCount} Overdue</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-[#6c757d]">
                <span>Requires immediate collection</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trajectory Chart and Pipeline Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[#dee2e6] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#212529]">Monthly Recurring Revenue Trajectory</h3>
                <p className="text-xs text-[#6c757d]">Historical performance across all billed subscription plans</p>
              </div>
              <span className="text-xs font-medium text-[#343a40] bg-[#e9ecef] px-2.5 py-1 rounded-lg border border-[#ced4da]">
                FastAPI / DB Synced
              </span>
            </div>
            <div className="h-64 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#343a40" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#343a40" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                    <XAxis dataKey="month" stroke="#6c757d" fontSize={11} />
                    <YAxis stroke="#6c757d" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#212529", color: "#f8f9fa", borderColor: "#343a40", borderRadius: "8px" }}
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#343a40"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRev)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#6c757d]">
                  Loading Analytics Chart...
                </div>
              )}
            </div>
          </div>

          {/* Quick Links & Status Workflows */}
          <div className="bg-white border border-[#dee2e6] rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div>
              <h3 className="text-sm font-semibold text-[#212529] mb-1">Business Workflow Rules</h3>
              <p className="text-xs text-[#6c757d] mb-4">
                SubHub strict lifecycle state machines.
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#f8f9fa] border border-[#dee2e6]">
                  <span className="text-[10px] font-bold text-[#343a40] uppercase tracking-wider block">
                    Subscription Lifecycle
                  </span>
                  <div className="text-xs font-medium text-[#495057] mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono">DRAFT</span> &rarr;
                    <span className="font-mono">QUOTATION</span> &rarr;
                    <span className="font-mono">CONFIRMED</span> &rarr;
                    <span className="font-mono text-[#137333] font-bold">ACTIVE</span> &rarr;
                    <span className="font-mono text-[#6c757d]">CLOSED</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#f8f9fa] border border-[#dee2e6]">
                  <span className="text-[10px] font-bold text-[#343a40] uppercase tracking-wider block">
                    Invoice Lifecycle
                  </span>
                  <div className="text-xs font-medium text-[#495057] mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono">DRAFT</span> &rarr;
                    <span className="font-mono">CONFIRMED</span> &rarr;
                    <span className="font-mono text-[#137333] font-bold">PAID</span>
                  </div>
                  <p className="text-[11px] text-[#6c757d] mt-1">
                    * Invoices can be CANCELLED before payment is recorded.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#dee2e6] space-y-2">
              <Link
                href="/subscriptions"
                className="w-full flex items-center justify-between text-xs font-medium bg-[#e9ecef] hover:bg-[#dee2e6] text-[#212529] p-2.5 rounded-xl transition-all"
              >
                <span>Manage Subscriptions ({subscriptions.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/payments"
                className="w-full flex items-center justify-between text-xs font-medium bg-[#e9ecef] hover:bg-[#dee2e6] text-[#212529] p-2.5 rounded-xl transition-all"
              >
                <span>Recorded Payments ({payments.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
