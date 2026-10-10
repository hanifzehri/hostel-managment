import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useHostel } from '../../context/HostelContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  DoorOpen,
  BedDouble,
  Plus,
  UserCheck,
  UserX,
  Wrench,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Building,
} from 'lucide-react';

const Rooms = () => {
  const { hasRole } = useAuth();
  const { settings } = useHostel();
  const { success, error } = useToast();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [blockFilter, setBlockFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [assignBedOpen, setAssignBedOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Vacate confirmation
  const [vacateConfirmOpen, setVacateConfirmOpen] = useState(false);
  const [bedToVacate, setBedToVacate] = useState(null);

  // New Room Form State
  const initialRoomData = {
    roomNumber: '',
    block: 'Block A',
    floor: 1,
    capacity: 2,
    roomType: 'Double',
    monthlyFee: 18000,
  };
  const [roomFormData, setRoomFormData] = useState(initialRoomData);

  // Fetch rooms with beds
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (blockFilter !== 'All') params.append('block', blockFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/rooms?${params.toString()}`);
      setRooms(res.data.data || []);
    } catch (err) {
      console.error(err);
      error('Failed to load rooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [blockFilter, statusFilter]);

  // Load students without a bed for assignment modal
  const openAssignModal = async (bed) => {
    setSelectedBed(bed);
    setSelectedStudentId('');
    try {
      const res = await api.get('/students?status=Active');
      // Filter students who either don't have a bed or are pending
      const eligibleStudents = (res.data.data || []).filter((s) => !s.bed);
      setAvailableStudents(eligibleStudents);
      setAssignBedOpen(true);
    } catch (err) {
      error('Failed to load eligible students.');
    }
  };

  const handleAssignBed = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      error('Please select a student.');
      return;
    }

    setModalLoading(true);
    try {
      await api.post(`/beds/${selectedBed._id}/assign`, { studentId: selectedStudentId });
      success('Bed successfully assigned to student.');
      setAssignBedOpen(false);
      fetchRooms();
    } catch (err) {
      error(err.response?.data?.message || 'Assignment failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleVacateBed = async () => {
    if (!bedToVacate) return;
    try {
      await api.post(`/beds/${bedToVacate._id}/vacate`);
      success(`Bed ${bedToVacate.bedNumber} is now Available.`);
      setVacateConfirmOpen(false);
      fetchRooms();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to vacate bed.');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.post('/rooms', roomFormData);
      success(`Room ${roomFormData.roomNumber} created with ${roomFormData.capacity} beds.`);
      setCreateRoomOpen(false);
      setRoomFormData(initialRoomData);
      fetchRooms();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create room.');
    } finally {
      setModalLoading(false);
    }
  };

  // Categorize rooms for KPI cards
  const availableCount = rooms.filter((r) => r.currentOccupants === 0).length;
  const fullCount = rooms.filter((r) => r.availableBeds === 0).length;
  const partialCount = rooms.filter((r) => r.currentOccupants > 0 && r.availableBeds > 0).length;
  const occupiedCount = rooms.filter((r) => r.currentOccupants > 0).length;

  const filteredRooms = rooms.filter((room) => {
    if (statusFilter === 'Available') return room.currentOccupants === 0;
    if (statusFilter === 'Partially Occupied') return room.currentOccupants > 0 && room.availableBeds > 0;
    if (statusFilter === 'Full') return room.availableBeds === 0;
    if (statusFilter === 'Occupied') return room.currentOccupants > 0;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <DoorOpen className="w-4 h-4" />
            <span>Hostel Accommodation Management</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Room & Bed Allocation Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visual room occupancy tracking and individual bed assignment with strict double-booking prevention.
          </p>
        </div>

        {hasRole(['superadmin', 'admin']) && (
          <Button onClick={() => setCreateRoomOpen(true)} icon={Plus} variant="primary">
            Add New Room
          </Button>
        )}
      </div>

      {/* 4 Room Status KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('All')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Total Rooms
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{rooms.length}</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Across Blocks A, B, C</span>
        </div>

        <div
          onClick={() => setStatusFilter('Available')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block">
            Available Rooms
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{availableCount}</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">0 occupants (Ready)</span>
        </div>

        <div
          onClick={() => setStatusFilter('Partially Occupied')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm cursor-pointer hover:border-amber-400 transition-colors"
        >
          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider block">
            Partially Occupied
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{partialCount}</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Beds available for booking</span>
        </div>

        <div
          onClick={() => setStatusFilter('Full')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm cursor-pointer hover:border-rose-400 transition-colors"
        >
          <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider block">
            Full Rooms
          </span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{fullCount}</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">100% capacity filled</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRooms()}
            placeholder="Search room number..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-900 dark:text-white"
          >
            <option value="All">All Blocks</option>
            <option value="Block A">Block A</option>
            <option value="Block B">Block B</option>
            <option value="Block C">Block C</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-900 dark:text-white"
          >
            <option value="All">All Room Statuses</option>
            <option value="Available">Available Rooms</option>
            <option value="Partially Occupied">Partially Occupied Rooms</option>
            <option value="Full">Full Rooms</option>
            <option value="Occupied">Occupied Rooms</option>
          </select>

          <Button onClick={fetchRooms} variant="secondary" size="sm">
            Filter
          </Button>
        </div>
      </div>

      {/* Rooms Visual Grid */}
      {loading ? (
        <LoadingSpinner text="Loading visual room occupancy map..." />
      ) : filteredRooms.length === 0 ? (
        <EmptyState
          title="No rooms found"
          description="Try adjusting your block or status filters."
          actionLabel="Create Room"
          onAction={() => setCreateRoomOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const isFull = room.availableBeds === 0;
            return (
              <div
                key={room._id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
              >
                {/* Room Header */}
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          Room {room.roomNumber}
                        </span>
                        <Badge variant={isFull ? 'danger' : 'success'}>
                          {isFull ? 'Full' : `${room.availableBeds} Vacant`}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {room.block} • Floor {room.floor} • {room.roomType}
                      </p>
                    </div>

                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {settings.currency} {room.monthlyFee.toLocaleString()}/mo
                    </span>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                      <span>Occupancy</span>
                      <span>
                        {room.currentOccupants} / {room.capacity} Beds
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFull ? 'bg-rose-500' : 'bg-indigo-600'
                        }`}
                        style={{
                          width: `${Math.round((room.currentOccupants / room.capacity) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Individual Beds Breakdown */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Individual Beds
                  </p>
                  <div className="space-y-2">
                    {room.beds?.map((bed) => {
                      const isOccupied = bed.status === 'Occupied';
                      return (
                        <div
                          key={bed._id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                            isOccupied
                              ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40'
                              : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <BedDouble
                              className={`w-4 h-4 shrink-0 ${
                                isOccupied ? 'text-indigo-600' : 'text-emerald-600'
                              }`}
                            />
                            <div className="min-w-0 truncate">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {bed.bedNumber}
                              </p>
                              {bed.currentStudent ? (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {bed.currentStudent.fullName} ({bed.currentStudent.studentId})
                                </p>
                              ) : (
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                  Available for assignment
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Bed Action buttons */}
                          <div>
                            {isOccupied ? (
                              <button
                                onClick={() => {
                                  setBedToVacate(bed);
                                  setVacateConfirmOpen(true);
                                }}
                                title="Vacate Bed"
                                className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100/60 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                              >
                                Vacate
                              </button>
                            ) : (
                              <button
                                onClick={() => openAssignModal(bed)}
                                title="Assign Student"
                                className="px-2 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-100/60 dark:hover:bg-indigo-950/60 rounded-lg transition-colors"
                              >
                                Assign
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Bed Modal */}
      <Modal
        isOpen={assignBedOpen}
        onClose={() => setAssignBedOpen(false)}
        title="Assign Bed to Student"
        subtitle={`Assigning ${selectedBed?.bedNumber} in Room ${selectedBed?.room?.roomNumber || ''}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignBedOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAssignBed} loading={modalLoading}>
              Confirm Assignment
            </Button>
          </>
        }
      >
        <form onSubmit={handleAssignBed} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
              Select Resident without Bed:
            </label>
            {availableStudents.length === 0 ? (
              <p className="text-amber-600 bg-amber-50 dark:bg-amber-950 p-3 rounded-xl border border-amber-200 dark:border-amber-900">
                All currently active students already have allocated beds. Register a new student first to assign this bed.
              </p>
            ) : (
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="">-- Choose Student --</option>
                {availableStudents.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.fullName} ({s.studentId} • {s.institution})
                  </option>
                ))}
              </select>
            )}
          </div>
        </form>
      </Modal>

      {/* Add Room Modal */}
      <Modal
        isOpen={createRoomOpen}
        onClose={() => setCreateRoomOpen(false)}
        title="Create New Room"
        subtitle="Individual beds (Bed A, Bed B, etc.) will be automatically generated based on capacity."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateRoomOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateRoom} loading={modalLoading}>
              Create Room & Beds
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Room Number *
            </label>
            <input
              type="text"
              required
              value={roomFormData.roomNumber}
              onChange={(e) => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })}
              placeholder="e.g. 104 or 203"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Block</label>
              <select
                value={roomFormData.block}
                onChange={(e) => setRoomFormData({ ...roomFormData, block: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="Block A">Block A</option>
                <option value="Block B">Block B</option>
                <option value="Block C">Block C</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Floor</label>
              <input
                type="number"
                min="0"
                value={roomFormData.floor}
                onChange={(e) => setRoomFormData({ ...roomFormData, floor: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Bed Capacity *
              </label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={roomFormData.capacity}
                onChange={(e) => setRoomFormData({ ...roomFormData, capacity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Monthly Rent ({settings.currency})
              </label>
              <input
                type="number"
                min="0"
                value={roomFormData.monthlyFee}
                onChange={(e) => setRoomFormData({ ...roomFormData, monthlyFee: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal to Vacate Bed */}
      <ConfirmationModal
        isOpen={vacateConfirmOpen}
        onClose={() => setVacateConfirmOpen(false)}
        onConfirm={handleVacateBed}
        title="Vacate Bed"
        message={`Are you sure you want to vacate ${bedToVacate?.bedNumber}? The assigned resident will be unlinked and the bed will become Available.`}
        confirmText="Yes, Vacate Bed"
        confirmVariant="danger"
      />
    </div>
  );
};

export default Rooms;
