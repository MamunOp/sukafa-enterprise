import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, UserRole, CurrentUser, Remark, LeadDocument, CruxStatus, StageIApplication, StageIIBankLoan } from '../types';
import { getDatabase, updateLead, addLeadRemark, addLeadDocument, deleteLead } from '../store';
import { X, Calendar, DollarSign, User, Shield, Briefcase, FileText, Send, Plus, Trash2, Download, Eye, File, Upload, AlertCircle, MapPin, Smartphone, Phone, FileDigit } from 'lucide-react';

interface LeadDetailsModalProps {
  leadId: string;
  currentUser: CurrentUser;
  onClose: () => void;
  onUpdate: () => void;
}

export default function LeadDetailsModal({ leadId, currentUser, onClose, onUpdate }: LeadDetailsModalProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'remarks' | 'docs'>('info');
  
  // Edit forms state
  const [isEditing, setIsEditing] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [villageArea, setVillageArea] = useState('');
  const [district, setDistrict] = useState('');
  const [requirements, setRequirements] = useState('');
  const [budget, setBudget] = useState(0);
  const [employeeId, setEmployeeId] = useState('');
  const [agentId, setAgentId] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentContact, setAgentContact] = useState('');

  // Extended Employee Fields state
  const [consumerNo, setConsumerNo] = useState('');
  const [address, setAddress] = useState('');
  const [cruxStatus, setCruxStatus] = useState<CruxStatus>(CruxStatus.NotStarted);
  const [stageIApplication, setStageIApplication] = useState<StageIApplication>(StageIApplication.NotStarted);
  const [stageIReason, setStageIReason] = useState('');
  const [stageIIBankLoan, setStageIIBankLoan] = useState<StageIIBankLoan>(StageIIBankLoan.NotStarted);
  const [stageIIReason, setStageIIReason] = useState('');
  const [loanActionDate, setLoanActionDate] = useState('');

  // Remark & document state
  const [newRemarkText, setNewRemarkText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  
  // Helpers from store
  const db = getDatabase();
  const isAdmin = currentUser.role === UserRole.Admin;
  const isEmployee = currentUser.role === UserRole.Employee;
  const isAgent = currentUser.role === UserRole.Agent;

  // Sync data from db
  const reloadLead = () => {
    const freshlyLoadedDb = getDatabase();
    const l = freshlyLoadedDb.leads.find(item => item.id === leadId);
    if (l) {
      setLead(l);
      setCustomerName(l.customerName);
      setCustomerPhone(l.customerPhone);
      setCustomerEmail(l.customerEmail || '');
      setVillageArea(l.villageArea || '');
      setDistrict(l.district || '');
      setRequirements(l.requirements);
      setBudget(l.budget);
      setEmployeeId(l.employeeId || '');
      setAgentId(l.agentId || '');
      setAgentName(l.agentName || '');
      setAgentContact(l.agentContact || '');

      setConsumerNo(l.consumerNo || '');
      setAddress(l.address || '');
      setCruxStatus(l.cruxStatus || CruxStatus.NotStarted);
      setStageIApplication(l.stageIApplication || StageIApplication.NotStarted);
      setStageIReason(l.stageIReason || '');
      setStageIIBankLoan(l.stageIIBankLoan || StageIIBankLoan.NotStarted);
      setStageIIReason(l.stageIIReason || '');
      setLoanActionDate(l.loanActionDate || '');
    } else {
      onClose(); // close if deleted
    }
  };

  useEffect(() => {
    reloadLead();
  }, [leadId]);

  if (!lead) return null;

  const handleStatusChange = (newStatus: LeadStatus) => {
    if (isAgent) return; // restricted
    updateLead(lead.id, { status: newStatus }, currentUser);
    reloadLead();
    onUpdate();
  };

  const handleAssignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isAdmin) return;
    setEmployeeId(e.target.value);
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isAdmin) return;
    const val = e.target.value;
    setAgentId(val);
    if (val) {
      const match = db.agents.find(a => a.id === val);
      if (match) {
        setAgentName(match.name);
        setAgentContact(match.phone);
      }
    } else {
      setAgentName('');
      setAgentContact('');
    }
  };

  const saveGeneralDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAgent) return; // restricted

    const updates: Partial<Lead> = {
      customerName,
      customerPhone,
      customerEmail,
      villageArea,
      district,
      requirements,
      budget: Number(budget),
      agentName,
      agentContact,
      consumerNo,
      address,
      cruxStatus,
      stageIApplication,
      stageIReason,
      stageIIBankLoan,
      stageIIReason,
      loanActionDate
    };

    if (isAdmin) {
      updates.employeeId = 'emp-1';
      updates.agentId = agentId || undefined;
    }

    updateLead(lead.id, updates, currentUser);
    setIsEditing(false);
    reloadLead();
    onUpdate();
  };

  const handleAddRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemarkText.trim()) return;

    addLeadRemark(lead.id, newRemarkText.trim(), {
      name: currentUser.name,
      role: currentUser.role
    });

    setNewRemarkText('');
    reloadLead();
    onUpdate();
  };

  // Convert uploaded file to base64
  const attachFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

      addLeadDocument(lead.id, file.name, sizeStr, base64Data, {
        name: currentUser.name,
        role: currentUser.role
      });
      reloadLead();
      onUpdate();
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      attachFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      attachFile(e.dataTransfer.files[0]);
    }
  };

  const downloadFile = (doc: LeadDocument) => {
    if (!doc.fileData) return;
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerDelete = () => {
    if (!isAdmin) return;
    if (confirm(`Are you sure you want to delete lead: ${lead.customerName}? This action cannot be undone.`)) {
      deleteLead(lead.id, currentUser);
      onUpdate();
      onClose();
    }
  };

  // Color mappings for badges
  const getStatusColor = (s: LeadStatus) => {
    switch (s) {
      case LeadStatus.New:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case LeadStatus.Contacted:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case LeadStatus.InProgress:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case LeadStatus.DocumentPending:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case LeadStatus.Submitted:
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case LeadStatus.Approved:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case LeadStatus.Rejected:
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div id="lead-details-backdrop" className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div 
        id="lead-details-container" 
        className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-mono tracking-wider bg-white/10 px-2 py-0.5 rounded">
                Lead ID: {lead.id}
              </span>
              {lead.agentId && (
                <span className="text-[10px] uppercase font-mono tracking-wider bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded">
                  Agent Referral
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold font-sans mt-1">
              {lead.customerName}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {isAdmin && (
              <button
                id="delete-lead-modal-btn"
                onClick={triggerDelete}
                className="p-2 text-rose-300 hover:text-rose-100 hover:bg-white/10 rounded-lg transition-all cursor-pointer mr-2"
                title="Delete Lead"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              id="close-lead-details"
              onClick={onClose}
              className="p-1 text-slate-300 hover:text-white hover:bg-white/15 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* CONTROLS BAR: STATUS QUICK EDIT */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status:</span>
            {isAgent ? (
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
            ) : (
              <select
                id="modal-status-selector"
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                className={`text-xs font-semibold rounded-full px-3 py-1.5 border focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white cursor-pointer ${getStatusColor(lead.status)}`}
              >
                {Object.values(LeadStatus).map((st) => (
                  <option key={st} value={st} className="text-slate-900 bg-white">
                    {st}
                  </option>
                ))}
              </select>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Assign To:</span>
              <select
                id="modal-employee-assignee"
                value={lead.employeeId || ''}
                onChange={handleAssignmentChange}
                className="text-xs font-semibold bg-white border border-slate-250 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">-- Direct Admin Managed --</option>
                {db.employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} (Employee)
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isAdmin && (
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium">
              <span className="text-slate-400">Assigned Employee:</span>
              <span className="font-semibold text-slate-900">
                {lead.employeeName || 'Directly Managed by Admin'}
              </span>
            </div>
          )}
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
          <button
            id="tab-info"
            onClick={() => setActiveTab('info')}
            className={`py-3.5 px-4 font-semibold text-xs uppercase tracking-wider border-b-2 -mb-px transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Customer Profile
          </button>
          
          <button
            id="tab-remarks"
            onClick={() => setActiveTab('remarks')}
            className={`py-3.5 px-4 font-semibold text-xs uppercase tracking-wider border-b-2 -mb-px transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'remarks'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>Activity Logs & Remarks</span>
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
              {lead.remarks.length}
            </span>
          </button>
          
          <button
            id="tab-docs"
            onClick={() => setActiveTab('docs')}
            className={`py-3.5 px-4 font-semibold text-xs uppercase tracking-wider border-b-2 -mb-px transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'docs'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>Document Closet</span>
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
              {lead.documents.length}
            </span>
          </button>
        </div>

        {/* TAB CONTENTS - CONTENT CONTAINER */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* PROFILE VIEW OR EDIT */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* General Bio */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">
                      Customer Contact & Location Info
                    </h4>
                    
                    <div className="flex items-start space-x-3 text-sm">
                      <User className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-slate-400 text-[11px] font-medium leading-none mb-1">Full Name</div>
                        <div className="font-bold text-slate-900">{lead.customerName}</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 text-sm">
                      <Smartphone className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-slate-400 text-[11px] font-medium leading-none mb-1">Mobile Number</div>
                        <div className="font-semibold text-slate-900">{lead.customerPhone}</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 text-sm">
                      <Send className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-slate-400 text-[11px] font-medium leading-none mb-1">Email Address</div>
                        <div className="font-semibold text-slate-800">{lead.customerEmail || 'Not Provided'}</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 text-sm border-t border-slate-200/65 pt-3">
                      <MapPin className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-slate-400 text-[11px] font-medium leading-none mb-1">Residential / Service Address</div>
                        <div className="font-semibold text-slate-900 leading-tight">{lead.address || 'Not Provided'}</div>
                        <div className="text-[10px] text-slate-450 mt-1">
                          Village: <span className="font-bold text-slate-700">{lead.villageArea || 'N/A'}</span> • District: <span className="font-bold text-slate-700">{lead.district || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Application Particulars */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">
                      Application Particulars
                    </h4>

                    <div className="flex items-start space-x-3 text-sm">
                      <FileDigit className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-slate-400 text-[11px] font-medium leading-none mb-1">Electricity Consumer No</div>
                        <div className="font-bold text-indigo-900 font-mono tracking-wide">{lead.consumerNo || 'CON-NotProvided'}</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 text-sm">
                      <Briefcase className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-slate-400 text-[11px] font-medium leading-none mb-1">Inquiry / Requirements</div>
                        <div className="font-bold text-slate-900">{lead.requirements}</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 text-sm">
                      <DollarSign className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-slate-400 text-[11px] font-medium leading-none mb-1">Principal Amount / Budget</div>
                        <div className="font-bold text-slate-900">${lead.budget.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 text-sm">
                      <Calendar className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-slate-400 text-[11px] font-medium leading-none mb-1">Created Date</div>
                        <div className="font-semibold text-slate-800">
                          {new Date(lead.createdAt).toLocaleDateString()} at {new Date(lead.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tracking Status & Stages */}
                  <div className="md:col-span-2 bg-slate-50 rounded-xl p-5 border border-slate-105 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">
                      System Tracking & Loan Processing Stages
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1 bg-white p-3.5 rounded-lg border border-slate-150">
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">CRUX Status</div>
                        <div className="font-bold text-slate-900 text-sm mt-1 flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                          <span>{lead.cruxStatus || CruxStatus.NotStarted}</span>
                        </div>
                      </div>

                      <div className="space-y-1 bg-white p-3.5 rounded-lg border border-slate-150">
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Stage I - Application</div>
                        <div className="font-bold text-indigo-900 text-sm mt-1">{lead.stageIApplication || StageIApplication.NotStarted}</div>
                        {lead.stageIReason && (
                          <div className="text-[11px] text-slate-500 italic mt-1.5 bg-slate-50 p-1.5 rounded border border-slate-100">
                            Reason: {lead.stageIReason}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 bg-white p-3.5 rounded-lg border border-slate-150">
                        <div className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Stage II - Bank Loan</div>
                        <div className="font-bold text-emerald-800 text-sm mt-1">{lead.stageIIBankLoan || StageIIBankLoan.NotStarted}</div>
                        {lead.stageIIReason && (
                          <div className="text-[11px] text-slate-500 italic mt-1.5 bg-slate-55 p-1.5 rounded border border-slate-100">
                            Remarks: {lead.stageIIReason}
                          </div>
                        )}
                        {lead.loanActionDate && (
                          <div className="text-[10px] font-semibold text-slate-500 mt-1 font-mono">
                            Action Date: {lead.loanActionDate}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Agent Referral Partner Details */}
                  {(lead.agentId || lead.agentName) && (isAdmin || isAgent || isEmployee) && (
                    <div className="md:col-span-2 bg-indigo-50/50 rounded-xl p-5 border border-indigo-100/50">
                      <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide border-b border-indigo-100 pb-2 mb-3 flex items-center justify-between">
                        <span>Agent Referral Partner Details</span>
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          Partner Source
                        </span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-slate-400 text-xs font-medium">Referring Agent</div>
                          <div className="font-bold text-slate-900 mt-0.5">{lead.agentName || 'Affiliated Agent'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs font-medium">Agent Contact No</div>
                          <div className="font-bold text-slate-900 mt-0.5 font-mono">{lead.agentContact || 'Not Specified'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick trigger to edit */}
                  {!isAgent && (
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        id="modal-edit-profile-trigger"
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-bold uppercase py-2 px-4 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
                      >
                        Modify Profile Info
                      </button>
                    </div>
                  )}

                </div>
              ) : (
                /* EDIT FORM FOR DETAILS */
                <form onSubmit={saveGeneralDetails} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Customer Name</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white text-slate-900 focus:outline-none focus:border-indigo-500 font-bold"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Customer Mobile</label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full text-sm border border-slate-250 rounded-lg p-2 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Principal Amount / Budget ($)</label>
                      <input
                        type="number"
                        required
                        value={budget}
                        onChange={(e) => setBudget(Number(e.target.value))}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Consumer No</label>
                      <input
                        type="text"
                        required
                        value={consumerNo}
                        onChange={(e) => setConsumerNo(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white text-slate-900 focus:outline-none focus:border-indigo-500 font-mono font-semibold"
                        placeholder="CON-XXXXXX"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Customer Address</label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                        placeholder="Residential/Service location details"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Village / Area</label>
                      <input
                        type="text"
                        required
                        value={villageArea}
                        onChange={(e) => setVillageArea(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">District</label>
                      <input
                        type="text"
                        required
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Application requirements</label>
                      <input
                        type="text"
                        required
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Stage tracking fields inside panel editing */}
                    <div className="col-span-1 sm:col-span-2 border-t border-slate-100 pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">CRUX Status</label>
                        <select
                          value={cruxStatus}
                          onChange={(e) => {
                            const val = e.target.value as CruxStatus;
                            setCruxStatus(val);
                            if (val === CruxStatus.Completed) {
                              setStageIApplication(StageIApplication.ApplicationApproved);
                              setStageIIBankLoan(StageIIBankLoan.Disbursed);
                              if (!loanActionDate) {
                                setLoanActionDate(new Date().toISOString().split('T')[0]);
                              }
                            } else if (val === CruxStatus.Rejected) {
                              setStageIApplication(StageIApplication.ApplicationRejected);
                              setStageIIBankLoan(StageIIBankLoan.Rejected);
                            }
                          }}
                          className="w-full text-xs font-semibold border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer focus:outline-none"
                        >
                          {Object.values(CruxStatus).map(cs => (
                            <option key={cs} value={cs}>{cs}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Loan Action Date</label>
                        <input
                          type="date"
                          value={loanActionDate}
                          onChange={(e) => setLoanActionDate(e.target.value)}
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Stage I - Application</label>
                        <select
                          value={stageIApplication}
                          onChange={(e) => setStageIApplication(e.target.value as StageIApplication)}
                          className="w-full text-xs font-semibold border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer focus:outline-none animate-fade-in"
                        >
                          {Object.values(StageIApplication).map(sa => (
                            <option key={sa} value={sa}>{sa}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Stage I - Reason for Pending/Not Starting</label>
                        <input
                          type="text"
                          value={stageIReason}
                          onChange={(e) => setStageIReason(e.target.value)}
                          placeholder="Why is Stage I pending?"
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-905 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Stage II - Bank Loan</label>
                        <select
                          value={stageIIBankLoan}
                          onChange={(e) => setStageIIBankLoan(e.target.value as StageIIBankLoan)}
                          className="w-full text-xs font-semibold border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer focus:outline-none"
                        >
                          {Object.values(StageIIBankLoan).map(sb => (
                            <option key={sb} value={sb}>{sb}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Stage II - Reason/Remarks</label>
                        <textarea
                          value={stageIIReason}
                          onChange={(e) => setStageIIReason(e.target.value)}
                          placeholder="Rejection remarks, pending notes..."
                          rows={2}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-905 focus:outline-none"
                        />
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Affiliated Agent Partner Source</label>
                          <select
                            id="edit-modal-agent"
                            value={agentId}
                            onChange={handleAgentChange}
                            className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white text-slate-900 focus:outline-none focus:border-indigo-500 mb-2 cursor-pointer"
                          >
                            <option value="">-- Direct Lead / Manual --</option>
                            {db.agents.map(a => (
                              <option key={a.id} value={a.id}>{a.name} ({a.phone})</option>
                            ))}
                          </select>

                          <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-150">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-450 uppercase leading-none mb-1">Agent Name</label>
                              <input
                                type="text"
                                value={agentName}
                                onChange={(e) => setAgentName(e.target.value)}
                                className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-900 focus:outline-none"
                                placeholder="Name"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-450 uppercase leading-none mb-1">Agent Contact No</label>
                              <input
                                type="text"
                                value={agentContact}
                                onChange={(e) => setAgentContact(e.target.value)}
                                className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-900 focus:outline-none"
                                placeholder="Contact"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Assigned Employee</label>
                          <div className="text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono mt-0.5">
                            Jane Employee (System Officer)
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  <div className="flex justify-end space-x-2 border-t border-slate-100 pt-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-xs font-bold uppercase py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="modal-save-profile-btn"
                      type="submit"
                      className="text-xs font-bold uppercase py-2 px-4 bg-slate-900 hover:bg-slate-850 text-white rounded-lg cursor-pointer animate-fade-in"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ACTIVITY REMARKS */}
          {activeTab === 'remarks' && (
            <div className="space-y-6">
              
              {/* Add remark form (Only Admin and Employee can write remarks) */}
              {!isAgent ? (
                <form onSubmit={handleAddRemark} className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Add Status Update Note / Remark
                  </label>
                  <div className="flex space-x-2">
                    <input
                      id="modal-remark-input"
                      type="text"
                      required
                      value={newRemarkText}
                      onChange={(e) => setNewRemarkText(e.target.value)}
                      placeholder="Add specific comments, bank responses, or document statuses..."
                      className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2 bg-white text-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      id="modal-remark-submit-btn"
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center space-x-1"
                    >
                      <span>Post</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl text-xs text-indigo-700 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Agents are restricted to Read-Only access for internal transition remarks. Contract notes are managed by assigned bank staffers.</span>
                </div>
              )}

              {/* Remarks History List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-rose-50/10 pb-2">
                  System Timeline & Remarks
                </h4>

                {lead.remarks.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No historical timeline entries found for this customer.</p>
                ) : (
                  <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 py-2">
                    {lead.remarks.map((item) => (
                      <div key={item.id} className="relative">
                        {/* Dot indicator */}
                        <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white" />
                        
                        <div className="text-xs text-slate-400 font-medium">
                          {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString()}
                        </div>
                        
                        <div className="text-sm text-slate-800 font-medium mt-1">
                          {item.text}
                        </div>
                        
                        <div className="inline-flex items-center space-x-1.5 mt-2 bg-slate-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-600">
                          {item.authorRole === UserRole.Admin && <Shield className="w-3 h-3 text-indigo-500" />}
                          {item.authorRole === UserRole.Employee && <Briefcase className="w-3 h-3 text-emerald-500" />}
                          {item.authorRole === UserRole.Agent && <User className="w-3 h-3 text-amber-500" />}
                          <span>{item.authorName} ({item.authorRole})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* DOCUMENTS VIEW */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              
              {/* Document upload box (Agent is restricted? Wait, User details says Agent: "Can upload documents? -> No. Permissions list: Employee can upload documents, add remarks. Agent list states: permissions to view status, view remarks, view commission, add new leads. Restrictions cannot edit lead status. Does not explicitly deny document upload during status but Employee does have explicit permissions). Let's let Admin and Employee upload documents directly, and keep Agent view read-only" */}
              {!isAgent ? (
                <div 
                  id="document-dropzone"
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                    dragOver 
                      ? 'border-indigo-500 bg-indigo-50/50' 
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/55'
                  }`}
                >
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    Drag and drop file here, or click to manually select
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Supports PDFs, Certificates, Word documents, and Images (stored locally)
                  </p>
                  
                  <input
                    id="modal-file-uploader"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('modal-file-uploader')?.click()}
                    className="mt-3 text-xs bg-slate-900 text-white font-semibold py-1.5 px-3.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Select File
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl text-xs text-indigo-700 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Agent portal restricted. Submit onboarding documents by emailing your assigned administrative analyst.</span>
                </div>
              )}

              {/* Documents grid list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-rose-55/10 pb-2">
                  Uploaded Dossier Documents
                </h4>

                {lead.documents.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No documents uploaded for this client yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lead.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl hover:shadow-sm transition-all">
                        <div className="flex items-center space-x-3 truncate">
                          <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <File className="w-5 h-5" />
                          </div>
                          <div className="truncate text-left">
                            <div className="text-xs font-bold text-slate-800 leading-tight truncate" title={doc.name}>
                              {doc.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              {doc.size} • by {doc.uploadedBy}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          {doc.fileData && (
                            <button
                              onClick={() => {
                                // Simple mock file viewer using iframe or tab
                                const w = window.open();
                                if (w) {
                                  w.document.write(`<iframe src="${doc.fileData}" style="width:100%; height:100%; border:none;"></iframe>`);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-all cursor-pointer"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => downloadFile(doc)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-all cursor-pointer"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end">
          <button
            id="modal-footer-close"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 cursor-pointer transition-all"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
