/**
 * MediBrid - Your Health Partner
 * Core TypeScript definitions
 */

export type UserRole = 'user' | 'clinic_owner' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  status?: 'active' | 'blocked';
  createdAt: string;
  updatedAt: string;
  fcmToken?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  district?: string;
}

export interface ClinicWorkingHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface Clinic {
  id: string; // clinicId
  ownerId: string;
  clinicName: string;
  logoUrl?: string;
  coverImageUrl?: string;
  description: string;
  about?: string;
  clinicType?: string;
  phone: string;
  email: string;
  whatsapp?: string;
  address: string;
  locality?: string;
  district?: string;
  city: string;
  state: string;
  pinCode: string;
  latitude?: number;
  longitude?: number;
  // Use mapping for days (monday, tuesday, etc.)
  workingHours?: Record<string, ClinicWorkingHours>;
  emergencyAvailable: boolean;
  services: string[];
  specializations: string[];
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'pending' | 'suspended';
  verified: boolean;
  verificationDocs?: string[];
}

export interface Doctor {
  id: string; // doctorId
  clinicId: string;
  name: string;
  photoUrl?: string;
  specialization: string;
  qualification: string;
  experience: number;
  phone: string;
  email: string;
  consultationFee: number;
  availableDays: string[];
  availableTime: string;
  inClinicConsultation?: boolean;
  onlineConsultation?: boolean;
  about: string;
  languages: string[];
  registrationNumber?: string;
  createdAt: string;
  active: boolean;
}

export interface Laboratory {
  id: string; // labId
  clinicId: string;
  name: string;
  logoUrl?: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  availableTests: string[];
  openingHours: string;
  workingDays: string[];
  homeSampleCollection: boolean;
  active: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  clinicId: string;
  doctorId?: string; // Optional if booked directly with clinic or laboratory
  doctorName?: string;
  serviceName: string;
  date: string; // "YYYY-MM-DD"
  formattedDate: string; // "Tuesday, 12 August 2026"
  timeSlot: string; // "10:20 AM"
  status: 'upcoming' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: 'approved' | 'pending' | 'hidden';
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  link?: string;
  active: boolean;
  createdAt: string;
}

export interface Chat {
  id: string;
  patientId: string;
  patientName: string;
  clinicId: string;
  clinicName: string;
  lastMessage: string;
  lastMessageTime: string;
  participants: string[];
  readBy: string[];
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  active: boolean;
  createdAt: string;
}

