import React, { useState, useEffect } from 'react';
import { getUsageStats, getUsageHistory } from '../api/client';
import '../index.css';

interface UsageStats {
  period_days: number;
  total_cost: number;
  total_tokens: number;
  by_model: Array<{
    model: string;
    cost: number;
    tokens: number;
    requests: number;
  }>;
}

interface UsageLog {
  id: number;
  endpoint: string;
  model: string;
  tokens: number;
  cost: number;
  created_at: string;
}

const AdminUsagePage: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [history, setHistory] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, historyData] = await Promise.all([
        getUsageStats(period),
        getUsageHistory(50)
      ]);
      setStats(statsData);
      setHistory(historyData);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load usage data. Ensure you have admin permissions.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) return <div className="p-8 text-center text-text-secondary">Loading usage statistics...</div>;

  return (
    <div className="admin-usage-page p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-text-primary">💰 Model Usage & Costs</h1>
        <div className="flex gap-2">
           <select 
             value={period} 
             onChange={(e) => setPeriod(Number(e.target.value))}
             className="px-3 py-2 bg-surface border border-border rounded-md text-text-primary"
           >
             <option value={1}>Last 24 Hours</option>
             <option value={7}>Last 7 Days</option>
             <option value={30}>Last 30 Days</option>
             <option value={90}>Last 3 Months</option>
           </select>
           <button onClick={fetchData} className="btn btn-secondary">Refresh</button>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-md mb-6">{error}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-border p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">Total Cost</h3>
          <div className="text-3xl font-bold text-accent-primary">${stats?.total_cost.toFixed(4)}</div>
          <p className="text-xs text-text-secondary mt-1">Last {period} days</p>
        </div>
        
        <div className="bg-surface border border-border p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">Total Tokens</h3>
          <div className="text-3xl font-bold text-text-primary">{(stats?.total_tokens || 0).toLocaleString()}</div>
          <p className="text-xs text-text-secondary mt-1">Input + Output</p>
        </div>

        <div className="bg-surface border border-border p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">Requests</h3>
          <div className="text-3xl font-bold text-text-primary">
            {stats?.by_model.reduce((acc, curr) => acc + curr.requests, 0).toLocaleString()}
          </div>
          <p className="text-xs text-text-secondary mt-1">Total Model Calls</p>
        </div>
      </div>

      {/* Model Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Breakdown by Model</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-text-secondary border-b border-border">
                <tr>
                  <th className="pb-2">Model</th>
                  <th className="pb-2 text-right">Requests</th>
                  <th className="pb-2 text-right">Tokens</th>
                  <th className="pb-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {stats?.by_model.map((m) => (
                  <tr key={m.model} className="border-b border-border/50 last:border-0 hover:bg-background/50">
                    <td className="py-3 font-medium text-text-primary">{m.model}</td>
                    <td className="py-3 text-right text-text-secondary">{m.requests}</td>
                    <td className="py-3 text-right text-text-secondary">{m.tokens.toLocaleString()}</td>
                    <td className="py-3 text-right font-medium text-text-primary">${m.cost.toFixed(4)}</td>
                  </tr>
                ))}
                {stats?.by_model.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-text-secondary">No usage data for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Cost Distribution</h2>
          <div className="h-64 flex items-center justify-center text-text-secondary bg-background/30 rounded-md">
             {/* Charts could go here (e.g. Recharts), using simple bars for now */}
             <div className="w-full h-full p-4 flex items-end gap-4">
                {stats?.by_model.map(m => {
                   const maxCost = Math.max(...(stats?.by_model.map(i => i.cost) || [1]));
                   const heightPercent = (m.cost / maxCost) * 100;
                   return (
                     <div key={m.model} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full bg-accent-primary/20 hover:bg-accent-primary/40 rounded-t transition-all relative group-hover:shadow-lg" style={{ height: `${heightPercent}%` }}>
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface text-xs p-1 rounded border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              ${m.cost.toFixed(4)}
                           </div>
                        </div>
                        <div className="text-xs text-text-secondary truncate w-full text-center" title={m.model}>{m.model.split('/').pop()}</div>
                     </div>
                   )
                })}
             </div>
          </div>
        </div>
      </div>

      {/* Recent History Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
           <h2 className="text-lg font-semibold text-text-primary">Recent Logs (Last 50)</h2>
           <span className="text-xs text-text-secondary">Auto-updates on refresh</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-text-secondary">
              <tr>
                <th className="px-6 py-3 font-medium">Time (UTC)</th>
                <th className="px-6 py-3 font-medium">Endpoint/Task</th>
                <th className="px-6 py-3 font-medium">Model</th>
                <th className="px-6 py-3 font-medium text-right">Tokens</th>
                <th className="px-6 py-3 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((log) => (
                <tr key={log.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-3 text-text-secondary whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-6 py-3 text-text-primary font-medium">{log.endpoint}</td>
                  <td className="px-6 py-3 text-text-secondary text-xs font-mono">{log.model}</td>
                  <td className="px-6 py-3 text-text-secondary text-right font-mono">{log.tokens.toLocaleString()}</td>
                  <td className="px-6 py-3 text-text-primary text-right font-medium">${log.cost.toFixed(6)}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">No recent logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsagePage;
