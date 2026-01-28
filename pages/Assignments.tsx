import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, ArrowLeftRight, CheckCircle, Search, User } from 'lucide-react';
import { AssetStatus } from '../types';

const Assignments = () => {
  const { assets, employees, assignments, assignAsset, returnAsset } = useApp();
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  
  // Return Modal State
  const [isReturnModalOpen, setReturnModalOpen] = useState(false);
  const [returnAssetData, setReturnAssetData] = useState<{id: string, name: string, employee: string} | null>(null);
  const [returnNotes, setReturnNotes] = useState('');

  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [assetSearchTerm, setAssetSearchTerm] = useState('');

  const activeAssignments = assignments.filter(a => a.isActive);
  const availableAssets = assets.filter(a => a.status === AssetStatus.AVAILABLE);
  const filteredAvailableAssets = availableAssets.filter(a => 
    a.tag.toLowerCase().includes(assetSearchTerm.toLowerCase()) ||
    a.name.toLowerCase().includes(assetSearchTerm.toLowerCase())
  );

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAsset && selectedEmployee) {
      assignAsset(selectedAsset, selectedEmployee);
      setAssignModalOpen(false);
      setSelectedAsset('');
      setSelectedEmployee('');
      setAssetSearchTerm('');
    }
  };

  const handleReturnClick = (assetId: string, assetName: string, employeeName: string) => {
    setReturnAssetData({ id: assetId, name: assetName, employee: employeeName });
    setReturnNotes('');
    setReturnModalOpen(true);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (returnAssetData) {
      returnAsset(returnAssetData.id, returnNotes);
      setReturnModalOpen(false);
      setReturnAssetData(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
          <p className="text-slate-500">Track current asset allocations and returns.</p>
        </div>
        <button 
          onClick={() => setAssignModalOpen(true)}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors flex items-center shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          New Assignment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Assignments List */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Active Assignments</h3>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{activeAssignments.length} active</span>
            </div>
            <div className="divide-y divide-slate-100">
              {activeAssignments.map(assignment => {
                const asset = assets.find(a => a.id === assignment.assetId);
                const employee = employees.find(e => e.id === assignment.employeeId);
                
                if (!asset || !employee) return null;

                return (
                  <div key={assignment.id} className="p-4 hover:bg-slate-50 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{employee.name}</p>
                        <p className="text-sm text-slate-500">{asset.name} <span className="text-slate-300">|</span> <span className="font-mono text-xs">{asset.tag}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400">Borrowed</p>
                        <p className="text-sm text-slate-700">{assignment.borrowDate}</p>
                      </div>
                      <button 
                        onClick={() => handleReturnClick(asset.id, asset.name, employee.name)}
                        className="px-3 py-1.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors flex items-center"
                      >
                        <ArrowLeftRight size={14} className="mr-2" />
                        Return
                      </button>
                    </div>
                  </div>
                );
              })}
              {activeAssignments.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  <CheckCircle size={40} className="mx-auto mb-2 text-slate-300" />
                  <p>No active assignments.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats or Instructions */}
        <div className="space-y-6">
            <div className="bg-brand-primary rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <h3 className="text-lg font-bold mb-2">Assignment Policy</h3>
                <ul className="text-sm space-y-2 text-blue-100 list-disc list-inside">
                    <li>Assets must be approved by a manager before assignment.</li>
                    <li>Standard loan period is 2 years for laptops.</li>
                    <li>Employees are responsible for loss or damage.</li>
                </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Allocation by Dept</h3>
                <div className="space-y-3">
                    {/* Mock distribution */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Engineering</span>
                            <span className="font-medium">65%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-indigo-500 h-2 rounded-full" style={{width: '65%'}}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Design</span>
                            <span className="font-medium">20%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{width: '20%'}}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Sales</span>
                            <span className="font-medium">15%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-emerald-500 h-2 rounded-full" style={{width: '15%'}}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Assign Asset</h3>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Employee</label>
                <select 
                  required 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Asset</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search by tag or name..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                    value={assetSearchTerm}
                    onChange={(e) => setAssetSearchTerm(e.target.value)}
                  />
                  <select 
                    required 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                  >
                    <option value="">-- Choose Available Asset --</option>
                    {filteredAvailableAssets.map(a => <option key={a.id} value={a.id}>{a.name} - {a.tag}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setAssignModalOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-brand-primary rounded-lg hover:bg-brand-dark">Confirm Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Asset Modal */}
      {isReturnModalOpen && returnAssetData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Return Asset</h3>
              <p className="text-sm text-slate-500">Processing return for <strong>{returnAssetData.name}</strong></p>
            </div>
            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Current Holder:</span> {returnAssetData.employee}
                </p>
                <p className="text-xs text-amber-600 mt-1">This action will mark the asset as Available.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Return Reason / Notes</label>
                <textarea 
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                  rows={3}
                  placeholder="e.g. Employee left company, Upgrade, Damaged..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setReturnModalOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-brand-primary rounded-lg hover:bg-brand-dark">Confirm Return</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
