import { Lead, Agent, Employee, ActivityLog, LeadStatus, UserRole, Remark, LeadDocument, CruxStatus, StageIApplication, StageIIBankLoan } from './types';

interface Database {
  leads: Lead[];
  agents: Agent[];
  employees: Employee[];
  logs: ActivityLog[];
}

const STORAGE_KEY = 'lead_management_system_db';

const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'agent-1',
    name: 'Alex Agent',
    phone: '9876543210',
    password: 'agent123',
    commissionRate: 0,
    createdAt: '2026-05-15T08:30:00Z',
  },
  {
    id: 'agent-2',
    name: 'Sarah Partner',
    phone: '9876543211',
    password: 'agent123',
    commissionRate: 0,
    createdAt: '2026-05-20T11:15:00Z',
  }
];

const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Jane Employee',
    username: 'emp1',
    phone: '9876543201',
    password: 'emp123',
    createdAt: '2026-05-01T09:00:00Z',
  }
];

const DEFAULT_LEADS: Lead[] = [
  {
    id: 'lead-1',
    customerName: 'Alice Cooper',
    customerPhone: '9123456780',
    customerEmail: 'alice@example.com',
    requirements: 'Home Loan (Purchase)',
    budget: 250000,
    status: LeadStatus.Approved,
    villageArea: 'Greenwood Valley',
    district: 'Kolkata North Side',
    agentContact: '9876543210',
    agentId: 'agent-1',
    agentName: 'Alex Agent',
    employeeId: 'emp-1',
    employeeName: 'Jane Employee',
    commissionAmount: 6250,
    createdAt: '2026-05-16T14:20:00Z',
    updatedAt: '2026-06-01T10:30:00Z',
    consumerNo: 'CON-889123',
    address: 'Block B, 14 Greenwood Valley, Kolkata North Side',
    cruxStatus: CruxStatus.Completed,
    stageIApplication: StageIApplication.ApplicationApproved,
    stageIReason: '',
    stageIIBankLoan: StageIIBankLoan.Disbursed,
    stageIIReason: 'Loan fully disbursed and finalized under Greenwood wing.',
    loanActionDate: '2026-06-01',
    remarks: [
      {
        id: 'r-1',
        date: '2026-05-16T15:00:00Z',
        text: 'Initial credit inquiry completed. Income verification looks strong.',
        authorName: 'Jane Employee',
        authorRole: UserRole.Employee
      },
      {
        id: 'r-2',
        date: '2026-06-01T10:30:00Z',
        text: 'Sanction letter issued and approved by underwriter.',
        authorName: 'Jane Employee',
        authorRole: UserRole.Employee
      }
    ],
    documents: [
      {
        id: 'doc-1',
        name: 'Income_Certificate_Alice.pdf',
        size: '1.2 MB',
        uploadedAt: '2026-05-16T14:45:00Z',
        uploadedBy: 'Jane Employee'
      }
    ]
  },
  {
    id: 'lead-2',
    customerName: 'Robert Dow',
    customerPhone: '9123456781',
    customerEmail: 'robert.d@example.com',
    requirements: 'Business Scaling Loan',
    budget: 150000,
    status: LeadStatus.InProgress,
    villageArea: 'Sunrise Park',
    district: 'Howrah District',
    agentContact: '9876543210',
    agentId: 'agent-1',
    agentName: 'Alex Agent',
    employeeId: 'emp-1',
    employeeName: 'Jane Employee',
    commissionAmount: 3750,
    createdAt: '2026-05-22T09:12:00Z',
    updatedAt: '2026-06-05T16:45:00Z',
    consumerNo: 'CON-112344',
    address: 'Plot 42, Sunrise Park Road, Howrah District',
    cruxStatus: CruxStatus.InProgress,
    stageIApplication: StageIApplication.ApplicationSubmitted,
    stageIReason: 'Waiting for underwriter submission clearance.',
    stageIIBankLoan: StageIIBankLoan.UnderVerification,
    stageIIReason: 'Business tax returns are being audited by processing team.',
    loanActionDate: '',
    remarks: [
      {
        id: 'r-3',
        date: '2026-05-22T10:00:00Z',
        text: 'Assigned to Jane Employee. Requesting audited business financials for 2 years.',
        authorName: 'System Admin',
        authorRole: UserRole.Admin
      },
      {
        id: 'r-4',
        date: '2026-06-05T16:45:00Z',
        text: 'Financials received. Evaluating debt service coverage ratio.',
        authorName: 'Jane Employee',
        authorRole: UserRole.Employee
      }
    ],
    documents: [
      {
        id: 'doc-2',
        name: 'Business_Tax_Returns_2025.pdf',
        size: '4.8 MB',
        uploadedAt: '2026-06-05T16:40:00Z',
        uploadedBy: 'Jane Employee'
      }
    ]
  },
  {
    id: 'lead-3',
    customerName: 'Charlie Miller',
    customerPhone: '9111222333',
    customerEmail: 'charlie.m@example.com',
    requirements: 'Commercial Space Mortgage',
    budget: 500000,
    status: LeadStatus.New,
    villageArea: 'Lakeview Estate',
    district: 'Salt Lake Sector 5',
    agentContact: '9876543211',
    agentId: 'agent-2',
    agentName: 'Sarah Partner',
    employeeId: undefined,
    employeeName: undefined,
    commissionAmount: 15000,
    createdAt: '2026-06-08T11:30:00Z',
    updatedAt: '2026-06-08T11:30:00Z',
    consumerNo: 'CON-775121',
    address: 'Salt Lake Sector 5, Sector V Tech Tower, Room 502',
    cruxStatus: CruxStatus.NotStarted,
    stageIApplication: StageIApplication.NotStarted,
    stageIReason: 'Brand new lead referred by Sarah Partner, waiting for administrative review.',
    stageIIBankLoan: StageIIBankLoan.NotStarted,
    stageIIReason: 'Will start loan vetting post Stage I documentation approvals.',
    loanActionDate: '',
    remarks: [
      {
        id: 'r-5',
        date: '2026-06-08T11:30:00Z',
        text: 'Lead submitted by Agent Sarah Partner. Awaiting admin assignment.',
        authorName: 'Sarah Partner',
        authorRole: UserRole.Agent
      }
    ],
    documents: []
  },
  {
    id: 'lead-4',
    customerName: 'Diana Prince',
    customerPhone: '9888777666',
    customerEmail: 'diana@example.com',
    requirements: 'Personal Line of Credit',
    budget: 45000,
    status: LeadStatus.DocumentPending,
    agentId: undefined,
    agentName: undefined,
    employeeId: 'emp-1',
    employeeName: 'Jane Employee',
    commissionAmount: 0,
    createdAt: '2026-06-02T13:00:00Z',
    updatedAt: '2026-06-04T15:20:00Z',
    consumerNo: 'CON-511092',
    address: 'Apartment 4B, Olympia Villas, Lakeview Estate',
    cruxStatus: CruxStatus.OnHold,
    stageIApplication: StageIApplication.DocumentsPending,
    stageIReason: 'Customer needs signature verification and bank statements for late 3 months.',
    stageIIBankLoan: StageIIBankLoan.NotStarted,
    stageIIReason: 'Loan application on hold until primary document verification completes.',
    loanActionDate: '',
    remarks: [
      {
        id: 'r-6',
        date: '2026-06-02T13:10:00Z',
        text: 'Customer needs quick liquidity. Assigned to Jane.',
        authorName: 'System Admin',
        authorRole: UserRole.Admin
      },
      {
        id: 'r-7',
        date: '2026-06-04T15:20:00Z',
        text: 'Pending signature verification and bank statements for late 3 months.',
        authorName: 'Jane Employee',
        authorRole: UserRole.Employee
      }
    ],
    documents: []
  },
  {
    id: 'lead-5',
    customerName: 'Evan Wright',
    customerPhone: '9666555444',
    customerEmail: 'evan@example.com',
    requirements: 'Auto Loan',
    budget: 35000,
    status: LeadStatus.Rejected,
    agentId: 'agent-2',
    agentName: 'Sarah Partner',
    employeeId: 'emp-1',
    employeeName: 'Jane Employee',
    commissionAmount: 1050,
    createdAt: '2026-05-18T10:00:00Z',
    updatedAt: '2026-05-20T14:15:00Z',
    consumerNo: 'CON-334211',
    address: 'House 8C, Sunrise Park Sector 2, Kolkata',
    cruxStatus: CruxStatus.Rejected,
    stageIApplication: StageIApplication.ApplicationRejected,
    stageIReason: 'Rejected due to multiple historic defaults on credit agency checks.',
    stageIIBankLoan: StageIIBankLoan.Rejected,
    stageIIReason: 'Formal bank loan application rejected due to Stage I credit score failure.',
    loanActionDate: '2026-05-20',
    remarks: [
      {
        id: 'r-8',
        date: '2026-05-18T10:15:00Z',
        text: 'Assigned to Jane.',
        authorName: 'System Admin',
        authorRole: UserRole.Admin
      },
      {
        id: 'r-9',
        date: '2026-05-20T14:15:00Z',
        text: 'Rejected due to multiple historic defaults on personal credit history.',
        authorName: 'Jane Employee',
        authorRole: UserRole.Employee
      }
    ],
    documents: []
  }
];

const DEFAULT_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-05-15T08:30:00Z',
    userId: 'admin',
    userName: 'Admin',
    userRole: UserRole.Admin,
    action: 'Created Agent Account',
    details: 'Created agent: Alex Agent (9876543210)',
  },
  {
    id: 'log-2',
    timestamp: '2026-05-16T14:20:00Z',
    userId: 'agent-1',
    userName: 'Alex Agent',
    userRole: UserRole.Agent,
    action: 'Submitted New Lead',
    details: 'Submitted customer Alice Cooper for Home Loan (Purchase)',
  }
];

export function getDatabase(): Database {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const defaultDb: Database = {
      leads: DEFAULT_LEADS,
      agents: DEFAULT_AGENTS,
      employees: DEFAULT_EMPLOYEES,
      logs: DEFAULT_LOGS,
    };
    saveDatabase(defaultDb);
    return defaultDb;
  }
  try {
    const db = JSON.parse(data);
    // Enforce single employee mandate (there are no other employees)
    if (!db.employees || db.employees.length === 0) {
      db.employees = DEFAULT_EMPLOYEES;
    } else if (db.employees.length > 1 || db.employees[0].id !== 'emp-1') {
      db.employees = [DEFAULT_EMPLOYEES[0]];
    }
    // Reallocate any leads with invalid/other employeeId to emp-1 and ensure all custom fields are populated
    db.leads = db.leads.map((l: any) => {
      const updated = { ...l };
      if (updated.employeeId && updated.employeeId !== 'emp-1') {
        updated.employeeId = 'emp-1';
        updated.employeeName = db.employees[0].name;
      }
      
      if (updated.consumerNo === undefined) {
        updated.consumerNo = 'CON-' + Math.floor(100000 + Math.random() * 900000);
      }
      if (updated.address === undefined) {
        updated.address = updated.villageArea ? `${updated.villageArea}, ${updated.district || 'Kolkata'}` : '123 Customer Lane, Sector V';
      }
      if (updated.cruxStatus === undefined) {
        if (updated.status === LeadStatus.Approved) updated.cruxStatus = CruxStatus.Completed;
        else if (updated.status === LeadStatus.Rejected) updated.cruxStatus = CruxStatus.Rejected;
        else if (updated.status === LeadStatus.InProgress) updated.cruxStatus = CruxStatus.InProgress;
        else updated.cruxStatus = CruxStatus.NotStarted;
      }
      if (updated.stageIApplication === undefined) {
        if (updated.status === LeadStatus.Approved) updated.stageIApplication = StageIApplication.ApplicationApproved;
        else if (updated.status === LeadStatus.Rejected) updated.stageIApplication = StageIApplication.ApplicationRejected;
        else if (updated.status === LeadStatus.InProgress) updated.stageIApplication = StageIApplication.ApplicationUnderProcess;
        else updated.stageIApplication = StageIApplication.NotStarted;
      }
      if (updated.stageIReason === undefined) {
        updated.stageIReason = updated.cruxStatus !== CruxStatus.Completed && updated.stageIApplication !== StageIApplication.ApplicationApproved ? 'Pending verification checks' : '';
      }
      if (updated.stageIIBankLoan === undefined) {
        if (updated.status === LeadStatus.Approved) updated.stageIIBankLoan = StageIIBankLoan.Disbursed;
        else if (updated.status === LeadStatus.Rejected) updated.stageIIBankLoan = StageIIBankLoan.Rejected;
        else if (updated.status === LeadStatus.InProgress) updated.stageIIBankLoan = StageIIBankLoan.UnderVerification;
        else updated.stageIIBankLoan = StageIIBankLoan.NotStarted;
      }
      if (updated.stageIIReason === undefined) {
        updated.stageIIReason = '';
      }
      if (updated.loanActionDate === undefined) {
        updated.loanActionDate = updated.status === LeadStatus.Approved ? '2026-06-01' : '';
      }
      
      return updated;
    });
    return db;
  } catch (e) {
    console.error('Error parsing locale database, resetting...', e);
    const defaultDb: Database = {
      leads: DEFAULT_LEADS,
      agents: DEFAULT_AGENTS,
      employees: DEFAULT_EMPLOYEES,
      logs: DEFAULT_LOGS,
    };
    saveDatabase(defaultDb);
    return defaultDb;
  }
}

export function saveDatabase(db: Database): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function addActivityLog(userId: string, userName: string, userRole: UserRole, action: string, details?: string): void {
  const db = getDatabase();
  const newLog: ActivityLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    userRole,
    action,
    details,
  };
  db.logs.unshift(newLog); // Prepend latest log
  saveDatabase(db);
}

// Leads Operations
export function createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'remarks' | 'documents' | 'commissionAmount'>, createdByUser: { id: string; name: string; role: UserRole }): Lead {
  const db = getDatabase();
  const id = `lead-${Date.now()}`;
  
  // Calculate commission if referred by agent
  let commissionAmount = 0;
  let agentName = leadData.agentName;
  let agentContact = leadData.agentContact;
  if (leadData.agentId) {
    const agent = db.agents.find(a => a.id === leadData.agentId || a.phone === leadData.agentId);
    if (agent) {
      agentName = agent.name;
      agentContact = agent.phone;
    }
  }

  const employeeName = leadData.employeeId ? db.employees.find(e => e.id === leadData.employeeId)?.name : undefined;

  const initialStatus = leadData.status || LeadStatus.New;

  const newLead: Lead = {
    ...leadData,
    id,
    status: initialStatus,
    agentName,
    agentContact,
    employeeName,
    commissionAmount,
    remarks: [
      {
        id: `remark-${Date.now()}`,
        date: new Date().toISOString(),
        text: `Lead created by ${createdByUser.name} (${createdByUser.role})`,
        authorName: createdByUser.name,
        authorRole: createdByUser.role,
      }
    ],
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.leads.unshift(newLead);
  saveDatabase(db);

  addActivityLog(
    createdByUser.id,
    createdByUser.name,
    createdByUser.role,
    'Created Lead',
    `Created lead for customer: ${newLead.customerName} (${newLead.requirements})`
  );

  return newLead;
}

export function updateLead(leadId: string, updatedFields: Partial<Lead>, updatedByUser: { id: string; name: string; role: UserRole }): Lead {
  const db = getDatabase();
  const leadIndex = db.leads.findIndex(l => l.id === leadId);
  if (leadIndex === -1) throw new Error('Lead not found');

  const oldLead = db.leads[leadIndex];
  
  // Clean fields & determine names
  let employeeName = updatedFields.employeeId !== undefined 
    ? (updatedFields.employeeId ? db.employees.find(e => e.id === updatedFields.employeeId)?.name : undefined)
    : oldLead.employeeName;

  let agentName = updatedFields.agentId !== undefined 
    ? (updatedFields.agentId ? db.agents.find(a => a.id === updatedFields.agentId)?.name : undefined)
    : (updatedFields.agentName !== undefined ? updatedFields.agentName : oldLead.agentName);

  let agentContact = updatedFields.agentId !== undefined
    ? (updatedFields.agentId ? db.agents.find(a => a.id === updatedFields.agentId)?.phone : undefined)
    : (updatedFields.agentContact !== undefined ? updatedFields.agentContact : oldLead.agentContact);

  // Re-calculate details if target agent changes
  let commissionAmount = 0;
  const agentId = updatedFields.agentId !== undefined ? updatedFields.agentId : oldLead.agentId;

  if (agentId) {
    const agent = db.agents.find(a => a.id === agentId);
    if (agent) {
      agentName = agent.name;
      agentContact = agent.phone;
    }
  }

  const updatedLead: Lead = {
    ...oldLead,
    ...updatedFields,
    employeeName,
    agentName,
    agentContact,
    commissionAmount,
    updatedAt: new Date().toISOString(),
  };

  // Perform audit logs for specific key changes
  const modifications: string[] = [];
  if (oldLead.status !== updatedLead.status) {
    modifications.push(`status changed from '${oldLead.status}' to '${updatedLead.status}'`);
  }
  if (oldLead.employeeId !== updatedLead.employeeId) {
    modifications.push(`assigned to ${updatedLead.employeeName || 'None'}`);
  }
  if (oldLead.customerName !== updatedLead.customerName) {
    modifications.push(`customer name renamed from '${oldLead.customerName}' to '${updatedLead.customerName}'`);
  }

  db.leads[leadIndex] = updatedLead;
  saveDatabase(db);

  if (modifications.length > 0) {
    addActivityLog(
      updatedByUser.id,
      updatedByUser.name,
      updatedByUser.role,
      'Updated Lead Info',
      `Lead updated: ${updatedLead.customerName} - ${modifications.join(', ')}`
    );
  }

  return updatedLead;
}

export function deleteLead(leadId: string, deletedByUser: { id: string; name: string; role: UserRole }): void {
  const db = getDatabase();
  const lead = db.leads.find(l => l.id === leadId);
  if (!lead) return;

  db.leads = db.leads.filter(l => l.id !== leadId);
  saveDatabase(db);

  addActivityLog(
    deletedByUser.id,
    deletedByUser.name,
    deletedByUser.role,
    'Deleted Lead',
    `Deleted lead of customer: ${lead.customerName}`
  );
}

// Add Remark
export function addLeadRemark(leadId: string, text: string, author: { name: string; role: UserRole }): Remark {
  const db = getDatabase();
  const leadIndex = db.leads.findIndex(l => l.id === leadId);
  if (leadIndex === -1) throw new Error('Lead not found');

  const newRemark: Remark = {
    id: `remark-${Date.now()}`,
    date: new Date().toISOString(),
    text,
    authorName: author.name,
    authorRole: author.role,
  };

  db.leads[leadIndex].remarks.unshift(newRemark); // Add remark to top/start
  db.leads[leadIndex].updatedAt = new Date().toISOString();
  saveDatabase(db);

  addActivityLog(
    author.name, // using name as id for mock simple usage
    author.name,
    author.role,
    'Added Remark',
    `Added a remark to customer ${db.leads[leadIndex].customerName}`
  );

  return newRemark;
}

// Upload document
export function addLeadDocument(leadId: string, docName: string, docSize: string, base64Data: string | undefined, uploader: { name: string; role: UserRole }): LeadDocument {
  const db = getDatabase();
  const leadIndex = db.leads.findIndex(l => l.id === leadId);
  if (leadIndex === -1) throw new Error('Lead not found');

  const newDoc: LeadDocument = {
    id: `doc-${Date.now()}`,
    name: docName,
    size: docSize,
    uploadedAt: new Date().toISOString(),
    uploadedBy: uploader.name,
    fileData: base64Data,
  };

  db.leads[leadIndex].documents.unshift(newDoc);
  db.leads[leadIndex].updatedAt = new Date().toISOString();
  saveDatabase(db);

  addActivityLog(
    uploader.name,
    uploader.name,
    uploader.role,
    'Uploaded Document',
    `Uploaded document "${docName}" for customer ${db.leads[leadIndex].customerName}`
  );

  return newDoc;
}

// Agent Operations
export function createAgent(agentData: Omit<Agent, 'id' | 'createdAt'>, adminUser: { id: string; name: string }): Agent {
  const db = getDatabase();
  const id = `agent-${Date.now()}`;

  // Check if mobile matches
  const exists = db.agents.some(a => a.phone === agentData.phone);
  if (exists) {
    throw new Error('An agent with this mobile number already exists');
  }

  const newAgent: Agent = {
    ...agentData,
    id,
    createdAt: new Date().toISOString(),
  };

  db.agents.unshift(newAgent);
  saveDatabase(db);

  addActivityLog(
    adminUser.id,
    adminUser.name,
    UserRole.Admin,
    'Created Agent',
    `Created agent account: ${newAgent.name} (Phone: ${newAgent.phone})`
  );

  return newAgent;
}

export function updateAgent(agentId: string, updatedFields: Partial<Agent>, adminUser: { id: string; name: string }): Agent {
  const db = getDatabase();
  const idx = db.agents.findIndex(a => a.id === agentId);
  if (idx === -1) throw new Error('Agent not found');

  const oldAgent = db.agents[idx];

  if (updatedFields.phone && updatedFields.phone !== oldAgent.phone) {
    const exists = db.agents.some(a => a.phone === updatedFields.phone && a.id !== agentId);
    if (exists) throw new Error('An agent with this mobile number already exists');
  }

  const updatedAgent: Agent = {
    ...oldAgent,
    ...updatedFields,
  };

  db.agents[idx] = updatedAgent;

  // Keep references in leads updated in case agent name changes
  if (updatedFields.name && updatedFields.name !== oldAgent.name) {
    db.leads = db.leads.map(lead => {
      if (lead.agentId === agentId) {
        return { ...lead, agentName: updatedFields.name };
      }
      return lead;
    });
  }

  saveDatabase(db);

  addActivityLog(
    adminUser.id,
    adminUser.name,
    UserRole.Admin,
    'Updated Agent',
    `Updated agent account: ${updatedAgent.name}`
  );

  return updatedAgent;
}

export function deleteAgent(agentId: string, adminUser: { id: string; name: string }): void {
  const db = getDatabase();
  const agent = db.agents.find(a => a.id === agentId);
  if (!agent) return;

  db.agents = db.agents.filter(a => a.id !== agentId);
  
  // Unassign agent from leads, set them to independent or clear
  db.leads = db.leads.map(lead => {
    if (lead.agentId === agentId) {
      return { ...lead, agentId: undefined, agentName: undefined, commissionAmount: 0 };
    }
    return lead;
  });

  saveDatabase(db);

  addActivityLog(
    adminUser.id,
    adminUser.name,
    UserRole.Admin,
    'Deleted Agent',
    `Deleted agent account: ${agent.name}`
  );
}

// Employee Operations
export function createEmployee(empData: Omit<Employee, 'id' | 'createdAt'>, adminUser: { id: string; name: string }): Employee {
  const db = getDatabase();
  const id = `emp-${Date.now()}`;

  // Check unique username
  const exists = db.employees.some(e => e.username.toLowerCase() === empData.username.toLowerCase());
  if (exists) {
    throw new Error('An employee with this username already exists');
  }

  const newEmp: Employee = {
    ...empData,
    id,
    createdAt: new Date().toISOString(),
  };

  db.employees.unshift(newEmp);
  saveDatabase(db);

  addActivityLog(
    adminUser.id,
    adminUser.name,
    UserRole.Admin,
    'Created Employee',
    `Created employee account: ${newEmp.name} (Username: ${newEmp.username})`
  );

  return newEmp;
}

export function updateEmployee(empId: string, updatedFields: Partial<Employee>, adminUser: { id: string; name: string }): Employee {
  const db = getDatabase();
  const idx = db.employees.findIndex(e => e.id === empId);
  if (idx === -1) throw new Error('Employee not found');

  const oldEmp = db.employees[idx];

  if (updatedFields.username && updatedFields.username.toLowerCase() !== oldEmp.username.toLowerCase()) {
    const exists = db.employees.some(e => e.username.toLowerCase() === updatedFields.username?.toLowerCase() && e.id !== empId);
    if (exists) throw new Error('An employee with this username already exists');
  }

  const updatedEmp: Employee = {
    ...oldEmp,
    ...updatedFields,
  };

  db.employees[idx] = updatedEmp;

  // Keep references in leads updated in case employee name changes
  if (updatedFields.name && updatedFields.name !== oldEmp.name) {
    db.leads = db.leads.map(lead => {
      if (lead.employeeId === empId) {
        return { ...lead, employeeName: updatedFields.name };
      }
      return lead;
    });
  }

  saveDatabase(db);

  addActivityLog(
    adminUser.id,
    adminUser.name,
    UserRole.Admin,
    'Updated Employee',
    `Updated employee account: ${updatedEmp.name}`
  );

  return updatedEmp;
}

export function deleteEmployee(empId: string, adminUser: { id: string; name: string }): void {
  const db = getDatabase();
  const emp = db.employees.find(e => e.id === empId);
  if (!emp) return;

  db.employees = db.employees.filter(e => e.id !== empId);
  
  // Unassign agent from leads, set them of status New or unassigned
  db.leads = db.leads.map(lead => {
    if (lead.employeeId === empId) {
      return { ...lead, employeeId: undefined, employeeName: undefined };
    }
    return lead;
  });

  saveDatabase(db);

  addActivityLog(
    adminUser.id,
    adminUser.name,
    UserRole.Admin,
    'Deleted Employee',
    `Deleted employee account: ${emp.name} and unassigned their leads`
  );
}

// Reset password for any account type
export function resetUserPassword(targetId: string, targetRole: UserRole, newPass: string, adminUser: { id: string; name: string }): void {
  const db = getDatabase();
  let name = '';

  if (targetRole === UserRole.Agent) {
    const idx = db.agents.findIndex(a => a.id === targetId);
    if (idx !== -1) {
      db.agents[idx].password = newPass;
      name = db.agents[idx].name;
    }
  } else if (targetRole === UserRole.Employee) {
    const idx = db.employees.findIndex(e => e.id === targetId);
    if (idx !== -1) {
      db.employees[idx].password = newPass;
      name = db.employees[idx].name;
    }
  }

  if (!name) throw new Error('User not found');

  saveDatabase(db);
  addActivityLog(
    adminUser.id,
    adminUser.name,
    UserRole.Admin,
    'Password Reset',
    `Reset password for ${targetRole}: ${name}`
  );
}

// Export data to CSV helper
export function exportLeadsToCSV(leadsToExport: Lead[]): string {
  const headers = [
    'SL No',
    'Customer Name',
    'Registered Phone',
    'Consumer No',
    'Address',
    'CRUX Status',
    'Stage I - Application',
    'Stage I - Reason for Pending/Not Starting',
    'Stage II - Bank Loan',
    'Stage II - Reason for Pending/Not Starting/Rejection & Additional Remarks',
    'Date of Loan Sanction/Disbursement/Rejection',
    'Last Updated'
  ];

  const rows = leadsToExport.map((l, index) => [
    index + 1,
    `"${l.customerName.replace(/"/g, '""')}"`,
    l.customerPhone,
    `"${l.consumerNo.replace(/"/g, '""')}"`,
    `"${(l.address || '').replace(/"/g, '""')}"`,
    `"${l.cruxStatus}"`,
    `"${l.stageIApplication}"`,
    `"${(l.stageIReason || '').replace(/"/g, '""')}"`,
    `"${l.stageIIBankLoan}"`,
    `"${(l.stageIIReason || '').replace(/"/g, '""')}"`,
    `"${l.loanActionDate || ''}"`,
    l.updatedAt
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  return csvContent;
}
