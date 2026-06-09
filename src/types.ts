export enum UserRole {
  Admin = 'Admin',
  Employee = 'Employee',
  Agent = 'Agent',
}

export enum LeadStatus {
  New = 'New',
  Contacted = 'Contacted',
  InProgress = 'In Progress',
  DocumentPending = 'Document Pending',
  Submitted = 'Submitted',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export enum CruxStatus {
  NotStarted = 'Not Started',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Rejected = 'Rejected',
  OnHold = 'On Hold',
}

export enum StageIApplication {
  NotStarted = 'Not Started',
  DocumentsPending = 'Documents Pending',
  DocumentsReceived = 'Documents Received',
  ApplicationUnderProcess = 'Application Under Process',
  ApplicationSubmitted = 'Application Submitted',
  ApplicationApproved = 'Application Approved',
  ApplicationRejected = 'Application Rejected',
}

export enum StageIIBankLoan {
  NotStarted = 'Not Started',
  LoanApplicationSubmitted = 'Loan Application Submitted',
  UnderVerification = 'Under Verification',
  Sanctioned = 'Sanctioned',
  Disbursed = 'Disbursed',
  Rejected = 'Rejected',
}

export interface Remark {
  id: string;
  date: string;
  text: string;
  authorName: string;
  authorRole: UserRole;
}

export interface LeadDocument {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  fileData?: string; // Stored as Base64 in local storage for high-fidelity interactive preview
}

export interface Lead {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  requirements: string; // e.g. Home Loan, Personal Loan, Visa Agent, Real Estate, etc.
  budget: number;
  status: LeadStatus;
  villageArea?: string; // Village or Area of Customer
  district?: string; // District of Customer
  agentContact?: string; // Direct Mobile/Contact of Referrer Agent
  agentId?: string; // Mobile or ID of agent referrer
  agentName?: string;
  employeeId?: string; // ID of employee assigned
  employeeName?: string;
  remarks: Remark[];
  documents: LeadDocument[];
  commissionAmount: number;
  createdAt: string;
  updatedAt: string;
  
  // Custom Employee Portal Fields
  consumerNo: string;
  address: string;
  cruxStatus: CruxStatus;
  stageIApplication: StageIApplication;
  stageIReason: string;
  stageIIBankLoan: StageIIBankLoan;
  stageIIReason: string;
  loanActionDate?: string;
}

export interface Agent {
  id: string;
  name: string;
  phone: string; // Mobile login: username is phone
  password: string;
  commissionRate: number; // e.g., 2 for 2%
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  username: string; // Used to login
  phone: string; // Optional mobile login
  password: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details?: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  identifier: string; // e.g. "admin", username, or phone
}
