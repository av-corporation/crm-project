export type UserRole = 'admin' | 'manager' | 'sales' | 'user';

export interface UserProfile {
  uid: string;
  email?: string;
  username?: string;
  mobile?: string;
  role: UserRole;
  name: string;
  fullName?: string;
  password?: string;
  mustChangePassword?: boolean;
  isPrimary?: boolean;
  photoUrl?: string;
  companyName?: string;
  createdAt: string;
}

export type LeadStatus = string;

export interface StatusConfig {
  id: string;
  label: string;
  color: string;
  order: number;
  isDefault?: boolean;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
  city?: string;
  address?: string;
  products: { name: string; quantity: number }[];
  status: LeadStatus;
  followUpDate?: string;
  source?: string;
  priority?: 'Hot' | 'Warm' | 'Cold';
  tags?: string[];
  createdBy: string; // User UID
  assignedTo?: string; // User UID
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface Note {
  id: string;
  leadId: string;
  createdBy: string;
  note: string;
  followUpDate?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  leadId?: string;
  action: string;
  details?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  leadId: string;
  status: 'pending' | 'completed';
  taskStatus?: 'pending' | 'completed'; // For backward compatibility if needed
  taskTitle?: string; // For backward compatibility if needed
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  createdBy: string;
  assignedTo: string;
  createdAt: string;
}
