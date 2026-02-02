import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Employee } from '../types';
import { Search, Plus, Mail, Briefcase, Calendar, UserCircle, Eye, Trash2, AlertTriangle } from 'lucide-react';

const Employees = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, assets } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = (formData.get('name') as string).trim();
    const email = (formData.get('email') as string).trim();
    const department = (formData.get('department') as string).trim();
    const role = (formData.get('role') as string).trim();

    if (!name || !email) {
      setError('Name and Email are required.');
      return;
    }

    // Check for duplicate employee email
    const isDuplicate = employees.some(emp => emp.email.toLowerCase() === email.toLowerCase());
    if (isDuplicate) {
      setError(`An employee with email "${email}" already exists.`);
      return;
    }

    const newEmployee: Employee = {
      id: `E${Date.now()}`,
      name,
      email,
      department,
      role,
      joinDate: new Date().toISOString().split('T')[0],
      avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
    };

    addEmployee(newEmployee);
    setIsModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setError(null);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = (formData.get('name') as string).trim();
    const email = (formData.get('email') as string).trim();
    const department = (formData.get('department') as string).trim();
    const role = (formData.get('role') as string).trim();

    if (!name || !email) {
      setError('Name and Email are required.');
      return;
    }

    // Check for duplicate email excluding current employee
    const isDuplicate = employees.some(emp => emp.id !== editingEmployee.id && emp.email.toLowerCase() === email.toLowerCase());
    if (isDuplicate) {
      setError(`Another employee with email "${email}" already exists.`);
      return;
    }

    const updatedEmployee: Employee = {
      ...editingEmployee,
      name,
      email,
      department,
      role
    };

    updateEmployee(updatedEmployee);
    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };

  const openAddModal = () => {
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setError(null);
    setEditingEmployee(emp);
    setIsEditModalOpen(true);
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
          className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors flex items-center shadow-sm"
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
              placeholder="Search employees by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
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
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Department</th>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={14} className="text-slate-400" />
                      {emp.email || <span className="text-slate-300 italic">No email</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Briefcase size={14} className="text-slate-400" />
                      {emp.department || <span className="text-slate-300 italic">Not set</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setViewingEmployee(emp)}
                        className="text-slate-400 hover:text-brand-primary transition-colors p-2 hover:bg-blue-50 rounded-full"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => openEditModal(emp)}
                        className="text-slate-400 hover:text-brand-primary transition-colors p-2 hover:bg-blue-50 rounded-full"
                        title="Edit Employee"
                      >
                        <Plus size={18} className="rotate-45" /> {/* Use as edit icon for now or select better */}
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
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <EmployeeModal
          title="Add New Employee"
          error={error}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddSubmit}
        />
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && editingEmployee && (
        <EmployeeModal
          title="Edit Employee"
          error={error}
          employee={editingEmployee}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingEmployee(null);
          }}
          onSubmit={handleEditSubmit}
        />
      )}

      {/* View Employee Detail Modal */}
      {viewingEmployee && (
        <EmployeeDetailModal
          employee={viewingEmployee}
          assets={assets.filter(a => a.assignedTo === viewingEmployee.id)}
          onClose={() => setViewingEmployee(null)}
        />
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
              <p className="text-slate-700 mb-2">Are you sure you want to delete this employee?</p>
              <p className="text-sm text-slate-500">{employees.find(e => e.id === deleteConfirmId)?.name}</p>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100">Cancel</button>
              <button
                onClick={() => {
                  deleteEmployee(deleteConfirmId);
                  setDeleteConfirmId(null);
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

// Helper Components
const EmployeeModal = ({ title, error, employee, onClose, onSubmit }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
      </div>
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input required name="name" defaultValue={employee?.name} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
          <input required name="email" defaultValue={employee?.email} type="email" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
          <input name="department" defaultValue={employee?.department} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none" placeholder="e.g. Engineering" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Role/Designation</label>
          <input name="role" defaultValue={employee?.role} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none" placeholder="e.g. Software Engineer" />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
          <button type="submit" className="px-4 py-2 text-white bg-brand-primary rounded-lg hover:bg-brand-dark">
            {employee ? 'Save Changes' : 'Add Employee'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const EmployeeDetailModal = ({ employee, assets, onClose }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden relative">
      <div className="bg-slate-900 p-8 text-white text-center rounded-t-xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">&times;</button>
        <img
          src={employee.avatar || `https://ui-avatars.com/api/?name=${employee.name}`}
          alt={employee.name}
          className="w-24 h-24 rounded-full border-4 border-slate-800 mx-auto mb-4"
        />
        <h3 className="text-2xl font-bold">{employee.name}</h3>
        <p className="text-slate-400 mt-1">{employee.role || 'Staff Member'}</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-brand-primary">
              <Mail size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Email</p>
              <p className="text-slate-900 font-medium truncate max-w-[150px]">{employee.email || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-brand-primary">
              <Briefcase size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Department</p>
              <p className="text-slate-900 font-medium">{employee.department || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Assigned Assets ({assets.length})
          </h4>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {assets.map((asset: any) => (
              <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                    <Briefcase size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm leading-tight">{asset.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{asset.tag}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-white text-slate-600 px-2 py-1 rounded border border-slate-200 font-bold uppercase">{asset.category}</span>
              </div>
            ))}
            {assets.length === 0 && (
              <div className="text-center py-6 text-slate-400">
                <AlertTriangle size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm italic">No assets assigned yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
        <button onClick={onClose} className="px-6 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors font-medium">Close</button>
      </div>
    </div>
  </div>
);

export default Employees;
