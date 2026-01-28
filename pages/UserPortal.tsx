import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, Package, FileText, AlertCircle, MessageSquare, Send, Clock, X, Settings, Lock, Check } from 'lucide-react';
import * as Api from '../services/ApiService';

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    timestamp: string;
}

const UserPortal = () => {
    const { currentUser, requests, createRequest } = useApp();
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [viewingRequest, setViewingRequest] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [requestCategory, setRequestCategory] = useState('');
    const [requestReason, setRequestReason] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Settings Modal
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    // In the User Portal, we trust the requests returned by the backend as they are already filtered by the user's access.
    // We only apply this filter to ensure newly created local items and fetched items match the user.
    const myRequests = requests.filter(r =>
        currentUser?.role === 'admin' ? true : // Admin sees all
            (r.employeeId === currentUser?.employeeId || (r as any).userId === currentUser?.id || !r.employeeId)
    );

    console.log('[UserPortal] Data Status:', {
        userId: currentUser?.id,
        employeeId: currentUser?.employeeId,
        visibleTickets: myRequests.length,
        totalInContext: requests.length
    });

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

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPass !== confirmPass) {
            setResetStatus('error');
            return;
        }

        setResetStatus('loading');
        try {
            await Api.resetUserPassword(currentUser!.id, newPass);
            setResetStatus('success');
            setTimeout(() => {
                setIsSettingsOpen(false);
                setResetStatus('idle');
                setNewPass('');
                setConfirmPass('');
            }, 2000);
        } catch (err) {
            console.error(err);
            setResetStatus('error');
        }
    };

    const handleCreateRequest = (e: React.FormEvent) => {
        e.preventDefault();

        const newRequest = {
            id: `REQ-${Date.now()}`,
            // IMPORTANT: use the real employeeId linked to the user
            employeeId: currentUser?.employeeId || 'EMP-UNKNOWN',
            category: requestCategory,
            reason: requestReason,
            status: 'Pending' as const,
            requestDate: new Date().toISOString().split('T')[0]
        };

        createRequest(newRequest);
        setIsRequestModalOpen(false);
        setRequestCategory('');
        setRequestReason('');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Portal</h1>
                    <p className="text-slate-500">Manage your asset requests and chat with IT</p>
                </div>
                <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
                >
                    <Package size={18} className="mr-2" />
                    Request New Asset
                </button>
            </div>

            {/* User Profile Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <User size={32} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-900">{currentUser?.name}</h2>
                        <p className="text-slate-500">{currentUser?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded">
                                Standard User
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                                ID: {currentUser?.employeeId}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Account Settings"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* My Requests */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <FileText size={20} />
                        My Asset Requests
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3">Request ID</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {myRequests.map((request) => (
                                <tr key={request.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{request.id}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{request.category}</td>
                                    <td className="px-6 py-4 text-slate-600">{request.requestDate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${request.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                            request.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                request.status === 'Closed' ? 'bg-slate-100 text-slate-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setViewingRequest(request)}
                                            className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-end ml-auto gap-1"
                                        >
                                            <MessageSquare size={14} /> Open Chat
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {myRequests.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        <AlertCircle size={48} className="mx-auto mb-2 text-slate-300" />
                                        <p>No requests yet. Click "Request New Asset" to get started.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View/Chat Modal */}
            {viewingRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{viewingRequest.category}</h3>
                                <div className="flex items-center gap-2 mt-1">
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
                            <button onClick={() => setViewingRequest(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                            {/* Request Info Box */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Original Request Reason</span>
                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{viewingRequest.reason}</p>
                            </div>

                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${msg.senderId === currentUser?.id
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                                            }`}>
                                            <p className="text-sm">{msg.message}</p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 px-1">
                                            <span className="text-[10px] font-bold text-slate-400">{msg.senderName}</span>
                                            <span className="text-[10px] text-slate-300">•</span>
                                            <span className="text-[10px] text-slate-300">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                ))}
                                {messages.length === 0 && (
                                    <div className="text-center py-8">
                                        <MessageSquare size={32} className="mx-auto text-slate-200 mb-2" />
                                        <p className="text-slate-400 text-sm">No messages yet. Send a message to start the conversation.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {viewingRequest.status !== 'Closed' ? (
                            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 px-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSending}
                                    className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        ) : (
                            <div className="p-4 bg-slate-100 text-center text-slate-500 text-xs font-medium">
                                This ticket is closed. Chat is disabled.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Request Modal */}
            {isRequestModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Request New Asset</h3>
                            <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Asset Category</label>
                                <select
                                    required
                                    value={requestCategory}
                                    onChange={(e) => setRequestCategory(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Select category...</option>
                                    <option value="Laptop">Laptop</option>
                                    <option value="Monitor">Monitor</option>
                                    <option value="Keyboard-Mouse Set">Keyboard-Mouse Set</option>
                                    <option value="Mobile">Mobile</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Request</label>
                                <textarea
                                    required
                                    value={requestReason}
                                    onChange={(e) => setRequestReason(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Please explain why you need this asset..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsRequestModalOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Account Settings</h3>
                            <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Security</h4>
                                <form onSubmit={handlePasswordReset} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                        <div className="relative">
                                            <Lock size={16} className="absolute left-3 top-2.5 text-slate-400" />
                                            <input
                                                required
                                                type="password"
                                                value={newPass}
                                                onChange={(e) => setNewPass(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                                        <div className="relative">
                                            <Lock size={16} className="absolute left-3 top-2.5 text-slate-400" />
                                            <input
                                                required
                                                type="password"
                                                value={confirmPass}
                                                onChange={(e) => setConfirmPass(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    {resetStatus === 'error' && (
                                        <p className="text-xs text-red-500 font-medium">Passwords do not match or update failed.</p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={resetStatus === 'loading' || resetStatus === 'success'}
                                        className={`w-full py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${resetStatus === 'success' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                    >
                                        {resetStatus === 'loading' ? 'Updating...' :
                                            resetStatus === 'success' ? <><Check size={18} /> Password Updated</> :
                                                'Update Password'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserPortal;
