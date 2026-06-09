import React, { useState } from 'react';
import { Agent, CurrentUser } from '../types';
import { getDatabase, createAgent, updateAgent, deleteAgent, resetUserPassword } from '../store';
import { Plus, Edit2, Trash2, Key, X, Smartphone, User, Sparkles, Percent, Eye, EyeOff } from 'lucide-react';

interface AgentManagerProps {
  currentUser: CurrentUser;
}

export default function AgentManager({ currentUser }: AgentManagerProps) {
  const [db, setDb] = useState(getDatabase());
  const [isAdding, setIsAdding] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [resettingAgent, setResettingAgent] = useState<Agent | null>(null);

  // Input states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState<{[key: string]: boolean}>({});

  const [errorMsg, setErrorMsg] = useState('');

  const reloadData = () => {
    const freshDb = getDatabase();
    setDb(freshDb);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      createAgent({
        name: name.trim(),
        phone: phone.trim(),
        password: password.trim() || 'agent123',
        commissionRate: 0,
      }, currentUser);

      setIsAdding(false);
      setName('');
      setPhone('');
      setPassword('');
      reloadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving');
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!editingAgent) return;
    try {
      updateAgent(editingAgent.id, {
        name: name.trim(),
        phone: phone.trim(),
        commissionRate: 0,
      }, currentUser);

      setEditingAgent(null);
      setName('');
      setPhone('');
      reloadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving');
    }
  };

  const triggerEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setIsAdding(false);
    setResettingAgent(null);
    setName(agent.name);
    setPhone(agent.phone);
  };

  const handleDelete = (agentId: string, agentName: string) => {
    if (confirm(`Are you sure you want to delete Agent "${agentName}"? Any leads submitted by them will be unassigned from agent partnership.`)) {
      deleteAgent(agentId, currentUser);
      reloadData();
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingAgent || !newPassword.trim()) return;
    
    resetUserPassword(resettingAgent.id, resettingAgent.createdAt ? resettingAgent.createdAt && (resettingAgent as any).role || 'Agent' as any : 'Agent' as any, newPassword.trim(), currentUser);
    setResettingAgent(null);
    setNewPassword('');
    alert(`Reset successful! "${resettingAgent.name}"'s password has been updated.`);
    reloadData();
  };

  const toggleShowPwd = (id: string) => {
    setShowPwd(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-950 font-sans tracking-tight">Agent Partner Directory</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Register and manage third-party financial consultants, review their base payout rates, and verify log-in credentials.
          </p>
        </div>

        {!isAdding && !editingAgent && !resettingAgent && (
          <button
            id="add-agent-trigger"
            onClick={() => {
              setIsAdding(true);
              setEditingAgent(null);
              setResettingAgent(null);
              setName('');
              setPhone('');
              setPassword('');
              setErrorMsg('');
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Agent</span>
          </button>
        )}
      </div>

      {/* ERROR DISPLAY */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-600">
          {errorMsg}
        </div>
      )}

      {/* FORM: ADD OR EDIT AGENT */}
      {(isAdding || editingAgent) && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm max-w-xl animate-fade-in text-left">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
              {isAdding ? 'Register New External Agent' : `Update Account: ${editingAgent?.name}`}
            </h3>
            <button
              id="close-agent-form"
              onClick={() => {
                setIsAdding(false);
                setEditingAgent(null);
                setName('');
                setPhone('');
                setPassword('');
                setErrorMsg('');
              }}
              className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={isAdding ? handleCreate : handleUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Agent Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="agent-mgr-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Agent"
                  className="w-full text-sm pl-9 pr-3 py-2 border border-slate-250 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Contact Mobile (Username)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Smartphone className="w-4 h-4" />
                </span>
                <input
                  id="agent-mgr-phone-input"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full text-sm pl-9 pr-3 py-2 border border-slate-250 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>

             {isAdding && (
              <div className="col-span-2 sm:col-span-1 text-left">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Set Starting Password</label>
                <input
                  id="agent-mgr-pwd-input"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Defaults to agent123"
                  className="w-full text-sm p-2 border border-slate-250 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>
            )}

            <div className="col-span-2 flex justify-end space-x-2 pt-2 border-t border-slate-250 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingAgent(null);
                  setErrorMsg('');
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold uppercase text-slate-600"
              >
                Cancel
              </button>
              <button
                id="save-agent-submit"
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase"
              >
                {isAdding ? 'Register Partner' : 'Apply Updates'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* FORM: PASSWORD RESET INLINE */}
      {resettingAgent && (
        <div className="bg-slate-50 border border-indigo-200 rounded-2xl p-6 shadow-sm max-w-xl animate-fade-in text-left">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <h3 className="font-bold text-xs text-indigo-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Key className="w-4 h-4" />
              <span>Reset Access PIN: {resettingAgent.name}</span>
            </h3>
            <button
              onClick={() => { setResettingAgent(null); setNewPassword(''); }}
              className="p-1 hover:bg-slate-200 text-slate-400 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">New Password Key</label>
              <input
                id="agent-reset-pwd-input"
                type="text"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter strong password (e.g. Partner987)"
                className="w-full text-sm p-2.5 border border-slate-250 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:outline-none focus:border-slate-850"
              />
            </div>

            <div className="flex justify-end space-x-2 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => { setResettingAgent(null); setNewPassword(''); }}
                className="px-3.5 py-1.5 bg-slate-200 text-xs font-semibold text-slate-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                id="agent-reset-pwd-submit"
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase rounded-lg"
              >
                Update Access Pin
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AGENTS LIST */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden text-left">
        {db.agents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium">No registered agents available in the directory.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4 text-left">Partner Agent</th>
                  <th className="px-6 py-4 text-left">Mobile Number</th>
                  <th className="px-6 py-4 text-center">Referred Clients</th>
                  <th className="px-6 py-4 text-center">Assigned Access Key</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {db.agents.map((ag) => {
                  const leadCount = db.leads.filter(l => l.agentId === ag.id || l.agentId === ag.phone).length;
                  return (
                    <tr key={ag.id} className="hover:bg-slate-50/50 transition-all font-medium text-slate-800">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                            {ag.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs leading-none">{ag.name}</div>
                            <div className="text-[10px] text-slate-450 leading-none mt-1">Partner since {new Date(ag.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-xs font-mono">{ag.phone}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {leadCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center space-x-1 font-mono text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                          <span>{showPwd[ag.id] ? ag.password : '••••••••'}</span>
                          <button
                            onClick={() => toggleShowPwd(ag.id)}
                            className="p-0.5 hover:text-slate-900 transition-all cursor-pointer text-slate-400"
                            title="Toggle Password View"
                          >
                            {showPwd[ag.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => { setResettingAgent(ag); setEditingAgent(null); setIsAdding(false); }}
                            className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            title="Reset Password Pin"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => triggerEdit(ag)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Edit Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ag.id, ag.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Agent Link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
