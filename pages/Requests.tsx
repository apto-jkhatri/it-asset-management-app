import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Inbox, Plus, X, Clock, Edit, CheckCircle, FileText, User, MessageSquare, Send } from 'lucide-react';
import { AssetRequest } from '../types';
import * as Api from '../services/ApiService';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

const Requests = () => {
  const { requests, employees, createRequest, updateRequest, closeRequest, currentUser } = useApp();

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<AssetRequest | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (viewingRequest) {
      loadMessages(viewingRequest.id);
      const interval = setInterval(() => loadMessages(viewingRequest.id), 5000);
      return () => clearInterval(interval);
    }
  }, [viewingRequest]);

  const loadMessages = async (requestId: string) => {
    try {
      const data = await Api.getTicketMessages(requestId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !viewingRequest || isSending) return;

    setIsSending(true);
    try {
      await Api.sendTicketMessage(viewingRequest.id, newMessage);
      setNewMessage('');
      loadMessages(viewingRequest.id);
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setIsSending(false);
    }
  };

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
                        <span className="font-bold text-slate-900 block text-sm">
                          {req.userName || employee?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {req.userEmail || employee?.department || 'No Details'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{req.id}</span>
                  </div>

                  <div className="pl-10">
                    <div className="text-slate-800 font-medium text-lg mb-1">{req.category}</div>
                    <p className="text-sm text-slate-500 line-clamp-2">{req.reason}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>Opened: {req.requestDate}</span>
                      </div>
                      {req.requestIp && (
                        <div className="flex items-center gap-1">
                          <span className="opacity-50">IP:</span>
                          <span className="font-mono bg-slate-100 px-1 rounded">{req.requestIp}</span>
                        </div>
                      )}
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
                    <div className="text-sm text-slate-600 mt-0.5">
                      {req.category}
                      {req.userName && <span className="text-slate-400 ml-2">• Requested by {req.userName}</span>}
                    </div>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 overflow-hidden h-[85vh] flex flex-col">

            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center px-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{viewingRequest.category}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">{viewingRequest.id}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${viewingRequest.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        viewingRequest.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          viewingRequest.status === 'Closed' ? 'bg-slate-100 text-slate-700' :
                            'bg-yellow-100 text-yellow-700'
                      }`}>
                      {viewingRequest.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingRequest(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel: Request Details */}
              <div className="w-80 border-r border-slate-100 bg-slate-50/50 overflow-y-auto p-6 space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Requester Information</span>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                      <User size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{viewingRequest.userName || employees.find(e => e.id === viewingRequest.employeeId)?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500 truncate">{viewingRequest.userEmail || employees.find(e => e.id === viewingRequest.employeeId)?.department}</p>
                    </div>
                  </div>
                  {viewingRequest.requestIp && (
                    <div className="mt-2 text-[10px] text-slate-400 font-medium px-1 flex justify-between">
                      <span>Source IP:</span>
                      <span className="font-mono">{viewingRequest.requestIp}</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Request Details</span>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-1">Issue Category</p>
                      <p className="text-sm text-slate-700 bg-white p-2 rounded-lg border border-slate-200">{viewingRequest.category}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-1">Description</p>
                      <div className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed shadow-sm min-h-[100px]">
                        {viewingRequest.reason}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-1">Date Created</p>
                      <p className="text-sm text-slate-700">{viewingRequest.requestDate}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <button
                    onClick={handleCloseTicket}
                    disabled={viewingRequest.status === 'Closed'}
                    className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm transition-all shadow-sm"
                  >
                    {viewingRequest.status === 'Closed' ? 'Ticket Closed' : 'Close Ticket'}
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    disabled={viewingRequest.status === 'Closed'}
                    className="w-full px-4 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50 text-sm font-bold transition-all"
                  >
                    Edit Details
                  </button>
                </div>
              </div>

              {/* Right Panel: Chat Interaction */}
              <div className="flex-1 flex flex-col bg-white">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2 px-6">
                  <MessageSquare size={16} className="text-blue-500" />
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Ticket Conversation</h4>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${msg.senderId === currentUser?.id
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                        }`}>
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <span className="text-[10px] font-bold text-slate-400">{msg.senderName}</span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-[10px] text-slate-300 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-center py-12 flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                        <MessageSquare size={32} />
                      </div>
                      <p className="text-slate-400 text-sm font-medium">No messages yet.</p>
                      <p className="text-slate-500 text-xs mt-1">Starting the conversation helps resolve tickets faster.</p>
                    </div>
                  )}
                </div>

                {viewingRequest.status !== 'Closed' ? (
                  <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a response or attach information..."
                      className="flex-1 px-4 py-3 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || isSending}
                      className="px-6 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-200 active:scale-95"
                    >
                      <Send size={18} className="mr-2" />
                      <span className="font-bold text-sm">Send</span>
                    </button>
                  </form>
                ) : (
                  <div className="p-4 bg-slate-100 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                    This ticket is finalized and closed
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;