import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import { Box, Plus, Clock, Laptop, AlertCircle, Calendar } from 'lucide-react';
import { AssetRequest } from '../types';

const EmployeePortal = () => {
  const { currentUser, assets, assignments, requests, createRequest } = useApp();
  const [isRequestModalOpen, setRequestModalOpen] = useState(false);

  // Get My Assets
  const myAssignmentIds = assignments
    .filter(a => a.employeeId === currentUser?.id && a.isActive)
    .map(a => a.assetId);

  const myAssets = assets.filter(a => myAssignmentIds.includes(a.id));

  // Get My Requests
  const myRequests = requests.filter(r => r.employeeId === currentUser?.id);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const newRequest: AssetRequest = {
      id: `R-${Date.now()}`,
      employeeId: currentUser?.id || '',
      category: formData.get('category') as string,
      reason: formData.get('reason') as string,
      status: 'Pending',
      requestDate: new Date().toISOString().split('T')[0]
    };

    createRequest(newRequest);
    setRequestModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Hello, {currentUser?.name}</h1>
          <p className="text-slate-300">Welcome to your employee portal. Manage your assets and requests here.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Assets Column */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Laptop className="mr-2 text-brand-primary" /> My Assigned Assets
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAssets.map(asset => {
              const assignment = assignments.find(a => a.assetId === asset.id && a.isActive);
              return (
                <div key={asset.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <Box size={24} className="text-slate-600" />
                    </div>
                    <StatusBadge status={asset.status} />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">{asset.name}</h3>
                  <p className="text-slate-500 text-sm mb-4">{asset.serialNumber}</p>

                  <div className="pt-4 border-t border-slate-100 text-sm text-slate-600">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={14} />
                      <span>Assigned: {assignment?.borrowDate}</span>
                    </div>
                    {assignment?.expectedReturnDate && (
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertCircle size={14} />
                        <span>Return by: {assignment.expectedReturnDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {myAssets.length === 0 && (
              <div className="col-span-full bg-slate-50 rounded-xl p-8 text-center text-slate-400 border border-dashed border-slate-200">
                <Box size={40} className="mx-auto mb-2 text-slate-300" />
                <p>You don't have any assets assigned yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* My Requests Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center">
              <Clock className="mr-2 text-amber-500" /> My Requests
            </h2>
            <button
              onClick={() => setRequestModalOpen(true)}
              className="text-sm bg-brand-primary text-white px-3 py-1.5 rounded-lg hover:bg-brand-dark transition-colors flex items-center shadow-sm"
            >
              <Plus size={14} className="mr-1" /> New
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {myRequests.map(req => (
                <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-slate-900">{req.category}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-sm text-slate-500 mb-2 line-clamp-2">{req.reason}</p>
                  <span className="text-xs text-slate-400 block">{req.requestDate}</span>
                </div>
              ))}
              {myRequests.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-sm">No requests history.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Request New Asset</h3>
              <button onClick={() => setRequestModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asset Category</label>
                <select name="category" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none">
                  <option>Laptop</option>
                  <option>Monitor</option>
                  <option>Keyboard</option>
                  <option>Mouse</option>
                  <option>Headphones</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Request</label>
                <textarea required name="reason" rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none" placeholder="e.g. My current monitor is flickering..."></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setRequestModalOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-brand-primary rounded-lg hover:bg-brand-dark">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePortal;
