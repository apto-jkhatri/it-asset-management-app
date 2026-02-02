import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Trash2, Shield, User, Key, Lock, Check, X } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    createdAt: string;
}

const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [department, setDepartment] = useState('');
    const [role, setRole] = useState<'admin' | 'user'>('user');
    const [shouldCreateEmployee, setShouldCreateEmployee] = useState(false);
    const [error, setError] = useState('');

    // Reset Password State
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [userToReset, setUserToReset] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const token = localStorage.getItem('aptologics_auth');
            if (!token) return;
            const { token: sessionToken } = JSON.parse(token);

            const response = await fetch('/api/users', {
                headers: { 'X-Session-Token': sessionToken }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (err) {
            console.error('Failed to load users', err);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const token = localStorage.getItem('aptologics_auth');
            if (!token) return;
            const { token: sessionToken } = JSON.parse(token);

            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Token': sessionToken
                },
                body: JSON.stringify({ name, email, password, role, department, shouldCreateEmployee })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create user');
            }

            await loadUsers();
            setIsModalOpen(false);
            setName('');
            setEmail('');
            setPassword('');
            setDepartment('');
            setRole('user');
            setShouldCreateEmployee(false);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userToReset || !newPassword) return;

        setResetStatus('loading');
        try {
            const token = localStorage.getItem('aptologics_auth');
            if (!token) return;
            const { token: sessionToken } = JSON.parse(token);

            const response = await fetch(`/api/users/${userToReset.id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Token': sessionToken
                },
                body: JSON.stringify({ password: newPassword })
            });

            if (response.ok) {
                setResetStatus('success');
                setTimeout(() => {
                    setResetModalOpen(false);
                    setResetStatus('idle');
                    setNewPassword('');
                    setUserToReset(null);
                }, 2000);
            } else {
                setResetStatus('error');
            }
        } catch (err) {
            console.error(err);
            setResetStatus('error');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const token = localStorage.getItem('aptologics_auth');
            if (!token) return;
            const { token: sessionToken } = JSON.parse(token);

            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'X-Session-Token': sessionToken }
            });

            if (response.ok) {
                await loadUsers();
            }
        } catch (err) {
            console.error('Failed to delete user', err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-500">Manage user accounts and permissions</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors flex items-center shadow-sm"
                >
                    <Plus size={18} className="mr-2" />
                    Add New User
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Created</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
                                                }`}>
                                                {user.role === 'admin' ? (
                                                    <Shield size={20} className="text-purple-600" />
                                                ) : (
                                                    <User size={20} className="text-brand-primary" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{user.name}</div>
                                                <div className="text-xs text-slate-400">{user.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setUserToReset(user);
                                                    setResetModalOpen(true);
                                                }}
                                                className="p-2 hover:bg-amber-50 hover:text-amber-600 rounded text-slate-500 transition-colors"
                                                title="Reset Password"
                                            >
                                                <Key size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={user.id === 'USR-ADMIN-001'}
                                                className="p-2 hover:bg-red-50 hover:text-red-600 rounded text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                title={user.id === 'USR-ADMIN-001' ? 'Cannot delete default admin' : 'Delete user'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Add New User</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>
                        {error && (
                            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    placeholder="john@youroffice.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <input
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    type="password"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                                <input
                                    required
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    placeholder="e.g. IT, HR, Sales"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                >
                                    <option value="user">Standard User</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 py-2">
                                <input
                                    id="shouldCreateEmployee"
                                    type="checkbox"
                                    checked={shouldCreateEmployee}
                                    onChange={(e) => setShouldCreateEmployee(e.target.checked)}
                                    className="w-4 h-4 text-brand-primary border-slate-300 rounded focus:ring-brand-primary"
                                />
                                <label htmlFor="shouldCreateEmployee" className="text-sm text-slate-700">
                                    Create new employee record if not found
                                </label>
                            </div>
                            <p className="text-[10px] text-slate-400 italic">
                                * System will automatically link this user to an existing employee if a matching email is found.
                            </p>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-white bg-brand-primary rounded-lg hover:bg-brand-dark">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Reset Password Modal */}
            {resetModalOpen && userToReset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
                            <button onClick={() => setResetModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <p className="text-sm text-slate-600">Resetting password for <span className="font-bold text-slate-900">{userToReset.name}</span></p>
                            </div>
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-2.5 text-slate-400" />
                                        <input
                                            required
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setResetModalOpen(false)}
                                        className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={resetStatus === 'loading' || resetStatus === 'success'}
                                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${resetStatus === 'success' ? 'bg-green-500 text-white' : 'bg-brand-primary text-white hover:bg-brand-dark'
                                            }`}
                                    >
                                        {resetStatus === 'loading' ? 'Updating...' :
                                            resetStatus === 'success' ? <><Check size={18} /> Password Updated</> :
                                                'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
