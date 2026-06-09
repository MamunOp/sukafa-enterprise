import React, { useState } from 'react';
import { UserRole, CurrentUser, LeadStatus, CruxStatus, StageIApplication, StageIIBankLoan } from '../types';
import { getDatabase, createLead } from '../store';
import { X, Send, User, Smartphone, DollarSign, Briefcase, MapPin, Phone, Shield, FileText } from 'lucide-react';

interface LeadFormModalProps {
  currentUser: CurrentUser;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LeadFormModal({ currentUser, onClose, onSuccess }: LeadFormModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [villageArea, setVillageArea] = useState('');
  const [district, setDistrict] = useState('');
  const [requirements, setRequirements] = useState('');
  const [budget, setBudget] = useState('');
  
  // Custom Employee Portal Fields
  const [consumerNo, setConsumerNo] = useState('');
  const [address, setAddress] = useState('');

  // Referrer/Agent custom variables
  const [agentId, setAgentId] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentContact, setAgentContact] = useState('');

  // Admin specific fields
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState<LeadStatus>(LeadStatus.New);

  const db = getDatabase();
  const isAdmin = currentUser.role === UserRole.Admin;
  const isAgent = currentUser.role === UserRole.Agent;

  const handleAgentSelectChange = (selectedId: string) => {
    setAgentId(selectedId);
    if (selectedId) {
      const match = db.agents.find(a => a.id === selectedId);
      if (match) {
        setAgentName(match.name);
        setAgentContact(match.phone);
      }
    } else {
      setAgentName('');
      setAgentContact('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const preparedLeadData = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      villageArea: villageArea.trim(),
      district: district.trim(),
      requirements: requirements.trim(),
      budget: Number(budget) || 0,
      status: isAdmin ? status : LeadStatus.New,
      agentId: isAgent ? currentUser.id : (agentId || undefined),
      agentName: isAgent ? currentUser.name : (agentName.trim() || undefined),
      agentContact: isAgent ? currentUser.identifier : (agentContact.trim() || undefined),
      employeeId: 'emp-1', // Auto-route to the singular system employee processor
      consumerNo: consumerNo.trim() || 'CON-' + Math.floor(100000 + Math.random() * 900000),
      address: address.trim() || (villageArea ? `${villageArea}, ${district || 'Kolkata'}` : ''),
      cruxStatus: CruxStatus.NotStarted,
      stageIApplication: StageIApplication.NotStarted,
      stageIReason: 'Awaiting first stage document uploads and processing reviews.',
      stageIIBankLoan: StageIIBankLoan.NotStarted,
      stageIIReason: '',
      loanActionDate: '',
    };

    createLead(preparedLeadData, currentUser);
    onSuccess();
    onClose();
  };

  return (
    <div id="lead-form-backdrop" className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        id="lead-form-container" 
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white">
          <h3 className="text-lg font-bold font-sans">
            {isAgent ? 'Register New Client Referral' : 'Create Customer Directory Lead'}
          </h3>
          <button
            id="close-lead-form"
            onClick={onClose}
            className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM CONTAINER */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* CLIENT CONFIDENTIALS */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-1.5 flex items-center space-x-1.5">
              <User className="w-4 h-4" />
              <span>Customer Details</span>
            </h4>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="form-customer-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g., Alice Cooper"
                  className="w-full text-sm pl-9 pr-3 py-2 border border-slate-250 rounded-lg bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Smartphone className="w-4 h-4" />
                  </span>
                  <input
                    id="form-customer-phone"
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g., 9123456780"
                    className="w-full text-sm pl-9 pr-3 py-2 border border-slate-250 rounded-lg bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Send className="w-4 h-4" />
                  </span>
                  <input
                    id="form-customer-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="alice@gmail.com"
                    className="w-full text-sm pl-9 pr-3 py-2 border border-slate-250 rounded-lg bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Village / Area <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    id="form-customer-village"
                    type="text"
                    required
                    value={villageArea}
                    onChange={(e) => setVillageArea(e.target.value)}
                    placeholder="e.g., Greenwood Valley"
                    className="w-full text-sm pl-9 pr-3 py-2 border border-slate-250 rounded-lg bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  District <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    id="form-customer-district"
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g., South District"
                    className="w-full text-sm pl-9 pr-3 py-2 border border-slate-250 rounded-lg bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Electricity Consumer No
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4" />
                  </span>
                  <input
                    id="form-customer-consumer"
                    type="text"
                    value={consumerNo}
                    onChange={(e) => setConsumerNo(e.target.value)}
                    placeholder="e.g., CON-918239 (Leave empty to auto-generate)"
                    className="w-full text-sm pl-9 pr-3 py-2 border border-slate-250 rounded-lg bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Customer Residence/Service Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    id="form-customer-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g., House 14, Main Road, Greenwood District"
                    className="w-full text-sm pl-9 pr-3 py-2 border border-slate-250 rounded-lg bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* REFERRAL SOURCE / AGENT DETAILS */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-1.5 flex items-center space-x-1.5">
              <Phone className="w-4 h-4" />
              <span>Agent Referral Details</span>
            </h4>

            {isAdmin && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Select Registered Agent Partner (Optional)
                  </label>
                  <select
                    id="form-agent-source-select"
                    value={agentId}
                    onChange={(e) => handleAgentSelectChange(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-250 rounded-lg p-2.5 bg-white text-slate-850 focus:outline-none focus:border-slate-900 cursor-pointer"
                  >
                    <option value="">-- Manual Referrer / Direct Traffic --</option>
                    {db.agents.map(ag => (
                      <option key={ag.id} value={ag.id}>{ag.name} ({ag.phone})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">
                      Agent Name
                    </label>
                    <input
                      id="form-agent-name-manual"
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="e.g., Alex Agent (or leave blank if none)"
                      className="w-full text-xs p-2 border border-slate-250 rounded-lg bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-950"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">
                      Agent Contact No
                    </label>
                    <input
                      id="form-agent-contact-manual"
                      type="tel"
                      value={agentContact}
                      onChange={(e) => setAgentContact(e.target.value)}
                      placeholder="e.g., 9876543210"
                      className="w-full text-xs p-2 border border-slate-250 rounded-lg bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-950"
                    />
                  </div>
                </div>
              </div>
            )}

            {isAgent && (
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-800 mb-2">Referred under your agent partner account:</p>
                <div className="grid grid-cols-2 gap-3 font-medium">
                  <div>
                    <div className="text-[10px] uppercase text-indigo-400">Your Agent Name</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{currentUser.name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-indigo-400">Your Agent Contact</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{currentUser.identifier}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* APPLICATION DETAILS */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center space-x-1.5">
              <Briefcase className="w-4 h-4" />
              <span>Application Details & Requirements</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Inquiry / Service Requirements <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Briefcase className="w-4 h-4" />
                </span>
                <input
                  id="form-requirements"
                  type="text"
                  required
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="e.g. Home Loan Premium, Business License registration, etc."
                  className="w-full text-sm pl-9 pr-3 py-2 border border-slate-250 rounded-lg bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Est. Deal Volume / Budget ($) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </span>
                <input
                  id="form-budget"
                  type="number"
                  required
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g., 150000"
                  className="w-full text-sm pl-9 pr-3 py-2 border border-slate-250 rounded-lg bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                />
              </div>

            </div>
          </div>

          {/* ADMIN ADMINISTRATIVE ASSIGNMENTS */}
          {isAdmin && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center space-x-1.5">
                <Shield className="w-4 h-4" />
                <span>Administrative Controls</span>
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Route Assignment
                  </label>
                  <div className="text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono">
                    Jane Employee (System Officer)
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Starting Status
                  </label>
                  <select
                    id="form-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadStatus)}
                    className="w-full text-xs font-semibold border border-slate-250 rounded-lg p-2.5 bg-white text-slate-950 focus:outline-none focus:border-slate-900 shadow-sm cursor-pointer"
                  >
                    {Object.values(LeadStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* FOOTER BUTTONS */}
          <div className="flex justify-end space-x-2 border-t border-slate-100 pt-5 mt-6">
            <button
              id="form-cancel"
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="form-submit"
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase cursor-pointer flex items-center space-x-1"
            >
              <span>Submit Lead</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
