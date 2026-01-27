import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { AssetStatus, Asset } from '../types';
import { Box, Wrench, Users, FilterX, Laptop, ArrowRight } from 'lucide-react';

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
  const { assets, employees, maintenanceLogs } = useApp();
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = React.useState<{ category: string, status: string } | null>(null);

  // Global Stats - Inventory focused
  const availableAssetsCount = assets.filter(a => a.status === AssetStatus.AVAILABLE).length;
  const inRepairCount = assets.filter(a => a.status === AssetStatus.IN_REPAIR).length;
  const assignedAssetsCount = assets.filter(a => a.status === AssetStatus.ASSIGNED).length;

  // Aggregate assets by category and status
  const categoryStatusData = Object.values(assets.reduce((acc: any, asset) => {
    if (!acc[asset.category]) {
      acc[asset.category] = {
        name: asset.category,
        Available: 0,
        Assigned: 0,
        'In Repair': 0
      };
    }
    const status = asset.status;
    if (status === AssetStatus.AVAILABLE) acc[asset.category].Available++;
    else if (status === AssetStatus.ASSIGNED) acc[asset.category].Assigned++;
    else if (status === AssetStatus.IN_REPAIR) acc[asset.category]['In Repair']++;

    return acc;
  }, {}));

  const handleExportInventory = () => {
    if (assets.length === 0) {
      alert("No assets to export.");
      return;
    }

    const headers = ["ID", "Tag", "Name", "Category", "Status", "Assigned To", "Location", "Purchase Date", "Cost"];
    const csvContent = [
      headers.join(","),
      ...assets.map(a => [
        a.id,
        `"${a.tag}"`,
        `"${a.name}"`,
        `"${a.category}"`,
        a.status,
        a.assignedTo || "",
        `"${a.location}"`,
        a.purchaseDate,
        a.cost
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportEmployeeAssignments = () => {
    const assignedAssets = assets.filter(a => a.status === AssetStatus.ASSIGNED && a.assignedTo);

    if (assignedAssets.length === 0) {
      alert("No active assignments to export.");
      return;
    }

    const headers = ["Employee Name", "Asset Category", "Asset Name", "Asset Tag", "Serial Number", "Location"];

    const csvContent = [
      headers.join(","),
      ...assignedAssets.map(a => {
        const employee = employees.find(e => e.id === a.assignedTo);
        return [
          `"${employee?.name || 'Unknown'}"`,
          `"${a.category}"`,
          `"${a.name}"`,
          `"${a.tag}"`,
          `"${a.serialNumber}"`,
          `"${a.location}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `employee_assignments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBarClick = (data: any, statusType: string) => {
    if (data && data.name) {
      if (selectedFilter?.category === data.name && selectedFilter?.status === statusType) {
        setSelectedFilter(null);
      } else {
        setSelectedFilter({ category: data.name, status: statusType });
      }
    }
  };

  const filteredAssetsList = selectedFilter
    ? assets.filter(a => a.category === selectedFilter.category && a.status === selectedFilter.status)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Dashboard</h1>
          <p className="text-slate-500">Real-time overview of your asset availability and health.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportInventory}
            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all border border-slate-200 shadow-sm active:scale-95 text-sm font-medium"
          >
            Export All Inventory
          </button>
          <button
            onClick={handleExportEmployeeAssignments}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 text-sm font-medium"
          >
            Export Employee Assignments
          </button>
        </div>
      </div>

      {/* Inventory KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Ready for Issue" value={availableAssetsCount} icon={Box} color="bg-emerald-500 shadow-emerald-200" />
        <StatCard title="Out for Repair" value={inRepairCount} icon={Wrench} color="bg-amber-500 shadow-amber-200" />
        <StatCard title="Currently Assigned" value={assignedAssetsCount} icon={Users} color="bg-blue-500 shadow-blue-200" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Inventory Distribution Stacked Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900">Inventory Status by Category</h3>
            <p className="text-sm text-slate-500">Monitoring stock availability to prevent last-minute shortfalls.</p>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryStatusData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }} barGap={0} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 13, fontWeight: 500, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 13, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '30px', fontSize: '13px', fontWeight: 500 }}
                />
                <Bar
                  dataKey="Available"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                  onClick={(data) => handleBarClick(data, AssetStatus.AVAILABLE)}
                  cursor="pointer"
                />
                <Bar
                  dataKey="Assigned"
                  fill="#3b82f6"
                  radius={[0, 0, 0, 0]}
                  stackId="a"
                  onClick={(data) => handleBarClick(data, AssetStatus.ASSIGNED)}
                  cursor="pointer"
                />
                <Bar
                  dataKey="In Repair"
                  fill="#f59e0b"
                  radius={[0, 0, 0, 0]}
                  stackId="a"
                  onClick={(data) => handleBarClick(data, AssetStatus.IN_REPAIR)}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      {/* Selected Assets Detail Table */}
      {selectedFilter && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedFilter.status} {selectedFilter.category}s
                </h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                  {filteredAssetsList.length} Found
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">Showing detailed list for selected category and status.</p>
            </div>
            <button
              onClick={() => setSelectedFilter(null)}
              className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <FilterX size={20} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Asset Name</th>
                  <th className="px-6 py-4">Tag</th>
                  <th className="px-6 py-4">Current Owner</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssetsList.map((asset: Asset) => {
                  const owner = employees.find(e => e.id === asset.assignedTo);
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <Laptop size={16} />
                          </div>
                          <span className="font-semibold text-slate-900">{asset.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-600">{asset.tag}</code>
                      </td>
                      <td className="px-6 py-4">
                        {owner ? (
                          <div className="flex items-center gap-2">
                            <img src={owner.avatar} alt="" className="w-6 h-6 rounded-full" />
                            <span className="text-slate-700">{owner.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{asset.location}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate('/assets')}
                          className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 group"
                        >
                          Details <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;