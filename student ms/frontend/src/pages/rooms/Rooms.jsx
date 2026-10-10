import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Building,
  ArrowRightLeft,
  Settings2,
  Users,
  Layers,
  ChevronRight,
  ShieldCheck,
  User,
} from 'lucide-react';

const Rooms = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { settings } = useHostel();
  const { success, error } = useToast();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeFloorTab, setActiveFloorTab] = useState('All'); // 'All', 1, 2, 3
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Available', 'Partially Occupied', 'Full'
  const [search, setSearch] = useState('');

  // Modals
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [assignBedOpen, setAssignBedOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Capacity edit modal
  const [editCapacityOpen, setEditCapacityOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState(null);
  const [newCapacity, setNewCapacity] = useState(2);

  // Transfer modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [studentToTransfer, setStudentToTransfer] = useState(null);
  const [currentRoomOfStudent, setCurrentRoomOfStudent] = useState(null);
  const [destinationRoomId, setDestinationRoomId] = useState('');
  const [transferReason, setTransferReason] = useState('Resident requested room change.');
  const [confirmTransferStep, setConfirmTransferStep] = useState(false);

  // Vacate confirmation
  const [vacateConfirmOpen, setVacateConfirmOpen] = useState(false);
  const [bedToVacate, setBedToVacate] = useState(null);

  // New Room Form State
  const initialRoomData = {
    roomNumber: '',
    block: 'Floor 1',
    floor: 1,
    capacity: 3,
    roomType: 'Triple',
    monthlyFee: 10000,
  };
  const [roomFormData, setRoomFormData] = useState(initialRoomData);

  // Fetch rooms with beds
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/rooms?${params.toString()}`);
      setRooms(res.data.data || []);
    } catch (err) {
      console.error(err);
      error('Failed to load hostel rooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [statusFilter]);

  // Load students without a bed for assignment modal
  const openAssignModal = async (bed) => {
    setSelectedBed(bed);
    setSelectedStudentId('');
    try {
      const res = await api.get('/students?status=Active&limit=50');
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
      success('Bed successfully assigned to resident.');
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

  // Open Edit Capacity Modal
  const openCapacityModal = (room) => {
    setRoomToEdit(room);
    setNewCapacity(room.capacity);
    setEditCapacityOpen(true);
  };

  const handleUpdateCapacity = async (e) => {
    e.preventDefault();
    if (!roomToEdit) return;
    setModalLoading(true);
    try {
      await api.put(`/rooms/${roomToEdit._id}`, { capacity: Number(newCapacity) });
      success(`Room ${roomToEdit.roomNumber} capacity updated to ${newCapacity} beds.`);
      setEditCapacityOpen(false);
      fetchRooms();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update capacity.');
    } finally {
      setModalLoading(false);
    }
  };

  // Open Room Transfer Modal
  const openTransferModal = (student, currentRoom) => {
    setStudentToTransfer(student);
    setCurrentRoomOfStudent(currentRoom);
    setDestinationRoomId('');
    setTransferReason('Resident requested room change.');
    setConfirmTransferStep(false);
    setTransferModalOpen(true);
  };

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (!destinationRoomId) {
      error('Please select a destination room.');
      return;
    }
    setModalLoading(true);
    try {
      const res = await api.post(`/students/${studentToTransfer._id}/transfer-room`, {
        newRoomId: destinationRoomId,
        reason: transferReason,
      });
      success(res.data.message || 'Student room transferred successfully.');
      setTransferModalOpen(false);
      setConfirmTransferStep(false);
      fetchRooms();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to transfer student.');
    } finally {
      setModalLoading(false);
    }
  };

  // KPI Calculations
  const totalBeds = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const totalOccupied = rooms.reduce((sum, r) => sum + (r.currentOccupants || 0), 0);
  const totalAvailable = Math.max(0, totalBeds - totalOccupied);

  const availableRoomsCount = rooms.filter((r) => r.currentOccupants === 0).length;
  const partialRoomsCount = rooms.filter((r) => r.currentOccupants > 0 && r.currentOccupants < r.capacity).length;
  const fullRoomsCount = rooms.filter((r) => r.currentOccupants >= r.capacity).length;

  // Filter by Floor tab & Search
  const filteredRooms = rooms.filter((room) => {
    if (activeFloorTab !== 'All' && room.floor !== Number(activeFloorTab)) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchNum = room.roomNumber.toLowerCase().includes(q);
      const matchStu = room.beds?.some((b) => b.currentStudent?.fullName?.toLowerCase().includes(q));
      if (!matchNum && !matchStu) return false;
    }
    return true;
  });

  // Group filtered rooms by floor (Floor 1, Floor 2, Floor 3)
  const floorGroups = [1, 2, 3].map((floorNum) => ({
    floor: floorNum,
    title: `Floor ${floorNum}`,
    subtitle: floorNum === 1 ? 'Ground Floor' : floorNum === 2 ? 'First Floor' : 'Second Floor',
    rooms: filteredRooms.filter((r) => r.floor === floorNum),
  }));

  // Selected destination room details for Transfer modal
  const selectedDestinationRoom = rooms.find((r) => r._id === destinationRoomId);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Three-Floor Architecture (12 Rooms • 40 Max Capacity)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Hostel Room & Bed Allocation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visual management for Floor 1 (101-104), Floor 2 (201-204), and Floor 3 (301-304) with real-time occupancy.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {hasRole(['superadmin', 'admin']) && (
            <Button onClick={() => setCreateRoomOpen(true)} icon={Plus} variant="primary">
              Add Room
            </Button>
          )}
        </div>
      </div>

      {/* 4 Primary Status KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Rooms & Bed Capacity */}
        <div
          onClick={() => setStatusFilter('All')}
          className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm cursor-pointer transition-all ${
            statusFilter === 'All'
              ? 'border-blue-600 ring-2 ring-blue-500/20'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Total Capacity
            </span>
            <DoorOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{rooms.length} Rooms</span>
            <span className="text-xs font-bold text-slate-400">({totalBeds} Beds)</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            Across 3 Floors (4 Rooms each)
          </span>
        </div>

        {/* Available Rooms (Green) */}
        <div
          onClick={() => setStatusFilter('Available')}
          className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm cursor-pointer transition-all ${
            statusFilter === 'Available'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
              Available Rooms
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {availableRoomsCount} Rooms
            </span>
            <span className="text-xs font-bold text-emerald-600/80">({totalAvailable} Vacant Beds)</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            0 occupants • Ready for allocation
          </span>
        </div>

        {/* Partially Occupied Rooms (Amber) */}
        <div
          onClick={() => setStatusFilter('Partially Occupied')}
          className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm cursor-pointer transition-all ${
            statusFilter === 'Partially Occupied'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
              Partially Occupied
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {partialRoomsCount} Rooms
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            Has active residents & open beds
          </span>
        </div>

        {/* Full Rooms (Red) */}
        <div
          onClick={() => setStatusFilter('Full')}
          className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm cursor-pointer transition-all ${
            statusFilter === 'Full'
              ? 'border-red-500 ring-2 ring-red-500/20'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-red-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 tracking-wider">
              Full Rooms
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-red-600 dark:text-red-400">
              {fullRoomsCount} Rooms
            </span>
            <span className="text-xs font-bold text-slate-400">({totalOccupied} Occupants)</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            100% capacity reached
          </span>
        </div>
      </div>

      {/* Floor Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Floor Selection Tabs */}
        <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'All', label: 'All 3 Floors (12 Rooms)' },
            { id: 1, label: 'Floor 1 (101-104)' },
            { id: 2, label: 'Floor 2 (201-204)' },
            { id: 3, label: 'Floor 3 (301-304)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFloorTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeFloorTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input & Status filter */}
        <div className="flex items-center space-x-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search room or resident..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-900 dark:text-white"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available Only</option>
            <option value="Partially Occupied">Partially Occupied</option>
            <option value="Full">Full Only</option>
          </select>
        </div>
      </div>

      {/* Visual Floor-by-Floor Rooms Layout */}
      {loading ? (
        <LoadingSpinner text="Loading 3-floor visual room occupancy layout..." />
      ) : filteredRooms.length === 0 ? (
        <EmptyState
          title="No rooms match the selected criteria"
          description="Try selecting a different floor or resetting the status filters."
          actionLabel="Show All Rooms"
          onAction={() => {
            setActiveFloorTab('All');
            setStatusFilter('All');
            setSearch('');
          }}
        />
      ) : (
        <div className="space-y-8">
          {floorGroups
            .filter((fg) => activeFloorTab === 'All' || fg.floor === Number(activeFloorTab))
            .map((fg) => {
              if (fg.rooms.length === 0) return null;
              return (
                <div key={fg.floor} className="space-y-4">
                  {/* Floor Header Bar */}
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                        {fg.floor}
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                          {fg.title} • {fg.subtitle}
                        </h2>
                        <p className="text-xs text-slate-400">
                          {fg.rooms.length} Rooms • {fg.rooms.reduce((s, r) => s + r.capacity, 0)} Total Beds
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4 Rooms Grid for this floor */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    {fg.rooms.map((room) => {
                      const isFull = room.currentOccupants >= room.capacity;
                      const isAvailable = room.currentOccupants === 0;
                      const isPartial = room.currentOccupants > 0 && room.currentOccupants < room.capacity;

                      const statusBadge = isFull ? (
                        <Badge variant="full">Full ({room.currentOccupants}/{room.capacity})</Badge>
                      ) : isPartial ? (
                        <Badge variant="partial">Partially Occupied ({room.currentOccupants}/{room.capacity})</Badge>
                      ) : (
                        <Badge variant="available">Available ({room.capacity} Vacant)</Badge>
                      );

                      const progressColor = isFull
                        ? 'bg-red-500'
                        : isPartial
                        ? 'bg-amber-500'
                        : 'bg-emerald-500';

                      return (
                        <div
                          key={room._id}
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all relative overflow-hidden"
                        >
                          {/* Top Status Accent Bar */}
                          <div
                            className={`absolute top-0 left-0 right-0 h-1.5 ${
                              isFull ? 'bg-red-500' : isPartial ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />

                          {/* Room Header Info */}
                          <div>
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg font-black text-slate-900 dark:text-white">
                                    Room {room.roomNumber}
                                  </span>
                                  {statusBadge}
                                </div>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">
                                  Floor {room.floor} • {room.roomType}
                                </p>
                              </div>

                              <button
                                onClick={() => openCapacityModal(room)}
                                title="Configure room capacity"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Settings2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Occupancy Progress Bar */}
                            <div className="mt-3">
                              <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                <span>Occupancy</span>
                                <span>
                                  {room.currentOccupants} / {room.capacity} Beds
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                                  style={{
                                    width: `${Math.min(100, Math.round((room.currentOccupants / room.capacity) * 100))}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Individual Beds Breakdown */}
                          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-1">
                            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
                              <span>Bed Allocations</span>
                              <span className="text-slate-500">
                                {room.availableBeds} Available
                              </span>
                            </p>

                            <div className="space-y-2">
                              {room.beds?.map((bed) => {
                                const isOccupied = bed.status === 'Occupied';
                                const student = bed.currentStudent;

                                return (
                                  <div
                                    key={bed._id}
                                    className={`p-2.5 rounded-xl border text-xs transition-colors flex items-center justify-between ${
                                      isOccupied
                                        ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700'
                                        : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                                      <BedDouble
                                        className={`w-4 h-4 shrink-0 ${
                                          isOccupied ? 'text-slate-500' : 'text-emerald-600 dark:text-emerald-400'
                                        }`}
                                      />
                                      <div className="min-w-0 truncate">
                                        <div className="flex items-center space-x-1.5">
                                          <span className="font-bold text-slate-900 dark:text-white">
                                            {bed.bedNumber}
                                          </span>
                                          {isOccupied && (
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                                              Occupied
                                            </span>
                                          )}
                                        </div>

                                        {student ? (
                                          <div className="flex items-center space-x-1.5 mt-0.5 truncate">
                                            <p
                                              onClick={() => navigate(`/students/${student._id}`)}
                                              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 truncate hover:underline cursor-pointer"
                                            >
                                              {student.fullName}
                                            </p>
                                            <span className="text-[10px] text-slate-400 shrink-0">
                                              ({student.studentId})
                                            </span>
                                          </div>
                                        ) : (
                                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                            Vacant • Available
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action Buttons: Move / Vacate / Assign */}
                                    <div className="flex items-center space-x-1 shrink-0">
                                      {isOccupied ? (
                                        <>
                                          <button
                                            onClick={() => openTransferModal(student, room)}
                                            title="Move/Transfer student to another room"
                                            className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                          >
                                            <ArrowRightLeft className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              setBedToVacate(bed);
                                              setVacateConfirmOpen(true);
                                            }}
                                            title="Vacate Bed"
                                            className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                          >
                                            Vacate
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          onClick={() => openAssignModal(bed)}
                                          title="Assign Resident"
                                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/40 hover:bg-emerald-200/70 rounded-lg transition-colors"
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

                          {/* Room Footer Info */}
                          <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                            <span>Rs. {room.monthlyFee?.toLocaleString()}/mo</span>
                            <span className="font-semibold text-slate-500">
                              Capacity: {room.capacity}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Modal: Edit Room Capacity */}
      <Modal
        isOpen={editCapacityOpen}
        onClose={() => setEditCapacityOpen(false)}
        title={`Configure Capacity: Room ${roomToEdit?.roomNumber}`}
        subtitle={`Current occupancy: ${roomToEdit?.currentOccupants} students`}
        maxWidth="max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditCapacityOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateCapacity} loading={modalLoading}>
              Save Capacity
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateCapacity} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Room Bed Capacity (1 to 6 beds):
            </label>
            <input
              type="number"
              min={roomToEdit?.currentOccupants || 1}
              max={6}
              value={newCapacity}
              onChange={(e) => setNewCapacity(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Minimum capacity cannot be less than current occupants ({roomToEdit?.currentOccupants || 0}).
            </p>
          </div>
        </form>
      </Modal>

      {/* Modal: Move / Transfer Student Between Rooms */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => {
          setTransferModalOpen(false);
          setConfirmTransferStep(false);
        }}
        title="Move Student to Another Room"
        subtitle={`Transfer resident ${studentToTransfer?.fullName || ''} (${studentToTransfer?.studentId || ''})`}
        maxWidth="max-w-lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                if (confirmTransferStep) {
                  setConfirmTransferStep(false);
                } else {
                  setTransferModalOpen(false);
                }
              }}
            >
              {confirmTransferStep ? 'Back' : 'Cancel'}
            </Button>

            {!confirmTransferStep ? (
              <Button
                variant="primary"
                disabled={!destinationRoomId || selectedDestinationRoom?.currentOccupants >= selectedDestinationRoom?.capacity}
                onClick={() => setConfirmTransferStep(true)}
              >
                Proceed to Confirmation
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleExecuteTransfer}
                loading={modalLoading}
              >
                Confirm & Complete Transfer
              </Button>
            )}
          </>
        }
      >
        {!confirmTransferStep ? (
          <div className="space-y-4 text-xs">
            {/* Current Room Details Card */}
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Assignment:</span>
              <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                Room {currentRoomOfStudent?.roomNumber} (Floor {currentRoomOfStudent?.floor})
              </p>
              <p className="text-[11px] text-slate-500">
                Resident: {studentToTransfer?.fullName} • CNIC: {studentToTransfer?.cnic}
              </p>
            </div>

            {/* Destination Room Selector */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                Select Destination Room (across 12 rooms):
              </label>
              <select
                required
                value={destinationRoomId}
                onChange={(e) => setDestinationRoomId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="">-- Choose Target Room --</option>
                {rooms
                  .filter((r) => r._id !== currentRoomOfStudent?._id)
                  .map((r) => {
                    const isFull = r.currentOccupants >= r.capacity;
                    return (
                      <option key={r._id} value={r._id} disabled={isFull}>
                        Room {r.roomNumber} (Floor {r.floor}) — {r.currentOccupants}/{r.capacity} Occupied {isFull ? '❌ FULL' : `✅ ${r.capacity - r.currentOccupants} beds open`}
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Live Destination Room Preview */}
            {selectedDestinationRoom && (
              <div
                className={`p-3.5 rounded-xl border space-y-1.5 ${
                  selectedDestinationRoom.currentOccupants >= selectedDestinationRoom.capacity
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>Room {selectedDestinationRoom.roomNumber} Status:</span>
                  <span>{selectedDestinationRoom.status}</span>
                </div>
                <p className="text-[11px]">
                  Occupancy: {selectedDestinationRoom.currentOccupants} / {selectedDestinationRoom.capacity} beds • {selectedDestinationRoom.availableBeds} available.
                </p>
                {selectedDestinationRoom.currentOccupants >= selectedDestinationRoom.capacity && (
                  <p className="text-[11px] font-bold text-red-600">
                    Cannot transfer to this room because it is at 100% capacity. Please select another room.
                  </p>
                )}
              </div>
            )}

            {/* Reason input */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                Transfer Reason / Manager Notes:
              </label>
              <textarea
                rows={2}
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="e.g. Student requested relocation to Floor 2 due to course schedule..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>
        ) : (
          /* Confirmation Screen */
          <div className="space-y-4 text-xs py-2">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm">Confirm Room Transfer</p>
                <p className="text-[11px] mt-1 leading-relaxed">
                  You are about to transfer <strong>{studentToTransfer?.fullName}</strong> from <strong>Room {currentRoomOfStudent?.roomNumber}</strong> to <strong>Room {selectedDestinationRoom?.roomNumber} (Floor {selectedDestinationRoom?.floor})</strong>.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Resident:</span>
                <strong className="text-slate-900 dark:text-white">{studentToTransfer?.fullName} ({studentToTransfer?.studentId})</strong>
              </div>
              <div className="flex justify-between">
                <span>Previous Room:</span>
                <strong>Room {currentRoomOfStudent?.roomNumber}</strong>
              </div>
              <div className="flex justify-between text-blue-600 dark:text-blue-400">
                <span>New Room:</span>
                <strong>Room {selectedDestinationRoom?.roomNumber} (Floor {selectedDestinationRoom?.floor})</strong>
              </div>
              <div className="flex justify-between">
                <span>All Personal Data:</span>
                <span className="text-emerald-600 font-bold">CNIC, phone & fee history preserved</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Assign Bed */}
      <Modal
        isOpen={assignBedOpen}
        onClose={() => setAssignBedOpen(false)}
        title="Assign Bed to Resident"
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
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              Select Resident without Bed:
            </label>
            {availableStudents.length === 0 ? (
              <p className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                All active students currently have allocated beds. Register a new resident first to allocate this bed.
              </p>
            ) : (
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
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

      {/* Confirmation Modal: Vacate Bed */}
      <ConfirmationModal
        isOpen={vacateConfirmOpen}
        onClose={() => setVacateConfirmOpen(false)}
        onConfirm={handleVacateBed}
        title={`Vacate Bed ${bedToVacate?.bedNumber}?`}
        message={`This will remove resident ${bedToVacate?.currentStudent?.fullName || ''} from this bed and mark the bed as Available.`}
        confirmText="Vacate Bed"
        confirmVariant="danger"
      />

      {/* Modal: Add New Room */}
      <Modal
        isOpen={createRoomOpen}
        onClose={() => setCreateRoomOpen(false)}
        title="Add New Room"
        subtitle="Create a new room in the Royal Hostel database"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateRoomOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateRoom} loading={modalLoading}>
              Create Room
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Room Number (e.g. 105, 205):
            </label>
            <input
              type="text"
              required
              value={roomFormData.roomNumber}
              onChange={(e) => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })}
              placeholder="e.g. 105"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Floor:
              </label>
              <select
                value={roomFormData.floor}
                onChange={(e) =>
                  setRoomFormData({
                    ...roomFormData,
                    floor: Number(e.target.value),
                    block: `Floor ${e.target.value}`,
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value={1}>Floor 1</option>
                <option value={2}>Floor 2</option>
                <option value={3}>Floor 3</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Bed Capacity:
              </label>
              <input
                type="number"
                min={1}
                max={6}
                value={roomFormData.capacity}
                onChange={(e) =>
                  setRoomFormData({ ...roomFormData, capacity: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Monthly Fee ({settings.currency}):
            </label>
            <input
              type="number"
              value={roomFormData.monthlyFee}
              onChange={(e) => setRoomFormData({ ...roomFormData, monthlyFee: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Rooms;
