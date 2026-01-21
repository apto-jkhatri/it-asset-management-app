import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Inbox, Plus, X, Clock, Edit, CheckCircle, FileText, User } from 'lucide-react';
import { AssetRequest } from '../types';

const Requests = () => {
  const { requests, employees, createRequest, updateRequest, closeRequest } = useApp();

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<AssetRequest | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Derived Lists
  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const activeRequests = requests.filter(r => r.status !== 'Closed'); // Pending + Approved + Rejected? 
  // User says "close the request". I assume Closed is the final state.
  // Let's just show "Open Requests" (Pending) and "Past Requests" (everything else).
  // Actually, standard ticket systems usually have Open vs Closed.
  // Existing statuses: Pending, Approved, Rejected, Closed.
  // I'll group Pending as "Open". Approved/Rejected/Closed as "History".

  const openRequests = requests.filter(r => r.status === 'Pending' || r.status === 'In Progress' as any); // In case we add In Progress later
  const closedRequests = requests.filter(r => r.status !== 'Pending');

  // Create Form State
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const newReq: AssetRequest = {
      id: `R-${Date.now()}`,
      employeeId: formData.get('employeeId') as string,
      category: formData.get('category') as string,
      reason: formData.get('reason') as string,
      status: 'Pending',
      requestDate: new Date().toISOString().split('T')[0]
    };
    createRequest(newReq);
    setIsCreateModalOpen(false);
  };

  // Edit/View Handling
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingRequest) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const updated: AssetRequest = {
      ...viewingRequest,
      employeeId: formData.get('employeeId') as string,
      category: formData.get('category') as string,
      reason: formData.get('reason') as string,
    };
    updateRequest(updated);
    setIsEditing(false);
    setViewingRequest(updated);
  };

  const handleCloseTicket = () => {
    if (viewingRequest) {
      closeRequest(viewingRequest.id);
      setViewingRequest(prev => prev ? { ...prev, status: 'Closed' } : null);
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Requests</h1>
          <p className="text-slate-500">Manage and track IT service tickets.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Create Request
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Requests */}
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Clock size={20} className="text-amber-500" />
            Open Tickets
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{openRequests.length}</span>
          </h2>

          <div className="space-y-3">
            {openRequests.map(req => {
              const employee = employees.find(e => e.id === req.employeeId);
              return (
                <div
                  key={req.id}
                  onClick={() => { setViewingRequest(req); setIsEditing(false); }}
                  className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <User size={14} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-sm">{employee?.name || 'Unknown'}</span>
                        <span className="text-xs text-slate-400">{employee?.department}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{req.id}</span>
                  </div>

                  <div className="pl-10">
                    <div className="text-slate-800 font-medium text-lg mb-1">{req.category}</div>
                    <p className="text-sm text-slate-500 line-clamp-2">{req.reason}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                      <Clock size={12} />
                      <span>Opened: {req.requestDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {openRequests.length === 0 && (
              <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-400 border border-dashed border-slate-200">
                <Inbox size={40} className="mx-auto mb-2 text-slate-300" />
                <p>No open tickets.</p>
              </div>
            )}
          </div>
        </div>

        {/* Closed / History */}
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <CheckCircle size={20} className="text-slate-400" />
            Ticket History
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
            {closedRequests.map(req => {
              const employee = employees.find(e => e.id === req.employeeId);
              return (
                <div
                  key={req.id}
                  onClick={() => { setViewingRequest(req); setIsEditing(false); }}
                  className="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{employee?.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${req.status === 'Closed' ? 'bg-slate-100 text-slate-600' :
                        req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 mt-0.5">{req.category}</div>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <div>{req.requestDate}</div>
                    <div className="font-mono">{req.id}</div>
                  </div>
                </div>
              );
            })}
            {closedRequests.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">No ticket history.</div>
            )}
          </div>
        </div>
      </div>

      {/* Create Request Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Create New Request</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Request From (Employee)</label>
                <select required name="employeeId" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- Select Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.department})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asset / Service Category</label>
                <div className="relative">
                  <input list="categories" required name="category" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Laptop Repair, New Keyboard..." />
                  <datalist id="categories">
                    <option value="Hardware Issue" />
                    <option value="Software License" />
                    <option value="New Equipment" />
                    <option value="Access/Permissions" />
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Details / Comments</label>
                <textarea required name="reason" rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Describe the request..."></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View/Edit Detail Modal */}
      {viewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  {viewingRequest.id}
                  <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${viewingRequest.status === 'Closed' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-700'
                    }`}>{viewingRequest.status}</span>
                </h3>
              </div>
              <button onClick={() => setViewingRequest(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            {/* Content */}
            <div className="p-6">
              {!isEditing ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="w-12 h-12 bg-white rounded-full border border-slate-200 flex items-center justify-center">
                      <User size={24} className="text-slate-400" />
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wide text-slate-400 font-bold">Request From</span>
                      <span className="block font-medium text-slate-900 text-lg">
                        {employees.find(e => e.id === viewingRequest.employeeId)?.name || 'Unknown User'}
                      </span>
                      <span className="text-sm text-slate-500">
                        {employees.find(e => e.id === viewingRequest.employeeId)?.department}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs uppercase tracking-wide text-slate-400 font-bold mb-1">Service / Asset</span>
                    <div className="text-lg font-medium text-slate-900">{viewingRequest.category}</div>
                  </div>

                  <div>
                    <span className="block text-xs uppercase tracking-wide text-slate-400 font-bold mb-2">Details / Comments</span>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700 whitespace-pre-wrap">
                      {viewingRequest.reason}
                    </div>
                  </div>
                </div>
              ) : (
                <form id="edit-form" onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Request From</label>
                    <select name="employeeId" defaultValue={viewingRequest.employeeId} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-slate-50">
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <input name="category" defaultValue={viewingRequest.category} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                    <textarea name="reason" defaultValue={viewingRequest.reason} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                  </div>
                </form>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={handleCloseTicket}
                    disabled={viewingRequest.status === 'Closed'}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {viewingRequest.status === 'Closed' ? 'Ticket Closed' : 'Close Ticket'}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      disabled={viewingRequest.status === 'Closed'}
                      className="px-4 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Edit size={16} /> Edit
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50">Cancel</button>
                  <button type="submit" form="edit-form" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">Save Changes</button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;