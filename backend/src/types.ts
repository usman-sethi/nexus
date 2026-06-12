export enum UserRole {
  STUDENT = "STUDENT",
  CLIENT = "CLIENT",
  ADMIN = "ADMIN"
}

export enum VerificationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  isVerifiedStudent: boolean;
  verificationStatus: VerificationStatus;
  loginHistory: {
    timestamp: string;
    ip: string;
    device: string;
  }[];
}

export interface StudentProfile {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  headline: string;
  bio: string;
  skills: string[];
  university: string;
  department: string;
  degreeProgram: string;
  degreeYear: string;
  studentIdCardUrl?: string;
  portfolio: PortfolioItem[];
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
  };
  crsScore: number; // Campus Reputation Score
  verificationStatus: VerificationStatus;
  reviews: Review[];
  rating: number; // Computed average rating
  activeOpportunityCount: number;
  completedProjectCount: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  mediaType: "image" | "video" | "pdf" | "link";
  mediaUrl: string; // URL of the item or reference
  githubUrl?: string;
  liveUrl?: string;
  createdAt: string;
}

export interface ServiceGig {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  studentCrs: number;
  studentUniversity: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  startingPrice: number;
  deliveryTimeDays: number;
  gallery: string[];
  faqs: {
    question: string;
    answer: string;
  }[];
  createdAt: string;
}

export interface Opportunity {
  id: string;
  clientId: string;
  clientName: string;
  clientCompany?: string;
  clientAvatar: string;
  title: string;
  description: string;
  category: string;
  type: "PROJECT" | "INTERNSHIP" | "PART_TIME";
  budget: number;
  deliveryTimeDays: number;
  skillsRequired: string[];
  universityLimit?: string; // e.g. "University of Peshawar" (preferred or restricted)
  createdAt: string;
  deadline: string;
  applicationsCount: number;
}

export interface Application {
  id: string;
  opportunityId: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  studentCrs: number;
  proposalText: string;
  requestedBudget: number;
  deliveryDays: number;
  attachedPortfolioIds: string[];
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  reviewComment?: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number; // 1-5
  comment: string;
  replyText?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar: string;
    role: UserRole;
  }[];
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: Record<string, number>; // keyed by userId
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  attachmentUrl?: string;
  attachmentType?: "image" | "pdf" | "video";
  timestamp: string;
  isRead: boolean;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  fullName: string;
  university: string;
  department: string;
  degreeProgram: string;
  studentIdNum: string;
  idCardUrl: string;
  profileImageUrl: string;
  status: VerificationStatus;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: "MESSAGE" | "REVIEW" | "VERIFICATION" | "APPLICATION" | "OPPORTUNITY";
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface SystemAnalytics {
  totalStudents: number;
  totalClients: number;
  verifiedStudents: number;
  totalGigs: number;
  totalOpportunities: number;
  activeApplications: number;
  totalVolumePKR: number; // Completed financial equivalent in PKR
}
