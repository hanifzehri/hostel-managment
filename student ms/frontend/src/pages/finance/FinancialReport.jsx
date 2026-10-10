import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useHostel } from '../../context/HostelContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import {
  TrendingUp,
  TrendingDown,
  Printer,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  Layers,
  Banknote,
} from 'lucide-react';

const FinancialReport = () => {
  const { settings } = useHostel();
  const { error } = useToast();

  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const monthsList = [
    'October 2026',
    'September 2026',
    'August 2026',
    'July 2026',
    'June 2026',
    'May 2026',
  ];

  const fetchFinancialReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/profit-loss?month=${selectedMonth}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      error('Failed to load monthly financial report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialReport();
  }, [selectedMonth]);

  const summary = data?.summary || {};
  const isLoss = summary.isLoss;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data) return;
    const items = [
      { Metric: 'Reporting Month', Value: selectedMonth },
      { Metric: 'Hostel Name', Value: settings.hostelName || 'Royal Hostel Khuzdar' },
      { Metric: 'Expected Student Fees', Value: `PKR ${summary.expectedStudentFees || 0}` },
      { Metric: 'Collected Student Revenue', Value: `PKR ${summary.collectedRevenue || 0}` },
      { Metric: 'Pending Student Fees', Value: `PKR ${summary.pendingFees || 0}` },
      { Metric: 'Staff Salary Expense', Value: `PKR ${summary.staffSalaryExpense || 0}` },
      { Metric: 'Total Hostel Expenses', Value: `PKR ${summary.totalExpenses || 0}` },
      { Metric: 'Financial Status', Value: isLoss ? 'Net Monthly Loss' : 'Net Monthly Profit' },
      { Metric: 'Net Amount', Value: `PKR ${summary.netProfit || 0}` },
      { Metric: 'Profit Margin', Value: `${summary.profitMargin || 0}%` },
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Metric,Value', ...items.map((row) => `"${row.Metric}","${row.Value}"`)].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_report_${selectedMonth.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Audited Executive Financial Statement</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Monthly Profit & Loss Statement
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dynamic monthly income, operational expense breakdown, and audited net profit/loss reconciliation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Month Selector */}
          <div className="flex items-center space-x-2 mr-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none shadow-sm"
            >
              {monthsList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={handleExportCSV} variant="secondary" size="sm" icon={FileSpreadsheet}>
            Export CSV
          </Button>
          <Button onClick={handlePrint} variant="primary" size="sm" icon={Printer}>
            Print Statement
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-16">
          <LoadingSpinner text="Computing complete financial reconciliation..." size="lg" />
        </div>
      ) : (
        <div id="printable-financial-statement" className="space-y-6">
          {/* Official Letterhead Header for Print */}
          <div className="hidden print:block border-b-2 border-slate-900 pb-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-indigo-950 font-black flex items-center justify-center text-sm shadow">
                RH
              </div>
              <h2 className="text-xl font-black uppercase text-slate-900">
                {settings.hostelName || 'Royal Hostel Khuzdar'}
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {settings.address || 'College Road, Khuzdar, Balochistan, Pakistan'}
            </p>
            <p className="text-sm font-bold uppercase tracking-wider mt-2">
              Monthly Financial & Profit/Loss Statement — {selectedMonth}
            </p>
          </div>

          {/* Core Result Banner: Profit vs Loss */}
          <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900 shadow-xl relative overflow-hidden text-white">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                      isLoss
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    }`}
                  >
                    {isLoss ? 'Operational Net Loss' : 'Operational Net Profit'}
                  </span>
                  <span className="text-xs font-medium text-slate-400">for {selectedMonth}</span>
                </div>

                <div className="flex items-baseline space-x-3">
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                    PKR {(summary.netProfit || 0).toLocaleString()}
                  </h2>
                  <span
                    className={`text-sm font-bold ${
                      isLoss ? 'text-slate-400' : 'text-teal-400'
                    }`}
                  >
                    ({isLoss ? '-' : '+'}
                    {summary.profitMargin || 0}% margin)
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2 max-w-xl">
                  {isLoss
                    ? 'Total monthly hostel operating expenses exceeded collected resident student fees during this cycle.'
                    : 'Hostel revenue exceeded all operational expenditures resulting in net positive cash flow.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 shrink-0">
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Total Revenue
                  </span>
                  <span className="text-base font-extrabold text-teal-400">
                    PKR {(summary.collectedRevenue || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Total Expenses
                  </span>
                  <span className="text-base font-extrabold text-slate-300">
                    PKR {(summary.totalExpenses || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Breakdown: Income vs Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. INCOME SECTION */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      1. Student Fees & Revenue
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Income = Total Amount Collected From Students
                    </p>
                  </div>
                </div>
                <Badge variant="teal">INCOME</Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Expected Total Student Fees (20 × PKR 10,000)
                  </span>
                  <strong className="text-slate-900 dark:text-white font-mono">
                    PKR {(summary.expectedStudentFees || 200000).toLocaleString()}
                  </strong>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/30">
                  <span className="font-bold text-teal-800 dark:text-teal-300">
                    Actual Collected Revenue (Bank & Cash)
                  </span>
                  <strong className="text-teal-700 dark:text-teal-400 font-mono text-sm">
                    PKR {(summary.collectedRevenue || 0).toLocaleString()}
                  </strong>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Pending Unpaid Resident Fees
                  </span>
                  <strong className="text-slate-900 dark:text-white font-mono">
                    PKR {(summary.pendingFees || 0).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-black">
                <span className="text-slate-900 dark:text-white uppercase">Net Total Revenue</span>
                <span className="text-teal-600 dark:text-teal-400 text-sm">
                  PKR {(summary.collectedRevenue || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* 2. EXPENSES SECTION */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      2. Operating Expenses
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Total Expenses = Staff Salaries + Food + Utilities + Maintenance + Other
                    </p>
                  </div>
                </div>
                <Badge variant="neutral">EXPENSES</Badge>
              </div>

              <div className="space-y-2 text-xs max-h-72 overflow-y-auto pr-1">
                {/* Staff Salaries */}
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Hostel Staff Salaries (10 Staff Members)
                  </span>
                  <strong className="text-slate-900 dark:text-white font-mono">
                    PKR {(summary.staffSalaryExpense || 342000).toLocaleString()}
                  </strong>
                </div>

                {/* Categories */}
                {Object.entries(summary.expenseCategoryMap || {}).map(([cat, amt]) => (
                  <div
                    key={cat}
                    className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30"
                  >
                    <span className="font-medium text-slate-600 dark:text-slate-400">
                      {cat} Expense
                    </span>
                    <strong className="text-slate-900 dark:text-white font-mono">
                      PKR {amt.toLocaleString()}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-black">
                <span className="text-slate-900 dark:text-white uppercase">Total Monthly Expenses</span>
                <span className="text-slate-900 dark:text-white text-sm">
                  PKR {(summary.totalExpenses || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Final Financial Reconciliation Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Audited Executive Statement Summary
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Financial Element</th>
                    <th className="py-3 px-4">Category Type</th>
                    <th className="py-3 px-4 text-right">Audited Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      Expected Student Fees Revenue
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="default">Receivable</Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      PKR {(summary.expectedStudentFees || 200000).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      Total Collected Student Revenue
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="success">Actual Revenue</Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      PKR {(summary.collectedRevenue || 0).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400">
                      Total Operational Expenses (Salaries + Mess + Utilities)
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="danger">Total Expenditure</Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                      PKR {(summary.totalExpenses || 0).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 font-black">
                    <td className="py-4 px-4 text-sm text-slate-900 dark:text-white uppercase">
                      Final Net Operating {isLoss ? 'Loss' : 'Profit'}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={isLoss ? 'danger' : 'success'}>
                        {isLoss ? 'DEFICIT / LOSS' : 'SURPLUS / PROFIT'}
                      </Badge>
                    </td>
                    <td
                      className={`py-4 px-4 text-right font-mono text-base font-black ${
                        isLoss ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isLoss ? '-' : '+'}PKR {(summary.netProfit || 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialReport;
