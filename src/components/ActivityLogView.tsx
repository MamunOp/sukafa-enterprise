import React, { useState } from 'react';
import { getDatabase } from '../store';
import { UserRole } from '../types';
import { Search, Shield, Briefcase, User, Calendar, Trash2, Clock, AlertTriangle } from 'lucide-react';

export default function ActivityLogView() {
  const [db, setDb] = useState(getDatabase());
  const [filterQuery, setFilterQuery] = useState('');

  const reloadLogs = () => {
    setDb(getDatabase());
  };

  const clearAllLogs = () => {
    if (confirm('Are you sure you want to clear all historical log registers? This is irreversible.')) {
      const currentDb = getDatabase();
      currentDb.logs = [];
      localStorage.setItem('lead_management_system_db', JSON.stringify(currentDb));
      reloadLogs();
    }
  };

  const filteredLogs = db.logs.filter(log => {
    const q = filterQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.userRole.toLowerCase().includes(q) ||
      (log.details && log.details.toLowerCase().includes(q))
    );
  });

  const getActorBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.Admin:
        return 'bg-slate-900 text-white border-slate-900';
      case UserRole.Employee:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case UserRole.Agent:
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-150 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-950 font-sans tracking-tight">Security Audit Logs</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Track authorized personnel logins, document submissions, status modifications, and systemic updates.
          </p>
        </div>

        {db.logs.length > 0 && (
          <button
            id="clear-logs-btn"
            onClick={clearAllLogs}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 font-bold text-xs uppercase tracking-wider rounded-xl border border-rose-100 transition-all cursor-pointer flex items-center space-x-1"
          >
            <Trash2 className="w-4 h-4" />
            <span>Wipe History Logs</span>
          </button>
        )}
      </div>

      {/* FILTER SEARCH FIELD */}
      <div className="relative max-w-md bg-white">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          id="logs-search-input"
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter log entries by actor, actions, details..."
          className="w-full text-sm pl-9 pr-3 py-2.5 border border-slate-250 bg-white text-slate-950 placeholder-slate-405 rounded-xl focus:outline-none focus:border-slate-850"
        />
      </div>

      {/* LOG HISTORICAL LISTING */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-450 font-medium">
            No activity registers match your search filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/40 transition-all">
                
                {/* ACTOR & TIME */}
                <div className="space-y-1.5 flex-1 text-left">
                  <div className="flex items-center flex-wrap gap-2.5">
                    
                    {/* Timestamp icon */}
                    <div className="inline-flex items-center space-x-1.5 text-xs text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Actor label */}
                    <span className={`inline-flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getActorBadge(log.userRole)}`}>
                      {log.userRole === UserRole.Admin && <Shield className="w-3 h-3" />}
                      {log.userRole === UserRole.Employee && <Briefcase className="w-3 h-3" />}
                      {log.userRole === UserRole.Agent && <User className="w-3 h-3" />}
                      <span>{log.userName}</span>
                    </span>

                  </div>

                  {/* Core Action */}
                  <h4 className="font-bold text-sm text-slate-900 tracking-tight pt-1">
                    {log.action}
                  </h4>

                  {/* Details paragraph */}
                  {log.details && (
                    <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-2xl bg-slate-50/50 p-2.5 rounded-xl border border-dashed border-slate-150 inline-block w-full">
                      {log.details}
                    </p>
                  )}
                </div>

                {/* LOG ENTRY UNIQUE IDENTIFIER */}
                <div className="text-[10px] font-mono text-slate-350 self-end sm:self-start bg-slate-50 px-2 py-0.5 rounded">
                  {log.id}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
