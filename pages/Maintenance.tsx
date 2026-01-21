import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MaintenanceLog } from '../types';
import { Wrench, Plus, CheckCircle, Clock, AlertTriangle, DollarSign } from 'lucide-react';

const Maintenance = () => {
  const { assets, maintenanceLogs, addMaintenanceLog, updateMaintenanceLog } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const newLog: MaintenanceLog = {
      id: `M-${Date.now()}`,
      assetId: formData.get('assetId') as string,
      description: formData.get('description') as string,
      vendor: formData.get('vendor') as string,
      cost: Number(formData.get('cost')),
      date: formData.get('date') as string,
      status: 'In Progress'
    };

    addMaintenanceLog(newLog);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Logs</h1>
          <p className="text-slate-500">Track repairs, upgrades, and service history.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Log Maintenance
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Issue / Description</th>
                <th className="px-6 py-3">Vendor</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Cost</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {maintenanceLogs.map((log) => {
                const asset = assets.find(a => a.id === log.assetId);
                return (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {asset?.name || 'Unknown Asset'}
                      <div className="text-xs text-slate-400 font-mono">{asset?.tag}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={log.description}>
                      {log.description}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{log.vendor}</td>
                    <td className="px-6 py-4 text-slate-600">{log.date}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">${log.cost}</td>
                    <td className="px-6 py-4">
                      {log.status === 'Completed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle size={12} /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Clock size={12} /> In Progress
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.status === 'In Progress' && (
                        <button 
                          onClick={() => updateMaintenanceLog(log.id, 'Completed')}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          Mark Complete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {maintenanceLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Wrench size={48} className="mx-auto mb-2 text-slate-300" />
                    No maintenance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Log Maintenance</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Asset</label>
                <select required name="assetId" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- Choose Asset --</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name} ({asset.tag}) - {asset.status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Issue Description</label>
                <textarea required name="description" rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Describe the issue..."></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
                  <input required name="vendor" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Repair Shop Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cost ($)</label>
                  <input required name="cost" type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input required name="date" type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;