import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Asset, AssetStatus, AssetCondition } from '../types';
import StatusBadge from '../components/StatusBadge';
import { Search, Filter, Plus, Edit, Trash, Smartphone, Laptop, Monitor, Server, Keyboard, Box, Layers, History, X, User, Calendar, FileText, AlertTriangle } from 'lucide-react';

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category.toLowerCase()) {
    case 'laptop': return <Laptop size={16} />;
    case 'monitor': return <Monitor size={16} />;
    case 'mobile': return <Smartphone size={16} />;
    case 'server': return <Server size={16} />;
    case 'keyboard': return <Keyboard size={16} />;
    default: return <Box size={16} />;
  }
};

const DEFAULT_CATEGORIES = ['Laptop', 'Keyboard-Mouse Set', 'Monitor'];

const Assets = () => {
  const { assets, deleteAsset, addAsset, updateAsset, assignments, employees } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingHistoryAsset, setViewingHistoryAsset] = useState<Asset | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState('Laptop');
  const [customCategory, setCustomCategory] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Derive available categories dynamically from existing assets + defaults
  const availableCategories = Array.from(new Set([
    ...DEFAULT_CATEGORIES,
    ...assets.map(a => a.category)
  ])).sort();

  // Helper to determine the actual category string being used
  const currentCategory = selectedCategory === 'Other' ? customCategory : selectedCategory;

  // Logic: Show quantity for anything that isn't strictly a Laptop or Monitor
  // Also only show quantity when Adding, not Editing (to avoid complex bulk updates)
  const showQuantity = !editingAsset &&
    currentCategory &&
    !['laptop', 'monitor'].includes(currentCategory.toLowerCase());

  // Calculate available counts for each asset name to show in the Stock column
  const availableInventory = useMemo(() => {
    return assets.reduce((acc, a) => {
      if (a.status === AssetStatus.AVAILABLE) {
        acc[a.name] = (acc[a.name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [assets]);

  // Filtered list for display
  const filteredAssets = assets.filter(asset => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || asset.status === filterStatus;
    const matchesCategory = filterCategory === 'All' || asset.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Export filtered assets as CSV
  const exportCsv = () => {
    if (!filteredAssets.length) return;
    const headers = ['id', 'tag', 'name', 'serialNumber', 'category', 'status', 'condition', 'location', 'assignedTo', 'image'];
    const rows = filteredAssets.map(a => [
      a.id,
      a.tag,
      a.name,
      a.serialNumber || '',
      a.category,
      a.status,
      a.condition,
      a.location,
      a.assignedTo || '',
      a.image || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(r => r.map(cell => {
        if (cell === null || cell === undefined) return '';
        const s = String(cell).replace(/"/g, '""');
        return `"${s}"`;
      }).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `assets-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Get history for selected asset
  const getAssetHistory = (assetId: string) => {
    return assignments
      .filter(a => a.assetId === assetId)
      .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());
  };

  const openAddModal = () => {
    setEditingAsset(null);
    setSelectedCategory('Laptop');
    setCustomCategory('');
    setQuantity(1);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setSelectedCategory(asset.category);
    setCustomCategory('');
    setQuantity(1);
    setError(null);
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (asset: Asset) => {
    setAssetToDelete(asset);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = () => {
    if (assetToDelete) {
      deleteAsset(assetToDelete.id);
      setDeleteConfirmOpen(false);
      setAssetToDelete(null);
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const baseTag = (formData.get('tag') as string).trim();
    if (!baseTag) return;

    // Check for duplicate tag
    const isDuplicate = assets.some(a =>
      a.tag.toLowerCase() === baseTag.toLowerCase() &&
      (!editingAsset || a.id !== editingAsset.id)
    );

    if (isDuplicate) {
      setError(`Asset tag "${baseTag}" is already in use by another asset.`);
      return;
    }

    // Determine Final Category
    let finalCategory = selectedCategory;
    if (selectedCategory === 'Other') {
      finalCategory = formData.get('customCategory') as string;
      if (!finalCategory.trim()) finalCategory = 'Uncategorized';
    }

    const baseAssetData: any = {
      name: formData.get('name') as string,
      category: finalCategory,
      vendor: '',
      purchaseDate: '',
      cost: 0,
      status: editingAsset ? editingAsset.status : AssetStatus.AVAILABLE,
      condition: editingAsset ? editingAsset.condition : AssetCondition.NEW,
      location: editingAsset ? editingAsset.location : 'Office',
      assignedTo: editingAsset ? editingAsset.assignedTo : undefined,
      image: editingAsset?.image
    };

    if (editingAsset) {
      // Update existing single asset
      const assetData: Asset = {
        ...baseAssetData,
        id: editingAsset.id,
        tag: baseTag,
        serialNumber: editingAsset.serialNumber,
      };
      updateAsset(assetData);
    } else {
      // Create new asset(s)
      const qtyToCreate = showQuantity ? (Number(formData.get('quantity')) || 1) : 1;

      // Double check bulk suffixes too
      if (qtyToCreate > 1) {
        for (let i = 0; i < qtyToCreate; i++) {
          const checkTag = `${baseTag}-${i + 1}`;
          if (assets.some(a => a.tag.toLowerCase() === checkTag.toLowerCase())) {
            setError(`Bulk creation failed: Tag "${checkTag}" is already in use.`);
            return;
          }
        }
      }

      for (let i = 0; i < qtyToCreate; i++) {
        const suffix = qtyToCreate > 1 ? `-${i + 1}` : '';

        const newAsset: Asset = {
          ...baseAssetData,
          id: `A${Date.now()}${Math.floor(Math.random() * 1000)}`,
          tag: `${baseTag}${suffix}`,
          serialNumber: `SN-${Date.now()}${i}`,
        };
        addAsset(newAsset);
      }
    }
    setIsModalOpen(false);
    setEditingAsset(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aptologics Assets</h1>
          <p className="text-slate-500">Manage and track company hardware and software licenses.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            className="bg-slate-100 text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center border border-slate-200"
            title="Export visible assets to CSV"
          >
            <FileText size={16} className="mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => { setEditingAsset(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2.5 rounded-xl hover:bg-brand-dark transition-all shadow-lg shadow-brand-primary/20 active:scale-95 text-sm font-bold"
          >
            <Plus size={18} />
            Register New Asset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, tag, or serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm active:shadow-inner transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Filter size={16} />
              <span>Filter:</span>
            </div>
            <select
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              {Object.values(AssetStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Asset Details</th>
                <th className="px-6 py-3">Tag</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Stock (Avail)</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                        <CategoryIcon category={asset.category} />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-slate-900">{asset.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">{asset.tag}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{asset.category}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${(availableInventory[asset.name] || 0) > 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                      {availableInventory[asset.name] || 0} Avail.
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={asset.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-600">{asset.location}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 hover:bg-slate-200 rounded text-slate-500"
                        title="History"
                        onClick={() => setViewingHistoryAsset(asset)}
                      >
                        <History size={16} />
                      </button>
                      <button
                        className="p-2 hover:bg-slate-200 rounded text-slate-500"
                        title="Edit"
                        onClick={() => openEditModal(asset)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="p-2 hover:bg-red-50 hover:text-red-600 rounded text-slate-500"
                        title="Delete"
                        onClick={() => openDeleteConfirm(asset)}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Box size={48} className="mb-4 text-slate-300" />
                      <p className="text-lg font-medium text-slate-900">No assets found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (Mock) */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
          <span>Showing {filteredAssets.length} of {assets.length} results</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {viewingHistoryAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center sticky top-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Asset History</h3>
                <p className="text-sm text-slate-500">{viewingHistoryAsset.name} - {viewingHistoryAsset.tag}</p>
              </div>
              <button onClick={() => setViewingHistoryAsset(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                {getAssetHistory(viewingHistoryAsset.id).length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    <History size={48} className="mx-auto mb-2 text-slate-200" />
                    <p>No assignment history found for this asset.</p>
                  </div>
                ) : (
                  getAssetHistory(viewingHistoryAsset.id).map((record, index) => {
                    const emp = employees.find(e => e.id === record.employeeId);
                    return (
                      <div key={record.id} className="relative pl-6 pb-6 border-l-2 border-slate-200 last:border-0 last:pb-0">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${record.isActive ? 'bg-blue-500' : 'bg-slate-300'}`}></div>

                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-900">{emp?.name || 'Unknown Employee'}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${record.isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                                {record.isActive ? 'Currently Assigned' : 'Returned'}
                              </span>
                            </div>
                            <div className="text-sm text-slate-600 flex items-center gap-2">
                              <Calendar size={14} />
                              <span>Borrowed: {record.borrowDate}</span>
                              {record.returnedDate && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>Returned: {record.returnedDate}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {record.notes && (
                          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-900">
                            <div className="flex items-start gap-2">
                              <FileText size={14} className="mt-0.5 text-amber-500 shrink-0" />
                              <div>
                                <span className="font-semibold block text-xs uppercase tracking-wide text-amber-700 mb-0.5">Return Notes</span>
                                {record.notes}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && assetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Asset?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete <strong>{assetToDelete.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-md shadow-red-500/30"
                >
                  Delete Asset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden my-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="text-lg font-bold text-slate-900">
                {editingAsset ? 'Edit Asset' : 'Add New Asset'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                {error}
              </div>
            )}
            <form onSubmit={handleSaveSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Asset Name</label>
                  <input
                    required
                    name="name"
                    defaultValue={editingAsset?.name}
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                    placeholder="e.g. Projector X1"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <div className="space-y-2">
                    <select
                      name="category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                    >
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="Other">+ Add New Category</option>
                    </select>

                    {selectedCategory === 'Other' && (
                      <input
                        required={selectedCategory === 'Other'}
                        name="customCategory"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        type="text"
                        placeholder="Enter new category name..."
                        className="w-full px-3 py-2 border border-blue-300 bg-blue-50 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-blue-900 placeholder-blue-300"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Quantity Field */}
              {showQuantity && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-700">
                    <Layers size={18} />
                    <div>
                      <span className="block text-sm font-bold">Bulk Creation</span>
                      <span className="text-xs opacity-80">Generate multiple items at once.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-indigo-800">Qty:</label>
                    <input
                      name="quantity"
                      type="number"
                      min="1"
                      max="100"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-1.5 border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Asset Tag {showQuantity && quantity > 1 && <span className="text-xs text-slate-400 font-normal">(Base)</span>}
                </label>
                <input
                  required
                  name="tag"
                  defaultValue={editingAsset?.tag}
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                  placeholder="AST-XXXX"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-brand-primary rounded-lg hover:bg-brand-dark shadow-md shadow-blue-500/30">
                  {editingAsset ? 'Update Asset' : showQuantity && quantity > 1 ? `Create ${quantity} Assets` : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
