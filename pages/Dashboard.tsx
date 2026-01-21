import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { AssetStatus } from '../types';
import { Box, Wrench, Users, FilterX } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { assets, maintenanceLogs } = useApp();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Global Stats (Unaffected by filter)
  const totalAssets = assets.length;
  const globalAssigned = assets.filter(a => a.status === AssetStatus.ASSIGNED).length;
  const globalInRepair = assets.filter(a => a.status === AssetStatus.IN_REPAIR).length;

  // Filtered Data for Pie Chart
  const filteredAssets = selectedCategory
    ? assets.filter(a => a.category === selectedCategory)
    : assets;

  const assignedAssetsPie = filteredAssets.filter(a => a.status === AssetStatus.ASSIGNED).length;
  const availableAssetsPie = filteredAssets.filter(a => a.status === AssetStatus.AVAILABLE).length;
  const inRepairPie = filteredAssets.filter(a => a.status === AssetStatus.IN_REPAIR).length;

  // Pie Chart Data
  const statusData = [
    { name: 'Assigned', value: assignedAssetsPie, color: '#3b82f6' },
    { name: 'Available', value: availableAssetsPie, color: '#10b981' },
    { name: 'Repair', value: inRepairPie, color: '#f59e0b' },
    { name: 'Others', value: filteredAssets.length - assignedAssetsPie - availableAssetsPie - inRepairPie, color: '#64748b' },
  ].filter(item => item.value > 0); // Filter out zero values to avoid ugly pie slices

  // Aggregate assets by category (Always shows all categories)
  const categoryData = Object.values(assets.reduce((acc: any, asset) => {
    acc[asset.category] = acc[asset.category] || { name: asset.category, count: 0 };
    acc[asset.category].count++;
    return acc;
  }, {}));

  const handleBarClick = (data: any) => {
    if (data && data.name) {
      setSelectedCategory(prev => prev === data.name ? null : data.name);
    }
  };

  const handleGenerateReport = () => {
    if (assets.length === 0) {
      alert("No assets to export.");
      return;
    }

    // Define headers
    const headers = ["ID", "Tag", "Name", "Category", "Status", "Assigned To", "Location", "Purchase Date", "Cost"];

    // Map data
    const csvContent = [
      headers.join(","),
      ...assets.map(a => [
        a.id,
        `"${a.tag}"`, // Quote strings that might contain commas
        `"${a.name}"`,
        `"${a.category}"`,
        a.status,
        a.assignedTo || "",
        `"${a.location}"`,
        a.purchaseDate,
        a.cost
      ].join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `asset_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500">Welcome back, here's what's happening with your assets today.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={handleGenerateReport}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Assets" value={totalAssets} icon={Box} color="bg-blue-500" />
        <StatCard title="Assigned Assets" value={globalAssigned} icon={Users} color="bg-indigo-500" />
        <StatCard title="In Repair" value={globalInRepair} icon={Wrench} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Asset Status {selectedCategory ? <span className="text-blue-600">({selectedCategory})</span> : 'Distribution'}
            </h3>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-full transition-colors border border-slate-200"
              >
                <FilterX size={12} /> Clear Filter
              </button>
            )}
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Assets by Category</h3>
            <p className="text-xs text-slate-400 mt-1">Click a bar to filter the status chart</p>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} onClick={handleBarClick}>
                  {categoryData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={selectedCategory === entry.name ? '#2563eb' : (selectedCategory ? '#cbd5e1' : '#3b82f6')}
                      cursor="pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity / Maintenance */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Recent Maintenance Logs</h3>
          <button onClick={() => navigate('/maintenance')} className="text-blue-600 text-sm hover:underline cursor-pointer">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Vendor</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Cost</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {maintenanceLogs.map((log) => {
                const asset = assets.find(a => a.id === log.assetId);
                return (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{asset?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-slate-600">{log.description}</td>
                    <td className="px-6 py-4 text-slate-600">{log.vendor}</td>
                    <td className="px-6 py-4 text-slate-600">{log.date}</td>
                    <td className="px-6 py-4 text-slate-600">${log.cost}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${log.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {maintenanceLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No recent maintenance logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;