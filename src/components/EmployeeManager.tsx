import React, { useState, useEffect } from 'react';
import { Employee, CurrentUser, UserRole } from '../types';
import { getDatabase, updateEmployee, resetUserPassword } from '../store';
import { Edit2, Key, Check, Smartphone, User, Shield, Eye, EyeOff, Save, AlertCircle } from 'lucide-react';

interface EmployeeManagerProps {
  currentUser: CurrentUser;
}

export default function EmployeeManager({ currentUser }: EmployeeManagerProps) {
  const [db, setDb] = useState(getDatabase());
  const [employee, setEmployee] = useState<Employee | null>(null);

  // Form edit states
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');

  // Password reset inline state
  const [isResetting, setIsResetting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const database = getDatabase();
    setDb(database);
    if (database.employees && database.employees.length > 0) {
      setEmployee(database.employees[0]);
    }
  }, []);

  const startEdit = () => {
    if (!employee) return;
    setName(employee.name);
    setUsername(employee.username);
    setPhone(employee.phone || '');
    setErrorMsg('');
    setSuccessMsg('');
    setIsEditing(true);
    setIsResetting(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!employee) return;
    if (!name.trim() || !username.trim() || !phone.trim()) {
      setErrorMsg('All fields are required');
      return;
    }

    try {
      const updated = updateEmployee(employee.id, {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        phone: phone.trim()
      }, currentUser);

      // Refresh DB state
      const database = getDatabase();
      setDb(database);
      setEmployee(updated);
      setIsEditing(false);
      setSuccessMsg('Employee details updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving changes.');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!employee) return;
    if (!newPassword.trim()) {
      setErrorMsg('Please enter a valid password.');
      return;
    }

    try {
      resetUserPassword(
        employee.id,
        UserRole.Employee,
        newPassword.trim(),
        currentUser
      );

      // Refresh DB state
      const database = getDatabase();
      setDb(database);
      setEmployee(database.employees[0]);
      setIsResetting(false);
      setNewPassword('');
      setSuccessMsg(`Access PIN for "${employee.name}" has been successfully updated!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error resetting password.');
    }
  };

  if (!employee) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-500">No active employee found in database.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER PANEL */}
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-xl font-bold text-slate-950 font-sans tracking-tight">Manage Employee Panel</h2>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Review, modify, and authorize credentials of the single system processor filling and managing all incoming leads.
        </p>
      </div>

      {/* FEEDBACK STATUSES */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-600 flex items-center space-x-2 animate-fade-in text-left">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-800 flex items-center space-x-2 animate-fade-in text-left">
          <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* PROFILE INFORMATION DISPLAY (Left Column) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 text-left">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">Current Account Status</h3>
            <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-50 text-emerald-800 font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1" />
              Active System Processor
            </span>
          </div>

          {!isEditing ? (
            /* NON-EDIT VIEW */
            <div className="space-y-6">
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-white flex items-center justify-center font-black text-lg">
                  {employee.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{employee.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Processor Portfolio manager</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-xs">
                <div>
                  <span className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-0.5">System Username</span>
                  <span className="font-bold text-indigo-700 font-mono bg-indigo-50/45 px-2 py-1 rounded text-sm block border border-indigo-100/30">
                    {employee.username}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-0.5">Mobile Contact</span>
                  <span className="font-bold text-slate-800 font-mono bg-slate-50 px-2 py-1 rounded text-sm block border border-slate-150">
                    {employee.phone}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsResetting(true);
                    setIsEditing(false);
                    setNewPassword('');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </button>
              </div>

            </div>
          ) : (
            /* EDIT PROFILE FORM */
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Employee Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm pl-9 pr-3 py-2 border border-slate-250 bg-white text-slate-900 rounded-lg focus:outline-none focus:border-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">System Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-250 bg-white text-slate-900 rounded-lg focus:outline-none focus:border-slate-800 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Mobile Contact</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Smartphone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-sm pl-9 pr-3 py-2 border border-slate-250 bg-white text-slate-900 rounded-lg focus:outline-none focus:border-slate-800 font-mono font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold uppercase rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1 py-2 px-4 bg-slate-900 text-white hover:bg-slate-800 font-bold uppercase rounded-lg text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>

            </form>
          )}

        </div>

        {/* SECURITY & PASSWORDS SIDEBAR (Right Column) */}
        <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between text-left space-y-4">
          
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 font-mono flex items-center space-x-1">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>System Operations Guard</span>
            </h3>

            {!isResetting ? (
              <div className="space-y-3">
                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                  All customer leads are routing directly to <strong>{employee.name}</strong> as the sole system operator. To view and trace security login keys, toggle below:
                </p>
                <div className="bg-white border border-slate-150 p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Credentials PIN</span>
                    <span className="font-mono text-sm font-bold text-slate-800">
                      {showPwd ? employee.password : '••••••••'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPwd(!showPwd)}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-lg transition-all"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              /* RESET PASSWORD INLINE FORM */
              <form onSubmit={handleResetPassword} className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">New Password PIN</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. processorSecret123"
                  className="w-full text-xs p-2.5 border border-slate-250 bg-white rounded-lg focus:outline-none focus:border-slate-800 font-mono font-semibold"
                />

                <div className="flex space-x-1.5 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wide"
                  >
                    Save PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsResetting(false); setNewPassword(''); }}
                    className="px-3 py-2 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-lg text-xs font-bold uppercase"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="bg-indigo-50 border border-indigo-150 p-3.5 rounded-xl text-[11px] text-indigo-700 font-semibold leading-normal">
            No addition/deletion of staff accounts is necessary or allowed, since all operations are funneled through this singular operator.
          </div>

        </div>

      </div>

    </div>
  );
}
