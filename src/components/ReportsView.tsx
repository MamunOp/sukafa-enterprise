import React, { useState } from 'react';
import { getDatabase } from '../store';
import { LeadStatus } from '../types';
import { Users, DollarSign, Award, Target, Phone, MapPin, BarChart3, ChevronDown, ChevronUp, Search, SlidersHorizontal, UserCheck, X, Briefcase } from 'lucide-react';

export default function ReportsView() {
  const db = getDatabase();
  const leads = db.leads;
  const agents = db.agents;

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'all-customers' | 'grouped'>('all-customers');

  // State to toggle/collapse agent lists for the grouped view
  const [collapsedAgents, setCollapsedAgents] = useState<Record<string, boolean>>({});

  // Reset Filters helper
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedAgentFilter('all');
  };

  // Helper: Find assigned or referred agent for a given lead
  const getLeadAgent = (lead: any) => {
    // Check if matching agent exists
    const matchedAgent = agents.find(
      a => a.id === lead.agentId || a.phone === lead.agentId || a.phone === lead.agentContact
    );
    if (matchedAgent) return matchedAgent;
    if (lead.agentName) {
      return {
        id: lead.agentId || 'legacy-agent',
        name: lead.agentName,
        phone: lead.agentContact || 'N/A',
        commissionRate: 5 // fallback
      };
    }
    return null;
  };

  // 1. FILTER STREAM ENGINE
  const filteredLeads = leads.filter(lead => {
    // Match search query
    const query = searchQuery.trim().toLowerCase();
    let matchesQuery = true;
    if (query) {
      const custName = (lead.customerName || '').toLowerCase();
      const custPhone = (lead.customerPhone || '').toLowerCase();
      const village = (lead.villageArea || '').toLowerCase();
      const district = (lead.district || '').toLowerCase();
      const reqs = (lead.requirements || '').toLowerCase();

      // Resolve agent details for search
      const agent = getLeadAgent(lead);
      const agentName = (agent ? agent.name : 'Direct Walk-In').toLowerCase();

      matchesQuery =
        custName.includes(query) ||
        custPhone.includes(query) ||
        village.includes(query) ||
        district.includes(query) ||
        reqs.includes(query) ||
        agentName.includes(query);
    }

    // Match selected agent filter
    let matchesAgent = true;
    if (selectedAgentFilter !== 'all') {
      if (selectedAgentFilter === 'direct') {
        matchesAgent = !lead.agentId && !lead.agentName;
      } else {
        const agent = getLeadAgent(lead);
        matchesAgent = agent !== null && agent.id === selectedAgentFilter;
      }
    }

    return matchesQuery && matchesAgent;
  });

  // 2. REAL-TIME STATS CALCULATION
  const totalLeadsCount = filteredLeads.length;
  const approvedLeads = filteredLeads.filter(l => l.status === LeadStatus.Approved);
  const totalApprovedVolume = approvedLeads.reduce((sum, l) => sum + l.budget, 0);
  const generalApprovalRate = totalLeadsCount > 0 ? ((approvedLeads.length / totalLeadsCount) * 100).toFixed(1) : '0';

  // 3. AGENT GROUPINGS FOR THE GROUPED ACCORDION VIEW
  // Only process agents that match the filter (if filter !== 'all', only that agent group is rendered)
  const activeAgentFilterList = selectedAgentFilter === 'all'
    ? agents
    : selectedAgentFilter === 'direct'
      ? []
      : agents.filter(a => a.id === selectedAgentFilter);

  const agentGroups = activeAgentFilterList.map(agent => {
    // Filter leads associated with this agent AND satisfying the search query
    const agentLeads = filteredLeads.filter(l => {
      const parsedAgent = getLeadAgent(l);
      return parsedAgent !== null && parsedAgent.id === agent.id;
    });

    const approved = agentLeads.filter(l => l.status === LeadStatus.Approved);
    const pending = agentLeads.filter(l => l.status !== LeadStatus.Approved && l.status !== LeadStatus.Rejected);
    
    const totalVolume = agentLeads.reduce((sum, l) => sum + l.budget, 0);
    const approvedVolume = approved.reduce((sum, l) => sum + l.budget, 0);
    const totalCommission = agentLeads.reduce((sum, l) => sum + l.commissionAmount, 0);

    return {
      agentId: agent.id,
      agentName: agent.name,
      agentPhone: agent.phone,
      commissionRate: agent.commissionRate,
      leads: agentLeads,
      metrics: {
        totalLeadsCount: agentLeads.length,
        approvedCount: approved.length,
        pendingCount: pending.length,
        totalVolume,
        approvedVolume,
        commissionSum: totalCommission,
        successRate: agentLeads.length > 0 ? ((approved.length / agentLeads.length) * 100).toFixed(0) : '0'
      }
    };
  }).sort((a, b) => b.metrics.totalVolume - a.metrics.totalVolume);

  // Group for walk-in leads
  const isDirectGroupVisible = selectedAgentFilter === 'all' || selectedAgentFilter === 'direct';
  const directLeads = filteredLeads.filter(l => !l.agentId && !l.agentName);
  const directApproved = directLeads.filter(l => l.status === LeadStatus.Approved);
  const directPending = directLeads.filter(l => l.status !== LeadStatus.Approved && l.status !== LeadStatus.Rejected);
  const directVolume = directLeads.reduce((sum, l) => sum + l.budget, 0);
  const directApprovedVolume = directApproved.reduce((sum, l) => sum + l.budget, 0);

  const directGroup = {
    agentId: 'direct',
    agentName: 'Direct Traffic (Non-Referred Customers)',
    agentPhone: 'N/A',
    commissionRate: 0,
    leads: directLeads,
    metrics: {
      totalLeadsCount: directLeads.length,
      approvedCount: directApproved.length,
      pendingCount: directPending.length,
      totalVolume: directVolume,
      approvedVolume: directApprovedVolume,
      commissionSum: 0,
      successRate: directLeads.length > 0 ? ((directApproved.length / directLeads.length) * 100).toFixed(0) : '0'
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsedAgents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Status badge style helper
  const getStatusStyle = (s: LeadStatus) => {
    switch (s) {
      case LeadStatus.Approved:
        return 'bg-emerald-50 text-emerald-800 border-emerald-250';
      case LeadStatus.Rejected:
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case LeadStatus.InProgress:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case LeadStatus.New:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* SECTION HEADER */}
      <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950 font-sans tracking-tight">Performance Reports Directory</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Search customers and filter channel performance with our real-time database ledger.
          </p>
        </div>

        {/* VIEW TOGGLE */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('all-customers')}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              viewMode === 'all-customers'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Customers List
          </button>
          <button
            onClick={() => setViewMode('grouped')}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              viewMode === 'grouped'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Grouped by Agent
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH INTEGRATED BAR - Fully styling-responsive */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          
          {/* Main Search Input */}
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers by name, mobile, location, requirements, or agent..."
              className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-205 text-slate-900 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white transition-all font-semibold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Agent Filter */}
          <div className="w-full md:w-64 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450 text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </span>
            <select
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-3 bg-slate-50 border border-slate-205 text-slate-900 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white transition-all cursor-pointer font-bold uppercase tracking-wider"
            >
              <option value="all">🎛️ All Agent Partners</option>
              <option value="direct">👤 Direct Walk-In (No Agent)</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  🤝 {agent.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Active Filter Indicators */}
        {(searchQuery || selectedAgentFilter !== 'all') && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
            <div className="flex items-center space-x-2 text-indigo-950 font-medium">
              <span className="bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-wide">
                Active Filter
              </span>
              <span>
                Found <strong>{filteredLeads.length}</strong> matching entries.
              </span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-950 transition-all uppercase tracking-wider font-mono flex items-center space-x-1 self-start sm:self-auto"
            >
              <span>Clear Filter</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* RENDER MASTER VIEWS */}
      {filteredLeads.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-201 rounded-2xl shadow-sm space-y-3">
          <p className="text-sm font-bold text-slate-500">No customers match your active search terms or agent filters.</p>
          <p className="text-xs text-slate-404 text-slate-400">Try modifying your text query above or choose a different agent partner channel.</p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'all-customers' ? (
        
        /* VIEW MODE A: UNIFIED CUSTOMER MASTER LIST */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          
          <div className="p-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              📋 All Customers Directory Listing ({filteredLeads.length})
            </span>
            <span className="text-[10px] font-bold text-slate-400 font-mono hidden sm:inline">
              Real-time Sync Active
            </span>
          </div>

          {/* DESKTOP TABLE VIEW: Rendered strictly on md screen size and up */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-250 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  <th className="px-5 py-3.5 text-left">Customer details</th>
                  <th className="px-5 py-3.5 text-left">Location (Area / District)</th>
                  <th className="px-5 py-3.5 text-left">Requirements</th>
                  <th className="px-5 py-3.5 text-left">Assigned Agent Channel</th>
                  <th className="px-5 py-3.5 text-right font-mono">Budget Scale</th>
                  <th className="px-5 py-3.5 text-center">Execution State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((item) => {
                  const agent = getLeadAgent(item);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/30 duration-75 transition-all font-medium text-slate-705 text-slate-700">
                      
                      {/* Customer Info */}
                      <td className="px-5 py-4">
                        <div>
                          <div className="font-extrabold text-slate-950 text-sm leading-tight">
                            {item.customerName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-bold flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-slate-350" />
                            <span>{item.customerPhone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Location details */}
                      <td className="px-5 py-4 text-slate-600 leading-tight">
                        {item.villageArea || item.district ? (
                          <div>
                            <div className="font-bold text-slate-800 text-[11px]">
                              {item.villageArea || 'Area Details Pending'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium font-sans mt-0.5 flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-slate-300" />
                              <span>{item.district || 'District N/A'}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-350 italic font-medium">No details registered</span>
                        )}
                      </td>

                      {/* Requirements */}
                      <td className="px-5 py-4">
                        <span className="font-extrabold text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-[11px] transition-all">
                          {item.requirements}
                        </span>
                      </td>

                      {/* Agent Partner */}
                      <td className="px-5 py-4">
                        {agent ? (
                          <div>
                            <div className="font-extrabold text-indigo-950 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1" />
                              <span>{agent.name}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-450 italic flex items-center space-x-1 font-semibold text-slate-500">
                            <UserCheck className="w-3.5 h-3.5 text-slate-300" />
                            <span>Direct Traffic Entry</span>
                          </div>
                        )}
                      </td>

                      {/* Budget */}
                      <td className="px-5 py-4 text-right font-black font-mono text-slate-950 text-sm">
                        ${item.budget.toLocaleString()}
                      </td>

                      {/* Status state */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border ${getStatusStyle(item.status)}`}>
                          {item.status}
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE RESPONSIVE CARD VIEW: Displayed strictly on mobile and small tablets < md */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredLeads.map((item) => {
              const agent = getLeadAgent(item);
              return (
                <div key={item.id} className="p-4 space-y-3.5 bg-white hover:bg-slate-50/50 transition-all">
                  
                  {/* Top line: Name and Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-black text-slate-950 text-sm leading-snug">{item.customerName}</h4>
                      <div className="text-[10px] text-slate-450 font-semibold font-mono mt-0.5 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-350" />
                        <span>{item.customerPhone}</span>
                      </div>
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${getStatusStyle(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Body grid detailing technical and financial values */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50/75 p-3 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Requirements</span>
                      <span className="font-extrabold text-slate-900 block mt-0.5">{item.requirements}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Location</span>
                      <span className="font-bold text-slate-800 block mt-0.5 mt-0.5 inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 inline" />
                        <span>{item.villageArea || item.district ? `${item.villageArea || ''} (${item.district || ''})` : 'N/A'}</span>
                      </span>
                    </div>

                    <div className="border-t border-slate-200/50 pt-2 col-span-2">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Budget Scale</span>
                      <span className="font-black font-mono text-slate-950 text-sm block mt-0.5">${item.budget.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Channel Partner tag */}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="font-semibold uppercase tracking-wider text-slate-400">Referred Channel:</span>
                    {agent ? (
                      <span className="font-bold text-indigo-950 flex items-center bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded">
                        <Briefcase className="w-3 h-3 mr-1 text-indigo-600" />
                        {agent.name}
                      </span>
                    ) : (
                      <span className="font-bold text-slate-705 bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        Direct Walk-In Traffic
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

      ) : (

        /* VIEW MODE B: AGENT ACCORDIONS VIEW */
        <div className="space-y-4">
          
          {agentGroups.map((group) => {
            const isCollapsed = !!collapsedAgents[group.agentId];
            const hasLeads = group.leads.length > 0;

            return (
              <div 
                key={group.agentId} 
                className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all duration-300"
              >
                
                {/* Accordion Group Header */}
                <div 
                  onClick={() => toggleCollapse(group.agentId)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none transition-all bg-slate-5
                  0/75 hover:bg-slate-50 bg-slate-50/75"
                >
                  
                  {/* Identity */}
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-slate-950 font-bold text-sm">
                      {group.agentName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight inline-flex items-center gap-1.5 flex-wrap">
                        <span>{group.agentName}</span>
                      </h4>
                      
                      <p className="text-[11px] font-semibold text-slate-400 mt-1 font-mono flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3.5 h-3.5" />
                          <span>Phone: {group.agentPhone}</span>
                        </span>
                        <span className="hidden sm:inline">Route ID: {group.agentId}</span>
                      </p>
                    </div>
                  </div>

                  {/* Accordion Stats */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-500 font-bold ml-12 md:ml-0">
                    <div className="text-center md:text-right">
                      <span className="block text-[9px] uppercase tracking-wider text-slate-400 leading-none">Customers</span>
                      <span className="text-slate-800 font-mono text-sm block mt-0.5">{group.metrics.totalLeadsCount}</span>
                    </div>

                    <div className="text-center md:text-right">
                      <span className="block text-[9px] uppercase tracking-wider text-slate-400 leading-none">Volume</span>
                      <span className="text-slate-800 font-mono text-sm block mt-0.5">${group.metrics.totalVolume.toLocaleString()}</span>
                    </div>

                    <div className="text-center md:text-right">
                      <span className="block text-[9px] uppercase tracking-wider text-slate-400 leading-none">Conversion</span>
                      <span className="block mt-0.5">
                        <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold font-mono text-[10px]">
                          {group.metrics.successRate}% Approvals
                        </span>
                      </span>
                    </div>

                    <div className="text-slate-400 pl-2">
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </div>
                  </div>

                </div>

                {/* Accordion list details */}
                {!isCollapsed && (
                  <div className="border-t border-slate-100 animate-slide-down">
                    {!hasLeads ? (
                      <div className="p-8 text-center bg-white text-slate-400 text-xs font-semibold">
                        This agent has no matching customers currently with active search parameters.
                      </div>
                    ) : (
                      <>
                        {/* DESKTOP ACCORDION TABLE VIEW */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/60 border-b border-slate-100 text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono">
                                <th className="px-5 py-3 text-left">Customer</th>
                                <th className="px-5 py-3 text-left">Location (Village / Area)</th>
                                <th className="px-5 py-3 text-left">Requirements Seeked</th>
                                <th className="px-5 py-3 text-right">Budget Size</th>
                                <th className="px-5 py-3 text-center">Status STG</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {group.leads.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/15 duration-100 transition-all font-medium text-slate-700">
                                  <td className="px-5 py-3.5">
                                    <div>
                                      <div className="font-extrabold text-slate-900 text-sm leading-tight">{item.customerName}</div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-bold flex items-center space-x-1">
                                        <Phone className="w-3 h-3 text-slate-300" />
                                        <span>{item.customerPhone}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3.5 text-slate-600 leading-tight">
                                    {item.villageArea || item.district ? (
                                      <div>
                                        <div className="font-bold text-slate-800 text-[11px]">{item.villageArea || 'Area Details Pending'}</div>
                                        <div className="text-[10px] text-slate-400 font-medium font-sans mt-0.5 flex items-center space-x-1">
                                          <MapPin className="w-3 h-3 text-slate-300" />
                                          <span>{item.district || 'N/A'}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-350 italic font-medium">None Listed</span>
                                    )}
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-1 rounded text-[11px]">
                                      {item.requirements}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 text-right font-black font-mono text-slate-900 text-sm">
                                    ${item.budget.toLocaleString()}
                                  </td>
                                  <td className="px-5 py-3.5 text-center">
                                    <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border ${getStatusStyle(item.status)}`}>
                                      {item.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* MOBILE RESPONSIVE ACCORDION CARDS VIEW */}
                        <div className="block md:hidden divide-y divide-slate-100">
                          {group.leads.map((item) => (
                            <div key={item.id} className="p-4 space-y-3 bg-white">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <h5 className="font-extrabold text-slate-950 text-xs">{item.customerName}</h5>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-bold flex items-center space-x-1">
                                    <Phone className="w-3 text-slate-300 inline" />
                                    <span>{item.customerPhone}</span>
                                  </div>
                                </div>
                                <span className={`inline-block px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded border ${getStatusStyle(item.status)}`}>
                                  {item.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-snug">
                                <div>
                                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Requirements</span>
                                  <span className="font-bold text-slate-900 block mt-0.5">{item.requirements}</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Location</span>
                                  <span className="font-semibold text-slate-700 block mt-0.5">{item.villageArea || item.district ? `${item.villageArea || ''} (${item.district || ''})` : 'N/A'}</span>
                                </div>
                                <div className="border-t border-slate-150 pt-1.5 col-span-2">
                                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Budget</span>
                                  <span className="font-bold text-slate-900 font-mono block mt-0.5">${item.budget.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

              </div>
            );
          })}

          {/* Direct / Walk-In Accordion */}
          {isDirectGroupVisible && (
            <div className="bg-white border border-indigo-150 rounded-2xl shadow-xs overflow-hidden transition-all duration-300">
              <div 
                onClick={() => toggleCollapse('direct')}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none transition-all bg-indigo-50/20 hover:bg-indigo-50/45"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-indigo-600 font-bold text-sm">
                    D
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight inline-flex items-center gap-1.5 flex-wrap">
                      <span>{directGroup.agentName}</span>
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1 font-mono">
                      Route ID: direct
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-500 font-bold ml-12 md:ml-0">
                  <div className="text-center md:text-right">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 leading-none">Customers</span>
                    <span className="text-slate-800 font-mono text-sm block mt-0.5">{directGroup.metrics.totalLeadsCount}</span>
                  </div>
                  <div className="text-center md:text-right">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 leading-none">Volume</span>
                    <span className="text-slate-800 font-mono text-sm block mt-0.5">${directGroup.metrics.totalVolume.toLocaleString()}</span>
                  </div>
                  <div className="text-center md:text-right">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 leading-none">Conversion</span>
                    <span className="block mt-0.5">
                      <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold font-mono text-[10px]">
                        {directGroup.metrics.successRate}% Approvals
                      </span>
                    </span>
                  </div>
                  <div className="text-slate-400 pl-2">
                    {collapsedAgents['direct'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {!collapsedAgents['direct'] && (
                <div className="border-t border-slate-100 animate-slide-down">
                  {directGroup.leads.length === 0 ? (
                    <div className="p-8 text-center bg-white text-slate-400 text-xs font-semibold">
                      No matching direct entry customers currently matching query parameters.
                    </div>
                  ) : (
                    <>
                      {/* DESKTOP DIRECT ENTRY ACCORDION TABLE VIEW */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/60 border-b border-slate-100 text-[10px] font-bold text-slate-405 uppercase tracking-widest font-mono">
                              <th className="px-5 py-3 text-left">Customer</th>
                              <th className="px-5 py-3 text-left">Location (Village / Area)</th>
                              <th className="px-5 py-3 text-left">Requirements Seeked</th>
                              <th className="px-5 py-3 text-right">Budget Size</th>
                              <th className="px-5 py-3 text-center">Status STG</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {directGroup.leads.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/15 duration-100 transition-all font-medium text-slate-700">
                                <td className="px-5 py-3.5">
                                  <div>
                                    <div className="font-extrabold text-slate-900 text-sm leading-tight">{item.customerName}</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-bold flex items-center space-x-1">
                                      <Phone className="w-3 h-3 text-slate-300" />
                                      <span>{item.customerPhone}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-slate-600 leading-tight">
                                  {item.villageArea || item.district ? (
                                    <div>
                                      <div className="font-bold text-slate-800 text-[11px]">{item.villageArea || 'Area Details Pending'}</div>
                                      <div className="text-[10px] text-slate-400 font-medium font-sans mt-0.5 flex items-center space-x-1">
                                        <MapPin className="w-3 h-3 text-slate-300" />
                                        <span>{item.district || 'N/A'}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-350 italic font-medium">None Listed</span>
                                  )}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-1 rounded text-[11px]">
                                    {item.requirements}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-right font-black font-mono text-slate-900 text-sm">
                                  ${item.budget.toLocaleString()}
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border ${getStatusStyle(item.status)}`}>
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* MOBILE DIRECT ENTRY RESPONSIVE ACCORDION CARDS VIEW */}
                      <div className="block md:hidden divide-y divide-slate-100">
                        {directGroup.leads.map((item) => (
                          <div key={item.id} className="p-4 space-y-3 bg-white">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h5 className="font-extrabold text-slate-950 text-xs">{item.customerName}</h5>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-bold flex items-center space-x-1">
                                  <Phone className="w-3 text-slate-300 inline" />
                                  <span>{item.customerPhone}</span>
                                </div>
                              </div>
                              <span className={`inline-block px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded border ${getStatusStyle(item.status)}`}>
                                {item.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-snug">
                              <div>
                                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Requirements</span>
                                <span className="font-bold text-slate-900 block mt-0.5">{item.requirements}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Location</span>
                                <span className="font-semibold text-slate-700 block mt-0.5">{item.villageArea || item.district ? `${item.villageArea || ''} (${item.district || ''})` : 'N/A'}</span>
                              </div>
                              <div className="border-t border-slate-150 pt-1.5 col-span-2">
                                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Budget</span>
                                <span className="font-bold text-slate-900 font-mono block mt-0.5">${item.budget.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      )}

    </div>
  );
}
