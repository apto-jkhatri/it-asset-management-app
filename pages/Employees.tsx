import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Employee } from '../types';
import { Search, Plus, Mail, Briefcase, Calendar, UserCircle, Eye, Trash2, AlertTriangle } from 'lucide-react';

const Employees = () => {
  const { employees, addEmployee, deleteEmployee, assets } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get assets assigned to the viewing employee
  const employeeAssets = viewingEmployee
    ? assets.filter(a => a.assignedTo === viewingEmployee.id)
    : [];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = (formData.get('name') as string).trim();

    if (!name) return;

    // Check for duplicate employee name
    const isDuplicate = employees.some(emp => emp.name.toLowerCase() === name.toLowerCase());

    if (isDuplicate) {
      setError(`An employee named "${name}" already exists.`);
      return;
    }

    const newEmployee: Employee = {
      id: `E${Date.now()}`,
      name: name,
      email: '',
      department: '',
      role: '',
      joinDate: '',
      avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
    };

    addEmployee(newEmployee);
    setIsModalOpen(false);
  };

  const openAddModal = () => {
    setError(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-500">Manage staff directory and access.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Add Employee
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search employees..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatar || `https://ui-avatars.com/api/?name=${emp.name}`}
                        alt={emp.name}
                        className="w-10 h-10 rounded-full bg-slate-200 object-cover"
                      />
                      <div>
                        <div className="font-medium text-slate-900">{emp.name}</div>
                        <div className="text-xs text-slate-400">ID: {emp.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setViewingEmployee(emp)}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-full"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(emp.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full"
                        title="Delete Employee"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-slate-400">
                    <UserCircle size={48} className="mx-auto mb-2 text-slate-300" />
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Add New Employee</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                {error}
              </div>
            )}
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input required name="name" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Employee Detail Modal */}
      {viewingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="p-0">
              {/* Profile Header */}
              <div className="bg-slate-900 p-6 text-white text-center">
                <button onClick={() => setViewingEmployee(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">&times;</button>
                <img
                  src={viewingEmployee.avatar || `https://ui-avatars.com/api/?name=${viewingEmployee.name}`}
                  alt={viewingEmployee.name}
                  className="w-24 h-24 rounded-full border-4 border-slate-800 mx-auto mb-4"
                />
                <h3 className="text-xl font-bold">{viewingEmployee.name}</h3>
              </div>

              <div className="p-6">

                <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Assigned Assets ({employeeAssets.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {employeeAssets.map(asset => (
                    <div key={asset.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{asset.name}</p>
                        <p className="text-xs text-slate-500">{asset.tag}</p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{asset.category}</span>
                    </div>
                  ))}
                  {employeeAssets.length === 0 && (
                    <p className="text-sm text-slate-400 italic text-center py-4">No assets currently assigned.</p>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-100 text-right">
                <button onClick={() => setViewingEmployee(null)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-red-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-red-900">Delete Employee</h3>
              <button onClick={() => setDeleteConfirmId(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6">
              <p className="text-slate-700 mb-2">
                Are you sure you want to delete this employee? This action cannot be undone.
              </p>
              <p className="text-sm text-slate-500">
                {employees.find(e => e.id === deleteConfirmId)?.name}
              </p>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteEmployee(deleteConfirmId);
                  setDeleteConfirmId(null);
                  setViewingEmployee(null);
                }}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
