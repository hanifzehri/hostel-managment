import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useHostel } from '../../context/HostelContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  Boxes,
  Plus,
  Search,
  PackageCheck,
  Wrench,
  DollarSign,
  Edit,
  Trash2,
} from 'lucide-react';

const Inventory = () => {
  const { hasRole } = useAuth();
  const { settings } = useHostel();
  const { success, error } = useToast();

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ totalItems: 0, totalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const initialData = {
    itemName: '',
    category: 'Furniture',
    quantity: 1,
    condition: 'Good',
    locationName: 'General Storage / Rooms',
    cost: 0,
    status: 'In Use',
    notes: '',
  };
  const [formData, setFormData] = useState(initialData);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== 'All') params.append('category', categoryFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/inventory?${params.toString()}`);
      setItems(res.data.data || []);
      setSummary(res.data.summary || { totalItems: 0, totalValue: 0 });
    } catch (err) {
      console.error(err);
      error('Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [categoryFilter]);

  const openAddModal = () => {
    setSelectedItem(null);
    setFormData(initialData);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormData({
      itemName: item.itemName || '',
      category: item.category || 'Furniture',
      quantity: item.quantity || 1,
      condition: item.condition || 'Good',
      locationName: item.locationName || 'General Store',
      cost: item.cost || 0,
      status: item.status || 'In Use',
      notes: item.notes || '',
    });
    setModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      if (selectedItem) {
        await api.put(`/inventory/${selectedItem._id}`, formData);
        success('Inventory item updated.');
      } else {
        await api.post('/inventory', formData);
        success('New asset added to inventory.');
      }
      setModalOpen(false);
      fetchInventory();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save inventory item.');
    } finally {
      setModalLoading(false);
    }
  };

  const categories = ['All', 'Furniture', 'Appliance', 'Electronics', 'Bedding', 'Sanitary', 'Security', 'Other'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Hostel Assets & Inventory Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track beds, mattresses, study furniture, air conditioners, fans, and campus equipment.
          </p>
        </div>

        {hasRole(['superadmin', 'admin']) && (
          <Button onClick={openAddModal} icon={Plus} variant="primary">
            Add Equipment / Item
          </Button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Asset Units</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {summary.totalItems.toLocaleString()} Units
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Total Asset Valuation</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {settings.currency} {summary.totalValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
            placeholder="Search equipment name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Button onClick={fetchInventory} variant="secondary" size="sm">
            Filter
          </Button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving equipment inventory..." />
        ) : items.length === 0 ? (
          <EmptyState
            title="No inventory items found"
            description="Add assets to manage hostel furnishings and equipment."
            actionLabel="Add Asset"
            onAction={openAddModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 uppercase font-bold text-slate-400">
                  <th className="py-3.5 px-4">Item Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Physical Condition</th>
                  <th className="py-3.5 px-4">Location / Room</th>
                  <th className="py-3.5 px-4">Asset Value</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {item.itemName}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {item.category}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {item.quantity} Units
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={item.condition === 'Good' || item.condition === 'New' ? 'success' : 'warning'}>
                        {item.condition}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {item.room ? `Room ${item.room.roomNumber}` : item.locationName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-mono">
                      {settings.currency} {item.cost.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge>{item.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {hasRole(['superadmin', 'admin']) && (
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedItem ? 'Edit Asset' : 'Add Inventory Asset'}
        subtitle="Manage hostel furnishings, appliances, and electronics."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveItem} loading={modalLoading}>
              Save Asset
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Asset / Equipment Name *
            </label>
            <input
              type="text"
              required
              value={formData.itemName}
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              placeholder="e.g. Haier Inverter AC 1.5 Ton"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {categories.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Damaged">Damaged</option>
                <option value="Under Repair">Under Repair</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Estimated Value ({settings.currency})
              </label>
              <input
                type="number"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Location / Placement
            </label>
            <input
              type="text"
              value={formData.locationName}
              onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              placeholder="e.g. Block A Study Lounge / Room 101"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
