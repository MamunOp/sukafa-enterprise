import React, { useState } from 'react';
import { UserRole, CurrentUser } from '../types';
import { getDatabase, addActivityLog } from '../store';
import { Shield, Briefcase, UserCheck, Lock, Smartphone, User, Sparkles } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: CurrentUser) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.Admin);
  
  // Generic states
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const db = getDatabase();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (activeRole === UserRole.Admin) {
      if (username.toLowerCase() === 'admin' && password === 'admin123') {
        const adminUser: CurrentUser = {
          id: 'admin',
          name: 'System Admin',
          role: UserRole.Admin,
          identifier: 'admin',
        };
        addActivityLog('admin', 'System Admin', UserRole.Admin, 'Logged In', 'Admin session started');
        onLoginSuccess(adminUser);
      } else {
        setErrorMessage('Invalid Admin credentials. Try admin / admin123');
      }
    } else if (activeRole === UserRole.Employee) {
      // Find matching employee by username OR phone
      const emp = db.employees.find(
        e => (e.username.toLowerCase() === username.toLowerCase() || e.phone === phone) && e.password === password
      );

      if (emp) {
        const empUser: CurrentUser = {
          id: emp.id,
          name: emp.name,
          role: UserRole.Employee,
          identifier: emp.username,
        };
        addActivityLog(emp.id, emp.name, UserRole.Employee, 'Logged In', 'Employee session started');
        onLoginSuccess(empUser);
      } else {
        setErrorMessage('Invalid employee credentials. Check username/mobile and password.');
      }
    } else if (activeRole === UserRole.Agent) {
      // Find matching agent by phone (mobile)
      const agent = db.agents.find(a => a.phone === phone && a.password === password);

      if (agent) {
        const agentUser: CurrentUser = {
          id: agent.id,
          name: agent.name,
          role: UserRole.Agent,
          identifier: agent.phone,
        };
        addActivityLog(agent.id, agent.name, UserRole.Agent, 'Logged In', 'Agent session started');
        onLoginSuccess(agentUser);
      } else {
        setErrorMessage('Invalid agent credentials. Check mobile number and password.');
      }
    }
  };

  const autofill = (role: UserRole) => {
    setActiveRole(role);
    setErrorMessage('');
    if (role === UserRole.Admin) {
      setUsername('admin');
      setPhone('');
      setPassword('admin123');
    } else if (role === UserRole.Employee) {
      setUsername('emp1');
      setPhone('9876543201');
      setPassword('emp123');
    } else if (role === UserRole.Agent) {
      setUsername('');
      setPhone('9876543210');
      setPassword('agent123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        
        {/* LOGO AREA */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-xl mb-3 shadow-md">
            L
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Lead Management System
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Secure client tracking and CRM portal
          </p>
        </div>

        {/* ROLE SELECTION TABS */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            id="login-role-admin"
            type="button"
            onClick={() => {
              setActiveRole(UserRole.Admin);
              setErrorMessage('');
              setUsername('');
              setPhone('');
              setPassword('');
            }}
            className={`flex flex-col items-center py-2.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeRole === UserRole.Admin
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-4 h-4 mb-1" />
            Admin
          </button>
          
          <button
            id="login-role-employee"
            type="button"
            onClick={() => {
              setActiveRole(UserRole.Employee);
              setErrorMessage('');
              setUsername('');
              setPhone('');
              setPassword('');
            }}
            className={`flex flex-col items-center py-2.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeRole === UserRole.Employee
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4 mb-1" />
            Employee
          </button>
          
          <button
            id="login-role-agent"
            type="button"
            onClick={() => {
              setActiveRole(UserRole.Agent);
              setErrorMessage('');
              setUsername('');
              setPhone('');
              setPassword('');
            }}
            className={`flex flex-col items-center py-2.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeRole === UserRole.Agent
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4 mb-1" />
            Agent
          </button>
        </div>

        {/* LOGIN FORM */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            {/* Conditional Input based on Active Role */}
            {activeRole === UserRole.Admin && (
              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="admin-username-input"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter 'admin'"
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}

            {activeRole === UserRole.Employee && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">
                    Username / Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="employee-user-input"
                      type="text"
                      required
                      value={username || phone}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setPhone(e.target.value);
                      }}
                      placeholder="Username (e.g. emp1) or Phone"
                      className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeRole === UserRole.Agent && (
              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Smartphone className="w-4 h-4" />
                  </span>
                  <input
                    id="agent-phone-input"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter agent phone number"
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Password input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="login-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs font-medium text-rose-600">
              {errorMessage}
            </div>
          )}

          <div>
            <button
              id="login-submit-button"
              type="submit"
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all cursor-pointer"
            >
              Sign In to Portal
            </button>
          </div>
        </form>

        {/* SEPARATOR */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2.5 text-slate-400 font-semibold tracking-wide">
              Quick Demo Access
            </span>
          </div>
        </div>

        {/* DEMO SHORTCUT BUTTONS */}
        <div className="space-y-2">
          <button
            id="demo-admin-btn"
            type="button"
            onClick={() => autofill(UserRole.Admin)}
            className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-100 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all text-left"
          >
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Sign In as <strong className="text-slate-900">Admin</strong></span>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">admin / admin123</span>
          </button>

          <button
            id="demo-employee-btn"
            type="button"
            onClick={() => autofill(UserRole.Employee)}
            className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-100 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all text-left"
          >
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span>Sign In as <strong className="text-slate-900">Employee</strong></span>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">emp1 / emp123</span>
          </button>

          <button
            id="demo-agent-btn"
            type="button"
            onClick={() => autofill(UserRole.Agent)}
            className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-100 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all text-left"
          >
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-amber-500" />
              <span>Sign In as <strong className="text-slate-900">Agent</strong></span>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">9876543210 / agent123</span>
          </button>
        </div>

        <div className="pt-4 text-center border-t border-slate-100">
          <div className="inline-flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Secure Role-Based Dashboard Control Enabled</span>
          </div>
        </div>

      </div>
    </div>
  );
}
