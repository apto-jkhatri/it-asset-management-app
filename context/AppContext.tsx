import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Asset, Employee, Assignment, MaintenanceLog, AssetRequest, AssetStatus } from '../types';
import * as Api from '../services/ApiService';
import { authService, AuthProfile } from '../services/AuthService';

interface AppContextType {
  assets: Asset[];
  employees: Employee[];
  assignments: Assignment[];
  maintenanceLogs: MaintenanceLog[];
  requests: AssetRequest[];
  loading: boolean;
  isAuthLoading: boolean;
  currentUser: AuthProfile | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addAsset: (asset: Asset) => void;
  addEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  updateAsset: (asset: Asset) => void;
  deleteAsset: (id: string) => void;
  assignAsset: (assetId: string, employeeId: string, expectedReturn?: string) => void;
  returnAsset: (assetId: string, notes?: string) => void;
  addMaintenanceLog: (log: MaintenanceLog) => void;
  updateMaintenanceLog: (id: string, status: 'In Progress' | 'Completed') => void;
  approveRequest: (requestId: string, assetId: string) => void;
  rejectRequest: (requestId: string) => void;
  createRequest: (req: AssetRequest) => void;
  updateRequest: (req: AssetRequest) => void;
  closeRequest: (requestId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const storedUser = authService.getCurrentUser();
        if (storedUser) {
          setCurrentUser(storedUser);
          setAccessToken(await authService.getToken());
        }
      } catch (error) {
        console.error("Failed to initialize auth", error);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        setEmployees([]);
        setAssets([]);
        setAssignments([]);
        setMaintenanceLogs([]);
        setRequests([]);
        return;
      }

      console.log(`[AppContext] Loading data for ${currentUser.role}...`);

      // All users can see assets and requests
      try {
        const assetsData = await Api.getAssets();
        setAssets(assetsData || []);
      } catch (e) {
        console.error("Failed to load assets", e);
      }

      try {
        const requestsData = await Api.getRequests();
        setRequests(requestsData || []);
      } catch (e) {
        console.error("Failed to load requests", e);
      }

      // Only admins fetch management data
      if (currentUser.role === 'admin') {
        try {
          const employeesData = await Api.getEmployees();
          setEmployees(employeesData || []);
        } catch (e) {
          console.error("Failed to load employees", e);
        }

        try {
          const assignmentsData = await Api.getAssignments();
          setAssignments(assignmentsData || []);
        } catch (e) {
          console.error("Failed to load assignments", e);
        }

        try {
          const maintenanceData = await Api.getMaintenance();
          setMaintenanceLogs(maintenanceData || []);
        } catch (e) {
          console.error("Failed to load maintenance", e);
        }
      }
    };
    loadData();
  }, [currentUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsAuthLoading(true);
    try {
      const response = await authService.login(email, password);
      if (response) {
        setCurrentUser(response.user);
        setAccessToken(response.token);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Login failed", e);
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setAccessToken(null);
  };

  const addAsset = (asset: Asset) => {
    setAssets(prev => [asset, ...prev]);
    Api.saveAsset(asset).catch(err => {
      console.error('Failed to save asset to API', err);
      setAssets(prev => prev.filter(a => a.id !== asset.id));
    });
  };
  const addEmployee = (employee: Employee) => {
    setEmployees(prev => [...prev, employee]);
    Api.saveEmployee(employee).catch(err => {
      console.error('Failed to save employee to API', err);
      setEmployees(prev => prev.filter(e => e.id !== employee.id));
    });
  };
  const deleteEmployee = (id: string) => {
    const original = employees.find(e => e.id === id);
    setEmployees(prev => prev.filter(e => e.id !== id));
    Api.deleteEmployee(id).catch(err => {
      console.error('Failed to delete employee', err);
      if (original) setEmployees(prev => [...prev, original]);
    });
  };
  const updateAsset = (updatedAsset: Asset) => {
    const original = assets.find(a => a.id === updatedAsset.id);
    setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    Api.saveAsset(updatedAsset).catch(err => {
      console.error('Failed to update asset', err);
      if (original) setAssets(prev => prev.map(a => a.id === updatedAsset.id ? original : a));
    });
  };
  const deleteAsset = (id: string) => {
    const original = assets.find(a => a.id === id);
    setAssets(prev => prev.filter(a => a.id !== id));
    Api.deleteAsset(id).catch(err => {
      console.error('Failed to delete asset', err);
      if (original) setAssets(prev => [...prev, original]);
    });
  };
  const assignAsset = (assetId: string, employeeId: string, expectedReturn?: string) => {
    const newAssignment: Assignment = {
      id: `ASG-${Date.now()}`,
      assetId,
      employeeId,
      borrowDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: expectedReturn,
      isActive: true,
    };
    const originalAsset = assets.find(a => a.id === assetId);
    setAssignments(prev => [newAssignment, ...prev]);
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: AssetStatus.ASSIGNED, assignedTo: employeeId } : a));

    Api.saveAssignment(newAssignment).catch(err => {
      console.error('Failed to save assignment', err);
      setAssignments(prev => prev.filter(a => a.id !== newAssignment.id));
    });

    if (originalAsset) {
      Api.saveAsset({ ...originalAsset, status: AssetStatus.ASSIGNED, assignedTo: employeeId }).catch(err => {
        console.error('Failed to update asset status', err);
        setAssets(prev => prev.map(a => a.id === assetId ? originalAsset : a));
      });
    }
  };
  const returnAsset = (assetId: string, notes?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const asset = assets.find(a => a.id === assetId);
    const assignment = assignments.find(a => a.assetId === assetId && a.isActive);

    const originalAsset = asset;
    const originalAssignment = assignment;

    setAssignments(prev => prev.map(a => (a.assetId === assetId && a.isActive) ? { ...a, isActive: false, returnedDate: today, notes: notes } : a));
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: AssetStatus.AVAILABLE, assignedTo: undefined } : a));

    if (assignment) {
      Api.saveAssignment({ ...assignment, isActive: false, returnedDate: today, notes: notes }).catch(err => {
        console.error('Failed to return assignment', err);
        setAssignments(prev => prev.map(a => a.id === assignment!.id ? originalAssignment! : a));
      });
    }
    if (asset) {
      Api.saveAsset({ ...asset, status: AssetStatus.AVAILABLE, assignedTo: undefined }).catch(err => {
        console.error('Failed to update asset on return', err);
        setAssets(prev => prev.map(a => a.id === assetId ? originalAsset! : a));
      });
    }
  };
  const addMaintenanceLog = (log: MaintenanceLog) => {
    const asset = assets.find(a => a.id === log.assetId);
    setMaintenanceLogs(prev => [log, ...prev]);
    setAssets(prev => prev.map(a => a.id === log.assetId ? { ...a, status: AssetStatus.IN_REPAIR } : a));

    Api.saveMaintenance(log).catch(err => {
      console.error('Failed to save maintenance log', err);
      setMaintenanceLogs(prev => prev.filter(m => m.id !== log.id));
    });

    if (asset) {
      Api.saveAsset({ ...asset, status: AssetStatus.IN_REPAIR }).catch(err => {
        console.error('Failed to update asset status for maintenance', err);
        setAssets(prev => prev.map(a => a.id === log.assetId ? asset : a));
      });
    }
  };
  const updateMaintenanceLog = (id: string, status: 'In Progress' | 'Completed') => {
    const log = maintenanceLogs.find(l => l.id === id);
    if (!log) return;

    const originalLog = log;
    const asset = assets.find(a => a.id === log.assetId);
    const originalAsset = asset;

    setMaintenanceLogs(prev => prev.map(l => l.id === id ? { ...l, status } : l));

    Api.saveMaintenance({ ...log, status }).catch(err => {
      console.error('Failed to update maintenance log', err);
      setMaintenanceLogs(prev => prev.map(l => l.id === id ? originalLog : l));
    });

    if (status === 'Completed' && asset) {
      const newStatus = asset.assignedTo ? AssetStatus.ASSIGNED : AssetStatus.AVAILABLE;
      setAssets(prev => prev.map(a => a.id === log.assetId ? { ...a, status: newStatus } : a));
      Api.saveAsset({ ...asset, status: newStatus }).catch(err => {
        console.error('Failed to update asset status', err);
        setAssets(prev => prev.map(a => a.id === log.assetId ? originalAsset! : a));
      });
    }
  };
  const createRequest = (req: AssetRequest) => {
    const enrichedReq = {
      ...req,
      userId: currentUser?.id,
      employeeId: currentUser?.employeeId || 'EMP-UNKNOWN',
      userName: currentUser?.name || 'You',
      userEmail: currentUser?.email || ''
    };
    setRequests(prev => [enrichedReq, ...prev]);
    Api.saveRequest(req).catch(err => {
      console.error('Failed to create request', err);
      setRequests(prev => prev.filter(r => r.id !== req.id));
    });
  };
  const updateRequest = (req: AssetRequest) => {
    const original = requests.find(r => r.id === req.id);
    setRequests(prev => prev.map(r => r.id === req.id ? req : r));
    Api.saveRequest(req).catch(err => {
      console.error('Failed to update request', err);
      if (original) setRequests(prev => prev.map(r => r.id === req.id ? original : r));
    });
  };
  const closeRequest = (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    const originalReq = req;
    const updatedReq = { ...req, status: 'Closed' as const };
    setRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));
    Api.saveRequest(updatedReq).catch(err => {
      console.error('Failed to close request', err);
      setRequests(prev => prev.map(r => r.id === requestId ? originalReq : r));
    });
  };
  const approveRequest = (requestId: string, assetId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    const originalReq = req;
    const updatedReq = { ...req, status: 'Approved' as const };
    setRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));
    assignAsset(assetId, req.employeeId);
    Api.saveRequest(updatedReq).catch(err => {
      console.error('Failed to approve request', err);
      setRequests(prev => prev.map(r => r.id === requestId ? originalReq : r));
    });
  };
  const rejectRequest = (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    const originalReq = req;
    const updatedReq = { ...req, status: 'Rejected' as const };
    setRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));
    Api.saveRequest(updatedReq).catch(err => {
      console.error('Failed to reject request', err);
      setRequests(prev => prev.map(r => r.id === requestId ? originalReq : r));
    });
  };

  return (
    <AppContext.Provider value={{
      assets, employees, assignments, maintenanceLogs, requests,
      loading, isAuthLoading, currentUser, accessToken,
      login, logout, addAsset, addEmployee, deleteEmployee, updateAsset, deleteAsset,
      assignAsset, returnAsset, addMaintenanceLog, updateMaintenanceLog,
      approveRequest, rejectRequest, createRequest, updateRequest, closeRequest
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};