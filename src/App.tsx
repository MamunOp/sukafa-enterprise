import React, { useState, useEffect } from 'react';
import { UserRole, CurrentUser, Lead, LeadStatus, CruxStatus, StageIApplication, StageIIBankLoan } from './types';
import { getDatabase, saveDatabase, addActivityLog, exportLeadsToCSV, updateLead, deleteLead } from './store';
import Login from './components/Login';
import LeadDetailsModal from './components/LeadDetailsModal';
import LeadFormModal from './components/LeadFormModal';
import AgentManager from './components/AgentManager';
import EmployeeManager from './components/EmployeeManager';
import ReportsView from './components/ReportsView';
import ActivityLogView from './components/ActivityLogView';

// Icons
import {
  Shield,
  Briefcase,
  UserCheck,
  LogOut,
  FolderOpen,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Settings,
  Database,
  Users,
  Activity,
  BarChart,
  FileSpreadsheet,
  Grid,
  List,
  Flame,
  AlertCircle,
  HelpCircle,
  ArrowUpDown,
  Trash2,
  CheckCircle,
  Check
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    // Check if session exists in memory / storage
    const savedUser = localStorage.getItem('lead_system_active_session');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [db, setDb] = useState(getDatabase());
  const [selectedTab, setSelectedTab] = useState<'leads' | 'agents' | 'employees' | 'reports' | 'logs'>('leads');

  // Leads filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [viewStyle, setViewStyle] = useState<'table' | 'cards'>('table');
  const [sortField, setSortField] = useState<'name' | 'budget' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Real-time auto-saving notification states and inline logic
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleInlineFieldChange = (leadId: string, field: string, value: any) => {
    if (!currentUser) return;
    setSaveStatus('saving');
    try {
      updateLead(leadId, { [field]: value }, currentUser);
      // Wait, let's write a quiet database refresh so that we keep lists reactive
      setDb(getDatabase());
      setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1000);
      }, 250);
    } catch (err: any) {
      console.error(err);
      setSaveStatus('idle');
    }
  };

  const handleInlineFieldChanges = (leadId: string, updates: Partial<Lead>) => {
    if (!currentUser) return;
    setSaveStatus('saving');
    try {
      updateLead(leadId, updates, currentUser);
      setDb(getDatabase());
      setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1000);
      }, 250);
    } catch (err: any) {
      console.error(err);
      setSaveStatus('idle');
    }
  };

  const isStageIReasonMissing = (lead: Lead) => {
    // Stage I - Reason for Pending/Not Starting is mandatory if CRUX Status is not Completed or Stage I Application is not Approved.
    const isCompletedOrApproved = lead.cruxStatus === CruxStatus.Completed || lead.stageIApplication === StageIApplication.ApplicationApproved;
    return !isCompletedOrApproved && (!lead.stageIReason || lead.stageIReason.trim() === '');
  };

  // Sync state from LocalStorage on mount
  useEffect(() => {
    setDb(getDatabase());
    const savedUser = localStorage.getItem('lead_system_active_session');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as CurrentUser;
        if (parsed.role === UserRole.Admin) {
          setSelectedTab('agents');
        }
      } catch (e) {}
    }
  }, []);

  // Save session state helper
  const handleLoginSuccess = (user: CurrentUser) => {
    setCurrentUser(user);
    localStorage.setItem('lead_system_active_session', JSON.stringify(user));
    // Set landing tabs on login
    if (user.role === UserRole.Admin) {
      setSelectedTab('agents');
    } else if (user.role === UserRole.Employee) {
      setSelectedTab('leads');
    } else if (user.role === UserRole.Agent) {
      setSelectedTab('leads');
    }
    setDb(getDatabase());
  };

  const handleLogout = () => {
    if (currentUser) {
      addActivityLog(currentUser.id, currentUser.name, currentUser.role, 'Logged Out', 'Portal session finished');
    }
    setCurrentUser(null);
    localStorage.removeItem('lead_system_active_session');
  };

  const refreshDatabase = () => {
    setDb(getDatabase());
  };

  // ----------------------------------------------------
  // FILTERING AND SORTING DATA DESK
  // ----------------------------------------------------
  const getFilteredLeads = (): Lead[] => {
    if (!currentUser) return [];

    let leadsList = [...db.leads];

    // 1. Role boundaries filter
    if (currentUser.role === UserRole.Agent) {
      // Agents only tracker their own referred customers!
      leadsList = leadsList.filter(l => l.agentId === currentUser.id);
    } // Employees have "View all leads" permission and can access the entire catalog now!

    // 2. Search query matches name, mobile, email, requirements, or agent name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      leadsList = leadsList.filter(l => 
        l.customerName.toLowerCase().includes(q) ||
        l.customerPhone.includes(q) ||
        (l.customerEmail && l.customerEmail.toLowerCase().includes(q)) ||
        (l.agentName && l.agentName.toLowerCase().includes(q)) ||
        l.requirements.toLowerCase().includes(q)
      );
    }

    // 3. Dropdown status filter
    if (statusFilter !== 'all') {
      leadsList = leadsList.filter(l => l.status === statusFilter);
    }

    // 4. Admin level employee assignee filter
    if (currentUser.role === UserRole.Admin && employeeFilter !== 'all') {
      if (employeeFilter === 'unassigned') {
        leadsList = leadsList.filter(l => !l.employeeId);
      } else {
        leadsList = leadsList.filter(l => l.employeeId === employeeFilter);
      }
    }

    // 5. Admin & Employee level agent source filter
    if ((currentUser.role === UserRole.Admin || currentUser.role === UserRole.Employee) && agentFilter !== 'all') {
      if (agentFilter === 'direct') {
        leadsList = leadsList.filter(l => !l.agentId);
      } else {
        leadsList = leadsList.filter(l => l.agentId === agentFilter);
      }
    }

    // Sort evaluation
    leadsList.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.customerName.localeCompare(b.customerName);
      } else if (sortField === 'budget') {
        comparison = a.budget - b.budget;
      } else if (sortField === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return leadsList;
  };

  const triggerSort = (field: 'name' | 'budget' | 'date') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    const list = getFilteredLeads();
    const csvContent = exportLeadsToCSV(list);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status badges color map
  const getStatusBadge = (s: LeadStatus) => {
    switch (s) {
      case LeadStatus.New:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case LeadStatus.Contacted:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case LeadStatus.InProgress:
        return 'bg-amber-50 text-amber-750 border-amber-200';
      case LeadStatus.DocumentPending:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case LeadStatus.Submitted:
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case LeadStatus.Approved:
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case LeadStatus.Rejected:
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getCruxStatusBadge = (status: CruxStatus) => {
    switch (status) {
      case CruxStatus.Completed:
        return 'bg-emerald-50 text-emerald-800 border-emerald-250 font-bold';
      case CruxStatus.Rejected:
        return 'bg-rose-50 text-rose-800 border-rose-250 font-bold';
      case CruxStatus.InProgress:
        return 'bg-indigo-50 text-indigo-800 border-indigo-250 font-bold';
      case CruxStatus.OnHold:
        return 'bg-amber-50 text-amber-800 border-amber-250 font-bold';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 font-semibold';
    }
  };

  const getStageIBadge = (stage: StageIApplication) => {
    switch (stage) {
      case StageIApplication.ApplicationApproved:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
      case StageIApplication.ApplicationRejected:
        return 'bg-rose-50 text-rose-800 border-rose-200 font-bold';
      case StageIApplication.ApplicationUnderProcess:
      case StageIApplication.ApplicationSubmitted:
        return 'bg-blue-50 text-blue-800 border-blue-200 font-bold';
      case StageIApplication.DocumentsReceived:
        return 'bg-indigo-50 text-indigo-800 border-indigo-200 font-bold';
      case StageIApplication.DocumentsPending:
        return 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
      default:
        return 'bg-slate-50 text-slate-655 border-slate-200 font-semibold';
    }
  };

  const getStageIIBadge = (stage: StageIIBankLoan) => {
    switch (stage) {
      case StageIIBankLoan.Disbursed:
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      case StageIIBankLoan.Sanctioned:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
      case StageIIBankLoan.Rejected:
        return 'bg-rose-50 text-rose-800 border-rose-200 font-bold';
      case StageIIBankLoan.LoanApplicationSubmitted:
      case StageIIBankLoan.UnderVerification:
        return 'bg-blue-50 text-blue-800 border-blue-200 font-semibold';
      default:
        return 'bg-slate-50 text-slate-655 border-slate-200 font-semibold';
    }
  };

  // If not logged in, show login page
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const processedLeads = getFilteredLeads();

  // Agent Specific Referral sums
  const totalOwnLeadVolumeByAgent = db.leads
    .filter(l => l.agentId === currentUser.id)
    .reduce((sum, item) => sum + item.budget, 0);

  const totalOwnApprovedLeadVolumeByAgent = db.leads
    .filter(l => l.agentId === currentUser.id && l.status === LeadStatus.Approved)
    .reduce((sum, item) => sum + item.budget, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* 1. TOP PORTAL NAVIGATION HEADER */}
      <header className="bg-slate-900 border-b border-white-5 shadow-md flex-shrink-0 z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo Mark */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-md shadow border border-indigo-500">
                L
              </div>
              <div>
                <span className="text-sm font-bold text-white tracking-tight block font-sans">
                  Lead Track Hub
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                  {currentUser.role === UserRole.Admin && 'System Director Panel'}
                  {currentUser.role === UserRole.Employee && 'Processor Desk Workspace'}
                  {currentUser.role === UserRole.Agent && 'Referral Partner Desk'}
                </span>
              </div>
            </div>

            {/* User Session Profile details */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-white leading-none mb-1">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none font-mono">
                  {currentUser.role} Account
                </div>
              </div>

              {/* Log out trigger button */}
              <button
                id="portal-logout-btn"
                onClick={handleLogout}
                className="inline-flex items-center space-x-1 p-2 bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-white-5 cursor-pointer transition-all"
                title="Logout Session"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 2. MAIN HUB CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        {/* NAV WORKSPACE NAVIGATION MENU (SIDEBAR) */}
        <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-2">
          
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 font-mono">
            Portal Operations
          </div>

          {currentUser.role !== UserRole.Admin && (
            <button
              id="nav-tab-leads"
              onClick={() => setSelectedTab('leads')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                selectedTab === 'leads'
                  ? 'bg-slate-900 text-white shadow-sm border border-slate-900'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <FolderOpen className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">Leads Directory</span>
              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
                {currentUser.role === UserRole.Employee 
                  ? db.leads.filter(l => l.employeeId === currentUser.id).length
                  : db.leads.filter(l => l.agentId === currentUser.id).length
                }
              </span>
            </button>
          )}

          {/* ADMIN EXCLUSIVE PANEL OPTIONS */}
          {currentUser.role === UserRole.Admin && (
            <>
              <button
                id="nav-tab-agents"
                onClick={() => setSelectedTab('agents')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                  selectedTab === 'agents'
                    ? 'bg-slate-900 text-white shadow-sm border border-slate-900'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="flex-1">Manage Agents</span>
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
                  {db.agents.length}
                </span>
              </button>

              <button
                id="nav-tab-employees"
                onClick={() => setSelectedTab('employees')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                  selectedTab === 'employees'
                    ? 'bg-slate-900 text-white shadow-sm border border-slate-900'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span className="flex-1">Manage Employee</span>
              </button>

              <button
                id="nav-tab-reports"
                onClick={() => setSelectedTab('reports')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                  selectedTab === 'reports'
                    ? 'bg-slate-900 text-white shadow-sm border border-slate-900'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <BarChart className="w-4 h-4" />
                <span>Performance Reports</span>
              </button>

              <button
                id="nav-tab-logs"
                onClick={() => setSelectedTab('logs')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                  selectedTab === 'logs'
                    ? 'bg-slate-900 text-white shadow-sm border border-slate-900'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Security Audit Logs</span>
              </button>
            </>
          )}

          {/* QUICK CREDENTIALS TOUR INFORMATION BLOCK */}
          <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-xs font-semibold text-indigo-700 text-left space-y-2">
            <h4 className="flex items-center space-x-1 uppercase text-[10px] tracking-wider font-bold">
              <Database className="w-3.5 h-3.5" />
              <span>Durable Local Engine</span>
            </h4>
            <p className="text-slate-500 font-medium leading-relaxed">
              Every data creation, password reset, log notation and document attachment is saved immediately inside local storage persistence. Mock lists are seeded automatically.
            </p>
          </div>

        </aside>

        {/* VIEWPORTS EXPANSION AREA */}
        <section className="flex-1 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col min-h-[500px]">
          
          {/* TAB: LEADS VIEW CONTROL SCREEN */}
          {selectedTab === 'leads' && (
            <div className="space-y-6 flex flex-col h-full text-left">
              
              {/* HEADING PANEL */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5 gap-4">
                <div>
                  <h2 className="text-xl font-bold font-sans tracking-tight text-slate-950">Customer Inquiries Directory</h2>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    {currentUser.role === UserRole.Admin && 'Admin controls: Monitor conversion cycles, delegate portfolios, update billing rates, and launch reports.'}
                    {currentUser.role === UserRole.Employee && 'Processor controls: Review assigned applicants, upload vetting files, update stages, and write remarks.'}
                    {currentUser.role === UserRole.Agent && 'Referral controls: Track payouts, review conversion statuses, check remarks, or submit new cases.'}
                  </p>
                </div>

                {/* Submitting lead trigger button (accessible to Admin, Employee, and Agent) */}
                <button
                  id="create-lead-trigger"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm ml-auto sm:ml-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{currentUser.role === UserRole.Agent ? 'Refer New Customer' : 'Add New Customer'}</span>
                </button>
              </div>

              {/* AGENT STAT CARDS INTAKE HUD */}
              {currentUser.role === UserRole.Agent && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100 pb-5">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400 leading-none">Total Value Referred</div>
                    <div className="text-lg font-bold text-slate-900 mt-1 font-mono">${totalOwnLeadVolumeByAgent.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400 leading-none">Successful Conversions</div>
                    <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                      {db.leads.filter(l => l.agentId === currentUser.id && l.status === LeadStatus.Approved).length} deals approved
                    </div>
                  </div>
                </div>
              )}

              {/* SEARCH & FILTERS CONTROLS */}
              <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  
                  {/* Search bar */}
                  <div className="relative flex-1 bg-white">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      id="lead-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search customers by name, phone core, requirements..."
                      className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 bg-white text-slate-950 placeholder-slate-400 rounded-lg focus:outline-none focus:border-slate-800"
                    />
                  </div>

                  {/* Status Dropdown Filter */}
                  <div className="relative w-full sm:w-48 bg-white text-left">
                    <select
                      id="status-filter-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none Focus:border-slate-800 cursor-pointer"
                    >
                      <option value="all">-- All Statuses ({db.leads.length}) --</option>
                      {Object.values(LeadStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Administrative & Employee subfilters */}
                {(currentUser.role === UserRole.Admin || currentUser.role === UserRole.Employee) && (
                  <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-3">
                    
                    {/* Agent select */}
                    <div className="flex items-center space-x-1 text-xs">
                      <span className="text-slate-400 font-semibold font-mono">Agent Partner:</span>
                      <select
                        id="agent-filter-select"
                        value={agentFilter}
                        onChange={(e) => setAgentFilter(e.target.value)}
                        className="font-semibold bg-white border border-slate-200 rounded-lg py-1 px-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Referrals</option>
                        <option value="direct">Direct Traffic Only</option>
                        {db.agents.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>

                  </div>
                )}

                {/* METRICS & LIST DETAILS TOGGLE ROW */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-400 font-medium">
                  <div className="flex items-center space-x-3">
                    <span>
                      Matching results: <span className="font-bold text-slate-800">{processedLeads.length} customers found</span>
                    </span>
                    {saveStatus !== 'idle' && (
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        saveStatus === 'saving' ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse' : 'bg-emerald-50 text-emerald-800 border border-emerald-250 font-semibold'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saving' ? 'bg-amber-600 animate-ping' : 'bg-emerald-600'}`} />
                        <span>{saveStatus === 'saving' ? 'Saving to Engine...' : 'Engine Synced!'}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Export helper */}
                    <button
                      id="export-csv-btn"
                      onClick={handleExportCSV}
                      className="inline-flex items-center space-x-1 hover:text-slate-800 font-bold uppercase text-[10px] tracking-wider cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV Spreadsheet</span>
                    </button>

                    {/* View style toggle */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                      <button
                        onClick={() => setViewStyle('table')}
                        className={`p-1 rounded transition-all cursor-pointer ${viewStyle === 'table' ? 'bg-slate-250 text-slate-800' : 'text-slate-450 hover:text-slate-800'}`}
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewStyle('cards')}
                        className={`p-1 rounded transition-all cursor-pointer ${viewStyle === 'cards' ? 'bg-slate-250 text-slate-800' : 'text-slate-450 hover:text-slate-800'}`}
                      >
                        <Grid className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIST VIEWER */}
              <div className="flex-1 overflow-hidden">
                {processedLeads.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl font-medium text-slate-400">
                    No customers match your search filters.
                  </div>
                ) : viewStyle === 'table' ? (
                  /* TABULAR LIST */
                  <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-md bg-white">
                    <table className="min-w-[1750px] text-xs text-left border-collapse bg-white table-fixed">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800 text-[10px] font-bold text-slate-200 uppercase tracking-widest font-sans">
                          <th className="px-3 py-3 w-16 text-center">SL No</th>
                          <th className="px-3 py-3 w-48 cursor-pointer select-none hover:text-white" onClick={() => triggerSort('name')}>
                            <div className="flex items-center space-x-1">
                              <span>Customer Name</span>
                              <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </th>
                          <th className="px-3 py-3 w-36">Registered Phone</th>
                          <th className="px-3 py-3 w-36">Consumer No</th>
                          <th className="px-3 py-3 w-52">Residential/Service Address</th>
                          <th className="px-3 py-3 w-40">CRUX Status</th>
                          <th className="px-3 py-3 w-48 font-semibold">Stage I - Application</th>
                          <th className="px-3 py-3 w-64 text-indigo-200">Stage I - Reason for Pending/Not Starting</th>
                          <th className="px-3 py-3 w-48">Stage II - Bank Loan</th>
                          <th className="px-3 py-3 w-64 text-emerald-200">Stage II - Remarks / Pending / Rejections</th>
                          <th className="px-3 py-3 w-40">Action Date</th>
                          <th className="px-3 py-3 w-32">Last Updated</th>
                          <th className="px-3 py-3 w-40">Referred Agent</th>
                          <th className="px-3 py-3 w-28 text-right pr-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-850">
                        {processedLeads.map((item, index) => {
                          const isReasonNeeded = isStageIReasonMissing(item);
                          const isAgent = currentUser.role === UserRole.Agent;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                              {/* 1. SL No */}
                              <td className="px-3 py-2.5 text-center bg-slate-50/50 font-bold font-mono text-slate-500 text-[11px]">
                                {index + 1}
                              </td>

                              {/* 2. Customer Name */}
                              <td className="px-3 py-2.5">
                                {isAgent ? (
                                  <div className="font-bold text-slate-950 px-1.5 py-1 truncate leading-tight" title={item.customerName}>
                                    {item.customerName}
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    value={item.customerName}
                                    onChange={(e) => handleInlineFieldChange(item.id, 'customerName', e.target.value)}
                                    className="w-full bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-slate-900 rounded px-1.5 py-1 font-bold text-slate-900 border border-transparent transition-all truncate"
                                  />
                                )}
                              </td>

                              {/* 3. Registered Phone */}
                              <td className="px-3 py-2.5">
                                {isAgent ? (
                                  <div className="font-mono text-xs text-slate-800 px-1.5 py-1">
                                    {item.customerPhone}
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    value={item.customerPhone}
                                    onChange={(e) => handleInlineFieldChange(item.id, 'customerPhone', e.target.value)}
                                    className="w-full bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-slate-900 rounded px-1.5 py-1 font-mono text-xs border border-transparent transition-all text-slate-800"
                                  />
                                )}
                              </td>

                              {/* 4. Consumer No */}
                              <td className="px-3 py-2.5">
                                {isAgent ? (
                                  <div className="font-mono text-xs text-indigo-900 font-bold px-1.5 py-1">
                                    {item.consumerNo || <span className="text-slate-300 italic font-normal">None</span>}
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    value={item.consumerNo || ''}
                                    placeholder="CON-XXXXXX"
                                    onChange={(e) => handleInlineFieldChange(item.id, 'consumerNo', e.target.value)}
                                    className="w-full bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-slate-900 rounded px-1.5 py-1 font-mono text-xs border border-transparent transition-all text-indigo-900 font-semibold"
                                  />
                                )}
                              </td>

                              {/* 5. Address */}
                              <td className="px-3 py-2.5">
                                {isAgent ? (
                                  <div className="text-xs text-slate-700 px-1.5 py-1 truncate" title={item.address}>
                                    {item.address || <span className="text-slate-300 italic">None</span>}
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    value={item.address || ''}
                                    placeholder="Residence address"
                                    onChange={(e) => handleInlineFieldChange(item.id, 'address', e.target.value)}
                                    className="w-full bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-slate-900 rounded px-1.5 py-1 text-xs border border-transparent transition-all text-slate-700 font-normal"
                                  />
                                )}
                              </td>

                              {/* 6. CRUX Status */}
                              <td className="px-3 py-2.5">
                                {isAgent ? (
                                  <div className="px-1.5 py-1">
                                    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getCruxStatusBadge(item.cruxStatus || CruxStatus.NotStarted)}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        item.cruxStatus === CruxStatus.Completed ? 'bg-emerald-500' :
                                        item.cruxStatus === CruxStatus.Rejected ? 'bg-rose-500' :
                                        item.cruxStatus === CruxStatus.InProgress ? 'bg-indigo-500' :
                                        item.cruxStatus === CruxStatus.OnHold ? 'bg-amber-500' : 'bg-slate-400'
                                      }`} />
                                      <span>{item.cruxStatus || CruxStatus.NotStarted}</span>
                                    </span>
                                  </div>
                                ) : (
                                  <select
                                    value={item.cruxStatus || CruxStatus.NotStarted}
                                    onChange={(e) => {
                                      const val = e.target.value as CruxStatus;
                                      const updates: Partial<Lead> = { cruxStatus: val };
                                      if (val === CruxStatus.Completed) {
                                        updates.status = LeadStatus.Approved;
                                        updates.stageIApplication = StageIApplication.ApplicationApproved;
                                        updates.stageIIBankLoan = StageIIBankLoan.Disbursed;
                                        if (!item.loanActionDate) {
                                          updates.loanActionDate = new Date().toISOString().split('T')[0];
                                        }
                                      } else if (val === CruxStatus.Rejected) {
                                        updates.status = LeadStatus.Rejected;
                                        updates.stageIApplication = StageIApplication.ApplicationRejected;
                                        updates.stageIIBankLoan = StageIIBankLoan.Rejected;
                                      } else if (val === CruxStatus.InProgress) {
                                        updates.status = LeadStatus.InProgress;
                                      }
                                      handleInlineFieldChanges(item.id, updates);
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
                                  >
                                    {Object.values(CruxStatus).map((cs) => (
                                      <option key={cs} value={cs}>{cs}</option>
                                    ))}
                                  </select>
                                )}
                              </td>

                              {/* 7. Stage I - Application */}
                              <td className="px-3 py-2.5">
                                {isAgent ? (
                                  <div className="px-1.5 py-1">
                                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-lg border ${getStageIBadge(item.stageIApplication || StageIApplication.NotStarted)}`}>
                                      {item.stageIApplication || StageIApplication.NotStarted}
                                    </span>
                                  </div>
                                ) : (
                                  <select
                                    value={item.stageIApplication || StageIApplication.NotStarted}
                                    onChange={(e) => {
                                      const val = e.target.value as StageIApplication;
                                      const updates: Partial<Lead> = { stageIApplication: val };
                                      if (val === StageIApplication.ApplicationApproved) {
                                        if (item.cruxStatus !== CruxStatus.Completed) {
                                          if (item.stageIIBankLoan === StageIIBankLoan.Disbursed || item.stageIIBankLoan === StageIIBankLoan.Sanctioned) {
                                            updates.cruxStatus = CruxStatus.Completed;
                                            updates.status = LeadStatus.Approved;
                                          }
                                        }
                                      } else if (val === StageIApplication.ApplicationRejected) {
                                        updates.cruxStatus = CruxStatus.Rejected;
                                        updates.status = LeadStatus.Rejected;
                                      }
                                      handleInlineFieldChanges(item.id, updates);
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
                                  >
                                    {Object.values(StageIApplication).map((sa) => (
                                      <option key={sa} value={sa}>{sa}</option>
                                    ))}
                                  </select>
                                )}
                              </td>

                              {/* 8. Stage I - Reason / Pending */}
                              <td className="px-3 py-2.5">
                                {isAgent ? (
                                  <div className="px-1.5 py-1">
                                    {item.stageIReason ? (
                                      <div className="text-xs text-slate-600 italic leading-snug whitespace-normal max-h-12 overflow-y-auto" title={item.stageIReason}>
                                        {item.stageIReason}
                                      </div>
                                    ) : (
                                      <span className="text-slate-300 italic">-</span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <input
                                      type="text"
                                      value={item.stageIReason || ''}
                                      placeholder="Brief pending/not-started reasons..."
                                      onChange={(e) => handleInlineFieldChange(item.id, 'stageIReason', e.target.value)}
                                      className={`w-full text-xs rounded px-1.5 py-1 border transition-all focus:outline-none focus:ring-1 ${
                                        isReasonNeeded
                                          ? 'border-rose-400 bg-rose-50 hover:bg-rose-55 text-rose-950 font-medium placeholder-rose-300 focus:ring-rose-500'
                                          : 'border-transparent bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-slate-900'
                                      }`}
                                    />
                                    {isReasonNeeded && (
                                      <div className="text-[9px] font-bold text-rose-600 pl-1 leading-none">
                                        * Mandatory details needed
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* 9. Stage II - Bank Loan */}
                              <td className="px-3 py-2.5">
                                {isAgent ? (
                                  <div className="px-1.5 py-1">
                                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-lg border ${getStageIIBadge(item.stageIIBankLoan || StageIIBankLoan.NotStarted)}`}>
                                      {item.stageIIBankLoan || StageIIBankLoan.NotStarted}
                                    </span>
                                  </div>
                                ) : (
                                  <select
                                    value={item.stageIIBankLoan || StageIIBankLoan.NotStarted}
                                    onChange={(e) => {
                                      const val = e.target.value as StageIIBankLoan;
                                      const updates: Partial<Lead> = { stageIIBankLoan: val };
                                      if (val === StageIIBankLoan.Disbursed || val === StageIIBankLoan.Sanctioned) {
                                        if (item.stageIApplication === StageIApplication.ApplicationApproved) {
                                          updates.cruxStatus = CruxStatus.Completed;
                                          updates.status = LeadStatus.Approved;
                                        }
                                        if (!item.loanActionDate) {
                                          updates.loanActionDate = new Date().toISOString().split('T')[0];
                                        }
                                      } else if (val === StageIIBankLoan.Rejected) {
                                        updates.cruxStatus = CruxStatus.Rejected;
                                        updates.status = LeadStatus.Rejected;
                                      }
                                      handleInlineFieldChanges(item.id, updates);
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
                                  >
                                    {Object.values(StageIIBankLoan).map((sb) => (
                                      <option key={sb} value={sb}>{sb}</option>
                                    ))}
                                  </select>
                                )}
                              </td>

                              {/* 10. Stage II - Remarks / Reason */}
                              <td className="px-3 py-2.5">
                                {isAgent ? (
                                  <div className="px-1.5 py-1">
                                    {item.stageIIReason ? (
                                      <div className="text-xs text-slate-600 italic leading-snug whitespace-normal max-h-12 overflow-y-auto" title={item.stageIIReason}>
                                        {item.stageIIReason}
                                      </div>
                                    ) : (
                                      <span className="text-slate-300 italic">-</span>
                                    )}
                                  </div>
                                ) : (
                                  <textarea
                                    value={item.stageIIReason || ''}
                                    placeholder="Disbursement conditions, rejection grounds or general remarks..."
                                    onChange={(e) => handleInlineFieldChange(item.id, 'stageIIReason', e.target.value)}
                                    rows={1}
                                    className="w-full text-xs bg-transparent hover:bg-slate-105 focus:bg-white border hover:border-slate-200 border-transparent rounded px-1.5 py-1 focus:ring-1 focus:ring-slate-900 resize-none h-7 overflow-y-auto"
                                  />
                                )}
                              </td>

                              {/* 11. Loan Action Date */}
                              <td className="px-3 py-2.5">
                                {isAgent ? (
                                  <div className="px-1.5 py-1 font-mono text-xs text-slate-700">
                                    {item.loanActionDate || <span className="text-slate-300">-</span>}
                                  </div>
                                ) : (
                                  <input
                                    type="date"
                                    value={item.loanActionDate || ''}
                                    onChange={(e) => handleInlineFieldChange(item.id, 'loanActionDate', e.target.value)}
                                    className="w-full border border-slate-200 bg-white hover:bg-slate-50 focus:bg-white rounded px-2 py-1 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                                  />
                                )}
                              </td>

                              {/* 12. Last Updated */}
                              <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500 leading-normal font-semibold">
                                {new Date(item.updatedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}{' '}
                                {new Date(item.updatedAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                })}
                              </td>

                              {/* 13. Referrer Partner Assign */}
                              <td className="px-3 py-2.5">
                                {isAgent ? (
                                  <div className="font-bold text-slate-700 px-1.5 py-1 text-xs">
                                    {item.agentName || <span className="text-slate-350 font-normal">Direct</span>}
                                  </div>
                                ) : (
                                  <select
                                    value={item.agentId || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const matchedAg = db.agents.find(a => a.id === val);
                                      const updates: Partial<Lead> = {
                                        agentId: val || undefined,
                                        agentName: matchedAg ? matchedAg.name : undefined,
                                        agentContact: matchedAg ? matchedAg.phone : undefined
                                      };
                                      handleInlineFieldChanges(item.id, updates);
                                    }}
                                    className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded px-1.5 py-1 text-[11px] font-bold cursor-pointer text-slate-700 font-sans"
                                  >
                                    <option value="">Direct / Walk-in</option>
                                    {db.agents.map((ag) => (
                                      <option key={ag.id} value={ag.id}>{ag.name}</option>
                                    ))}
                                  </select>
                                )}
                              </td>

                              {/* 14. Actions */}
                              <td className="px-3 py-2.5 text-right space-x-1 pr-4">
                                <button
                                  onClick={() => setSelectedLeadId(item.id)}
                                  className="p-1 hover:text-slate-900 text-slate-400 hover:bg-slate-100 rounded-lg transition-all cursor-pointer inline-block"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {!isAgent && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to permanently delete customer lead for "${item.customerName}"?`)) {
                                        deleteLead(item.id, currentUser);
                                        setDb(getDatabase());
                                      }
                                    }}
                                    className="p-1 hover:text-rose-600 text-slate-400 hover:bg-rose-50 rounded-lg transition-all cursor-pointer inline-block"
                                    title="Delete Lead"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* BENTO GRID OF DETAIL CARDS */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[500px]">
                    {processedLeads.map((item) => (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-sm transition-all space-y-4">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Customer Inquiry</span>
                              <h4 className="font-bold text-slate-900 text-sm mt-0.5">{item.customerName}</h4>
                              <div className="text-[10px] font-semibold text-slate-400 mt-0.5 font-mono">{item.customerPhone}</div>
                            </div>
                            <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-2.5">
                            <div>
                              <div className="text-slate-400 font-semibold text-[10px] uppercase">Service Sought</div>
                              <div className="font-bold text-slate-800 truncate mt-0.5">{item.requirements}</div>
                            </div>
                            <div>
                              <div className="text-slate-400 font-semibold text-[10px] uppercase">Amount Needed</div>
                              <div className="font-bold text-slate-950 truncate mt-0.5">${item.budget.toLocaleString()}</div>
                            </div>
                          </div>

                          {/* Dynamic detailed tracking states block */}
                          <div className="bg-slate-50/80 rounded-lg p-3 space-y-2.5 text-[11px] border border-slate-150">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Consumer No</span>
                                <span className="font-mono font-bold text-indigo-950 block mt-0.5">{item.consumerNo || 'CON-None'}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">CRUX Status</span>
                                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 mt-0.5 text-[9px] uppercase font-bold rounded-full border ${getCruxStatusBadge(item.cruxStatus || CruxStatus.NotStarted)}`}>
                                  <span className={`w-1 h-1 rounded-full ${
                                    item.cruxStatus === CruxStatus.Completed ? 'bg-emerald-500' :
                                    item.cruxStatus === CruxStatus.Rejected ? 'bg-rose-500' :
                                    item.cruxStatus === CruxStatus.InProgress ? 'bg-indigo-500' :
                                    item.cruxStatus === CruxStatus.OnHold ? 'bg-amber-500' : 'bg-slate-400'
                                  }`} />
                                  <span>{item.cruxStatus || CruxStatus.NotStarted}</span>
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 border-t border-slate-150/60 pt-2">
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Stage I - App</span>
                                <span className={`inline-flex px-1.5 py-0.5 mt-0.5 text-[9px] rounded-md border ${getStageIBadge(item.stageIApplication || StageIApplication.NotStarted)}`}>
                                  {item.stageIApplication || StageIApplication.NotStarted}
                                </span>
                                {item.stageIReason && (
                                  <div className="text-[10px] text-rose-800 italic mt-1 leading-snug bg-rose-50/50 p-1.5 rounded border border-rose-100 font-medium">
                                    Reason: {item.stageIReason}
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Stage II - Loan</span>
                                <span className={`inline-flex px-1.5 py-0.5 mt-0.5 text-[9px] rounded-md border ${getStageIIBadge(item.stageIIBankLoan || StageIIBankLoan.NotStarted)}`}>
                                  {item.stageIIBankLoan || StageIIBankLoan.NotStarted}
                                </span>
                                {item.stageIIReason && (
                                  <div className="text-[10px] text-slate-700 italic mt-1 leading-snug bg-slate-100 p-1.5 rounded border border-slate-200">
                                    Remarks: {item.stageIIReason}
                                  </div>
                                )}
                                {item.loanActionDate && (
                                  <div className="text-[9px] text-slate-500 font-mono mt-1 font-bold">
                                    Action: {item.loanActionDate}
                                  </div>
                                )}
                              </div>
                            </div>

                            {item.address && (
                              <div className="border-t border-slate-150/60 pt-2">
                                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Residential/Service Address</span>
                                <span className="text-[10px] text-slate-700 font-semibold leading-relaxed block mt-0.5">{item.address}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs mt-3">
                          <div className="text-slate-450 font-semibold">
                            {item.agentName ? (
                              <span>Referred by: <strong className="text-slate-700 font-bold">{item.agentName}</strong></span>
                            ) : (
                              <span className="italic">Onboarded directly</span>
                            )}
                          </div>
                          
                          <button
                            onClick={() => setSelectedLeadId(item.id)}
                            className="inline-flex items-center space-x-1.5 py-1 px-2.5 bg-slate-900 text-white hover:bg-slate-800 font-bold text-[10px] uppercase rounded-lg cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Desk Controls</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ADMIN MANAGEMENT TABS */}
          {currentUser.role === UserRole.Admin && (
            <>
              {selectedTab === 'agents' && <AgentManager currentUser={currentUser} />}
              {selectedTab === 'employees' && <EmployeeManager currentUser={currentUser} />}
              {selectedTab === 'reports' && <ReportsView />}
              {selectedTab === 'logs' && <ActivityLogView />}
            </>
          )}

        </section>

      </main>

      {/* 3. MODALS CORNER */}
      {selectedLeadId && (
        <LeadDetailsModal
          leadId={selectedLeadId}
          currentUser={currentUser}
          onClose={() => setSelectedLeadId(null)}
          onUpdate={refreshDatabase}
        />
      )}

      {isCreateModalOpen && (
        <LeadFormModal
          currentUser={currentUser}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={refreshDatabase}
        />
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[11px] text-slate-400 font-semibold leading-relaxed">
          &copy; {new Date().getFullYear()} Lead Track Hub, Inc. • Private Administrative Resource Network. Authorized Personnel Session Only.
        </div>
      </footer>

    </div>
  );
}
