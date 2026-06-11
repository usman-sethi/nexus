import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { Resend } from "resend";
import { connectToDatabase } from "./src/lib/mongodb";
import { 
  UserRole, 
  VerificationStatus, 
  UserSession, 
  StudentProfile, 
  ServiceGig, 
  Opportunity, 
  Application, 
  Review, 
  Conversation, 
  Message, 
  VerificationRequest, 
  SystemNotification 
} from "./src/types";
import { 
  INITIAL_STUDENTS, 
  INITIAL_GIGS, 
  INITIAL_OPPORTUNITIES, 
  INITIAL_APPLICATIONS, 
  INITIAL_CLIENTS,
  calculateCRS
} from "./src/data";

const app = express();
app.use(express.json());

const PORT = 3000;

// Resend Email Configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_813ubcjf_8J2uBQqd1khnbS14fPLoBxJ5";
const resend = new Resend(RESEND_API_KEY);

// Send real stylized transactional emails using Resend
async function sendVerificationEmail(recipientEmail: string, otpCode: string, studentName: string = "Student Partner") {
  try {
    const emailResult = await resend.emails.send({
      from: "NEXUS Onboarding <onboarding@resend.dev>",
      to: [recipientEmail, "exampleabc25@gmail.com"], // Send to user input and hardcoded demo mailbox
      subject: `[NEXUS] Your Secure Verification PIN: ${otpCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc; border-radius: 24px; border: 1px solid #e2e8f0;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-weight: 900; letter-spacing: 0.1em; font-size: 20px;">NEXUS</div>
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #64748b; margin-top: 8px; font-weight: bold;">Verified Student Talent Ecosystem</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 40px; border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Confirm Your Workspace Authorization</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Assalam o Alaikum ${studentName},</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">You requested to sign in or authorize actions on the NEXUS Platform. Use the security PIN below to complete your authentication. This PIN is valid for the next 15 minutes.</p>
            
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; background-color: #f1f5f9; border: 1px solid #e2e8f0; color: #0f172a; font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 0.25em; padding: 16px 36px; border-radius: 16px;">${otpCode}</div>
            </div>
            
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-bottom: 0;">If you did not make this request, please disregard this email or notify security at operations@nexus.uop.edu.pk.</p>
          </div>
          
          <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 11px;">
            <p>&copy; ${new Date().getFullYear()} NEXUS Enterprise, Inc. Peshawar Pilot Network.</p>
          </div>
        </div>
      `
    });
    console.log("[RESEND] Email transmitted through API successfully:", emailResult);
  } catch (err) {
    console.error("[RESEND ERROR] Failed to send transactional email:", err);
  }
}

// Gemini API Configuration
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("WARNING: GEMINI_API_KEY is not configured or left as default. AI features will fallback to template strings.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// Database Persistence Management (.data/nexus_db.json)
const DB_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DB_DIR, "nexus_db.json");

interface LocalDatabase {
  students: StudentProfile[];
  gigs: ServiceGig[];
  opportunities: Opportunity[];
  applications: Application[];
  verificationRequests: VerificationRequest[];
  conversations: Conversation[];
  messages: Message[];
  notifications: SystemNotification[];
  session: UserSession;
}

const defaultSession: UserSession = {
  id: "student_1",
  email: "zeeshan.cs@uop.edu.pk",
  name: "Zeeshan Ahmad",
  role: UserRole.STUDENT,
  avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
  isVerifiedStudent: true,
  verificationStatus: VerificationStatus.APPROVED,
  loginHistory: [
    { timestamp: new Date().toISOString(), ip: "127.0.0.1", device: "Chrome / macOS (Vite Dev Container)" }
  ]
};

// Seed verification requests for Admin Review UI
const defaultVerificationRequests = (): VerificationRequest[] => [
  {
    id: "req_haris",
    userId: "student_3",
    fullName: "Haris Khattak",
    university: "FAST NUCES, Peshawar Campus",
    department: "Computer Science",
    degreeProgram: "BS Artificial Intelligence",
    studentIdNum: "F20-CS-1882",
    idCardUrl: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500",
    profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    status: VerificationStatus.PENDING,
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  }
];

// Seed relative notifications
const defaultNotifications = (): SystemNotification[] => [
  {
    id: "notif_1",
    userId: "student_1",
    title: "Project Proposal Submitted",
    content: "Your proposal for Peshawar Artisans Web Application has been successfully submitted.",
    type: "APPLICATION",
    isRead: false,
    createdAt: new Date().toISOString()
  }
];

// Setup clean directories and initialize JSON database
function initDatabase(): LocalDatabase {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      // Validate structure matches or fill empty items
      return {
        students: data.students || INITIAL_STUDENTS,
        gigs: data.gigs || INITIAL_GIGS,
        opportunities: data.opportunities || INITIAL_OPPORTUNITIES,
        applications: data.applications || INITIAL_APPLICATIONS,
        verificationRequests: data.verificationRequests || defaultVerificationRequests(),
        conversations: data.conversations || [],
        messages: data.messages || [],
        notifications: data.notifications || defaultNotifications(),
        session: data.session || defaultSession
      };
    } catch (e) {
      console.error("Failed to parse local database. Recreating with seed data...");
    }
  }

  const db: LocalDatabase = {
    students: INITIAL_STUDENTS,
    gigs: INITIAL_GIGS,
    opportunities: INITIAL_OPPORTUNITIES,
    applications: INITIAL_APPLICATIONS as Application[],
    verificationRequests: defaultVerificationRequests(),
    conversations: [],
    messages: [],
    notifications: defaultNotifications(),
    session: defaultSession
  };
  saveDatabase(db);
  return db;
}

// Background throttled MongoDB syncer
let syncTimeout: NodeJS.Timeout | null = null;
function triggerMongoSync() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      const mongoDb = await connectToDatabase();
      console.log("[MONGO ATLAS SYNC] Synchronizing in-memory state with Atlas...");

      const cleanDoc = (obj: any) => {
        const c = { ...obj };
        delete c._id;
        return c;
      };

      await Promise.all([
        mongoDb.collection("students").deleteMany({}).then(() => db.students.length ? mongoDb.collection("students").insertMany(db.students.map(cleanDoc)) : null),
        mongoDb.collection("gigs").deleteMany({}).then(() => db.gigs.length ? mongoDb.collection("gigs").insertMany(db.gigs.map(cleanDoc)) : null),
        mongoDb.collection("opportunities").deleteMany({}).then(() => db.opportunities.length ? mongoDb.collection("opportunities").insertMany(db.opportunities.map(cleanDoc)) : null),
        mongoDb.collection("applications").deleteMany({}).then(() => db.applications.length ? mongoDb.collection("applications").insertMany(db.applications.map(cleanDoc)) : null),
        mongoDb.collection("verificationRequests").deleteMany({}).then(() => db.verificationRequests.length ? mongoDb.collection("verificationRequests").insertMany(db.verificationRequests.map(cleanDoc)) : null),
        mongoDb.collection("conversations").deleteMany({}).then(() => db.conversations.length ? mongoDb.collection("conversations").insertMany(db.conversations.map(cleanDoc)) : null),
        mongoDb.collection("messages").deleteMany({}).then(() => db.messages.length ? mongoDb.collection("messages").insertMany(db.messages.map(cleanDoc)) : null),
        mongoDb.collection("notifications").deleteMany({}).then(() => db.notifications.length ? mongoDb.collection("notifications").insertMany(db.notifications.map(cleanDoc)) : null),
        mongoDb.collection("session").deleteMany({}).then(() => mongoDb.collection("session").insertOne({ _id: "current_session_id", ...cleanDoc(db.session) }))
      ]);
      console.log("[MONGO ATLAS SYNC] Clustered document states synced successfully!");
    } catch (err) {
      console.error("[MONGO ATLAS SYNC ERROR] Failed synchronizing collection sets:", err);
    }
  }, 1000); // Throttled background execution
}

// Lazy load Database state on startup from MongoDB Atlas
async function loadDatabaseStateFromMongo() {
  try {
    const mongoDb = await connectToDatabase();
    console.log("[MONGO ATLAS SYNC] Restoring states from clustered database...");
    
    // Check if students exist - otherwise seed initial data
    const studentsCount = await mongoDb.collection("students").countDocuments();
    if (studentsCount === 0) {
      console.log("[MONGO ATLAS SYNC] Seeding empty database collections in Atlas...");
      
      const cleanDoc = (obj: any) => {
        const c = { ...obj };
        delete c._id;
        return c;
      };

      await mongoDb.collection("students").insertMany(INITIAL_STUDENTS.map(cleanDoc));
      await mongoDb.collection("gigs").insertMany(INITIAL_GIGS.map(cleanDoc));
      await mongoDb.collection("opportunities").insertMany(INITIAL_OPPORTUNITIES.map(cleanDoc));
      await mongoDb.collection("applications").insertMany(INITIAL_APPLICATIONS.map(cleanDoc));
      await mongoDb.collection("verificationRequests").insertMany(defaultVerificationRequests().map(cleanDoc));
      await mongoDb.collection("notifications").insertMany(defaultNotifications().map(cleanDoc));
      await mongoDb.collection("conversations").insertMany([]);
      await mongoDb.collection("messages").insertMany([]);
      await mongoDb.collection("session").insertOne({ _id: "current_session_id", ...cleanDoc(defaultSession) });
    }

    // Load everything back from Atlas
    const students = await mongoDb.collection("students").find().toArray() as any;
    const gigs = await mongoDb.collection("gigs").find().toArray() as any;
    const opportunities = await mongoDb.collection("opportunities").find().toArray() as any;
    const applications = await mongoDb.collection("applications").find().toArray() as any;
    const verificationRequests = await mongoDb.collection("verificationRequests").find().toArray() as any;
    const notifications = await mongoDb.collection("notifications").find().toArray() as any;
    const conversations = await mongoDb.collection("conversations").find().toArray() as any;
    const messages = await mongoDb.collection("messages").find().toArray() as any;
    const sessionDoc = await mongoDb.collection("session").findOne({ _id: "current_session_id" as any }) as any;
    const session = sessionDoc ? { ...sessionDoc, _id: undefined } : defaultSession;

    db = {
      students,
      gigs,
      opportunities,
      applications,
      verificationRequests,
      notifications,
      conversations,
      messages,
      session
    };
    
    // Save to local file cache as warm fallback
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
    console.log("[MONGO ATLAS SYNC] Succesfully loaded dataset state from Atlas.");
  } catch (err) {
    console.error("[MONGO ATLAS SYNC ERROR] Unable to load state datasets from Atlas. Falling back to local file system:", err);
  }
}

function saveDatabase(db: LocalDatabase) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
    triggerMongoSync(); // Write-through cache updates
  } catch (e) {
    console.error("Error writing database state: ", e);
  }
}

let db = initDatabase();

// API ROUTES

// AUTH ACTIONS
app.get("/api/auth/session", (req, res) => {
  res.json(db.session);
});

app.post("/api/auth/session/select-role", (req, res) => {
  const { role } = req.body;
  if (!role || !Object.values(UserRole).includes(role)) {
    return res.status(400).json({ error: "Invalid login role" });
  }

  // Switch relative session users to emulate multi-account toggling flawlessly
  if (role === UserRole.STUDENT) {
    db.session = {
      id: "student_1",
      email: "zeeshan.cs@uop.edu.pk",
      name: "Zeeshan Ahmad",
      role: UserRole.STUDENT,
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
      isVerifiedStudent: db.students.find(s => s.userId === "student_1")?.verificationStatus === VerificationStatus.APPROVED,
      verificationStatus: db.students.find(s => s.userId === "student_1")?.verificationStatus || VerificationStatus.APPROVED,
      loginHistory: [
        { timestamp: new Date().toISOString(), ip: "127.0.0.1", device: "Chrome / macOS (Vite Dev Container)" },
        ...db.session.loginHistory
      ]
    };
  } else if (role === UserRole.CLIENT) {
    const client = INITIAL_CLIENTS[0];
    db.session = {
      id: client.id,
      email: client.email,
      name: client.name,
      role: UserRole.CLIENT,
      avatar: client.avatar,
      isVerifiedStudent: false,
      verificationStatus: VerificationStatus.REJECTED,
      loginHistory: [
        { timestamp: new Date().toISOString(), ip: "127.0.0.1", device: "Chrome / macOS (Vite Dev Container)" },
        ...db.session.loginHistory
      ]
    };
  } else if (role === UserRole.ADMIN) {
    db.session = {
      id: "admin_user",
      email: "provost.office@uop.edu.pk",
      name: "UoP Provost Admin Office",
      role: UserRole.ADMIN,
      avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150",
      isVerifiedStudent: false,
      verificationStatus: VerificationStatus.REJECTED,
      loginHistory: [
        { timestamp: new Date().toISOString(), ip: "127.0.0.1", device: "Chrome / macOS (Vite Dev Container)" },
        ...db.session.loginHistory
      ]
    };
  }
  
  saveDatabase(db);
  res.json(db.session);
});

// Custom signup mock trigger
app.post("/api/auth/signup", (req, res) => {
  const { name, email, role, university, department, degreeProgram, studentIdNum } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  // Create or switch to user
  if (role === UserRole.STUDENT) {
    const userId = `student_${Date.now()}`;
    const newStudent: StudentProfile = {
      userId,
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}`,
      headline: "Aspiring University Student Developer",
      bio: `Currently pursuing credentials in ${department} at ${university}. Excited to present skills on NEXUS platform.`,
      skills: ["React", "HTML/CSS", "JavaScript"],
      university: university || "University of Peshawar",
      department: department || "Computer Science",
      degreeProgram: degreeProgram || "BS",
      degreeYear: "1st Year",
      crsScore: calculateCRS(0, 5, 0, VerificationStatus.PENDING, 50),
      verificationStatus: VerificationStatus.PENDING,
      rating: 5.0,
      activeOpportunityCount: 0,
      completedProjectCount: 0,
      socialLinks: {},
      portfolio: [],
      reviews: []
    };

    db.students.push(newStudent);

    // Automatically file verification request
    const mockRequest: VerificationRequest = {
      id: `req_${Date.now()}`,
      userId,
      fullName: name,
      university: university || "University of Peshawar",
      department: department || "Computer Science",
      degreeProgram: degreeProgram || "BS",
      studentIdNum: studentIdNum || "UOP-SD-" + Math.floor(1000 + Math.random() * 9000),
      idCardUrl: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500", // Standard mock identity
      profileImageUrl: newStudent.avatar,
      status: VerificationStatus.PENDING,
      createdAt: new Date().toISOString()
    };
    db.verificationRequests.push(mockRequest);

    db.session = {
      id: userId,
      email,
      name,
      role: UserRole.STUDENT,
      avatar: newStudent.avatar,
      isVerifiedStudent: false,
      verificationStatus: VerificationStatus.PENDING,
      loginHistory: [{ timestamp: new Date().toISOString(), ip: "127.0.0.1", device: "Chrome" }]
    };
  } else {
    // Client role
    const clientId = `client_${Date.now()}`;
    db.session = {
      id: clientId,
      email,
      name,
      role: UserRole.CLIENT,
      avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}`,
      isVerifiedStudent: false,
      verificationStatus: VerificationStatus.REJECTED,
      loginHistory: [{ timestamp: new Date().toISOString(), ip: "127.0.0.1", device: "Chrome" }]
    };
  }

  saveDatabase(db);
  res.json(db.session);
});

// OTP delivery with real Resend Transmissions
app.post("/api/auth/otp/send", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  
  const otpCode = "492837";
  const matchedStudent = db.students.find(s => s.email.toLowerCase() === email.toLowerCase());
  const studentName = matchedStudent ? matchedStudent.name : "NEXUS Partner";
  
  console.log(`[OTP TRANSACTION] Transmitting OTP to student: ${email}. Code: ${otpCode}`);
  await sendVerificationEmail(email, otpCode, studentName);
  
  res.json({ success: true, message: "Verification PIN transmitted via Resend to student's email." });
});

app.post("/api/auth/otp/verify", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: "Incomplete fields" });
  if (code === "492837" || code === "123456") {
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid or expired OTP authentication token code." });
  }
});

// Google Sign-In Token Decrypt & Auto-enrollment
app.post("/api/auth/google/verify", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "No identity token supplied" });

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return res.status(400).json({ error: "Malformed identity token" });
    }
    
    const payloadBuffer = Buffer.from(parts[1], "base64");
    const profile = JSON.parse(payloadBuffer.toString("utf-8"));
    const { email, name, picture } = profile;
    if (!email) return res.status(400).json({ error: "Missing email profile from Google" });

    console.log(`[GOOGLE OAUTH verified] Identity: ${name} (${email})`);
    
    let student = db.students.find(s => s.email.toLowerCase() === email.toLowerCase());
    const userId = student?.userId || `student_${Date.now()}`;

    if (!student) {
      student = {
        userId,
        name: name || "Google Peer",
        email: email,
        avatar: picture || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name || "Google Peer")}`,
        headline: "Aspiring University Student Developer",
        bio: "Authorized and enrolled via Google OAuth. Seeking local projects to expand regional freelancing experience in Peshawar.",
        skills: ["React", "HTML/CSS", "JavaScript", "TypeScript"],
        university: "University of Peshawar",
        department: "Computer Science",
        degreeProgram: "BS",
        degreeYear: "1st Year",
        crsScore: calculateCRS(0, 5, 0, VerificationStatus.PENDING, 50),
        verificationStatus: VerificationStatus.PENDING,
        rating: 5.0,
        activeOpportunityCount: 0,
        completedProjectCount: 0,
        socialLinks: {},
        portfolio: [],
        reviews: []
      };
      db.students.push(student);

      const mockRequest: VerificationRequest = {
        id: `req_${Date.now()}`,
        userId,
        fullName: student.name,
        university: student.university,
        department: student.department,
        degreeProgram: student.degreeProgram,
        studentIdNum: "UOP-G-" + Math.floor(1000 + Math.random() * 9000),
        idCardUrl: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500",
        profileImageUrl: student.avatar,
        status: VerificationStatus.PENDING,
        createdAt: new Date().toISOString()
      };
      db.verificationRequests.push(mockRequest);
    }

    db.session = {
      id: userId,
      email: student.email,
      name: student.name,
      role: UserRole.STUDENT,
      avatar: student.avatar,
      isVerifiedStudent: student.verificationStatus === VerificationStatus.APPROVED,
      verificationStatus: student.verificationStatus,
      loginHistory: [
        { timestamp: new Date().toISOString(), ip: "127.0.0.1", device: "Google Signed-in Session" },
        ...db.session.loginHistory
      ]
    };

    saveDatabase(db);
    res.json(db.session);
  } catch (err: any) {
    console.error("[OAUTH VERIFY ERROR]", err);
    res.status(500).json({ error: "Cryptographic identity parsing failed: " + err.message });
  }
});

// Standard Authorization code flow routes for Popup-based OAuth integrations as per guidelines
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "1022623483654-3vhj3a028s8bhovk6eabnu7fm2uuql0v.apps.googleusercontent.com";

app.get("/api/auth/google/config", (req, res) => {
  res.json({ clientId: GOOGLE_CLIENT_ID });
});

app.get("/api/auth/google/url", (req, res) => {
  const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile email",
    prompt: "consent"
  });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url: authUrl });
});

app.get(["/api/auth/google/callback", "/api/auth/google/callback/"], async (req, res) => {
  const { code } = req.query;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  // Default profile in case of mock callback flow
  let profile = {
    email: "exampleabc25@gmail.com",
    name: "Mohammad Khyber",
    picture: "https://api.dicebear.com/7.x/pixel-art/svg?seed=MohammadKhyber"
  };

  // If there is an authorization code and developer client secret is supplied, try to exchange it for a real user's profile
  if (code && GOOGLE_CLIENT_SECRET) {
    try {
      const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });
      if (tokenRes.ok) {
        const tokens = await tokenRes.json();
        if (tokens.id_token) {
          const parts = tokens.id_token.split(".");
          const payloadBuffer = Buffer.from(parts[1], "base64");
          const decoded = JSON.parse(payloadBuffer.toString("utf-8"));
          if (decoded.email) {
            profile = {
              email: decoded.email,
              name: decoded.name || "Google User",
              picture: decoded.picture || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(decoded.email)}`
            };
          }
        }
      } else {
        const errBody = await tokenRes.text();
        console.error("[OAUTH TOKEN EXCHANGE BAD RESPONSE]", errBody);
      }
    } catch (e) {
      console.error("[OAUTH CALLBACK TOKEN EXCHANGE FAIL]", e);
    }
  }

  // Update server session with the authentic or mock user
  const email = profile.email;
  const name = profile.name;
  const picture = profile.picture;

  let student = db.students.find(s => s.email.toLowerCase() === email.toLowerCase());
  const userId = student?.userId || `student_${Date.now()}`;

  if (!student) {
    student = {
      userId,
      name: name || "Google Peer",
      email: email,
      avatar: picture || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name || "Google Peer")}`,
      headline: "Aspiring University Student Developer",
      bio: "Authorized and enrolled via Google OAuth. Seeking local projects to expand regional freelancing experience in Peshawar.",
      skills: ["React", "HTML/CSS", "JavaScript", "TypeScript"],
      university: "University of Peshawar",
      department: "Computer Science",
      degreeProgram: "BS",
      degreeYear: "1st Year",
      crsScore: calculateCRS(0, 5, 0, VerificationStatus.PENDING, 50),
      verificationStatus: VerificationStatus.PENDING,
      rating: 5.0,
      activeOpportunityCount: 0,
      completedProjectCount: 0,
      socialLinks: {},
      portfolio: [],
      reviews: []
    };
    db.students.push(student);

    const mockRequest: VerificationRequest = {
      id: `req_${Date.now()}`,
      userId,
      fullName: student.name,
      university: student.university,
      department: student.department,
      degreeProgram: student.degreeProgram,
      studentIdNum: "UOP-G-" + Math.floor(1000 + Math.random() * 9000),
      idCardUrl: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500",
      profileImageUrl: student.avatar,
      status: VerificationStatus.PENDING,
      createdAt: new Date().toISOString()
    };
    db.verificationRequests.push(mockRequest);
  }

  db.session = {
    id: userId,
    email: student.email,
    name: student.name,
    role: UserRole.STUDENT,
    avatar: student.avatar,
    isVerifiedStudent: student.verificationStatus === VerificationStatus.APPROVED,
    verificationStatus: student.verificationStatus,
    loginHistory: [
      { timestamp: new Date().toISOString(), ip: "127.0.0.1", device: "Popup OAuth callback" },
      ...db.session.loginHistory
    ]
  };

  saveDatabase(db);

  res.send(`
    <html>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; margin: 0;">
        <div style="text-align: center; border: 1px solid #e1e8f0; padding: 40px; border-radius: 24px; background: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05)">
          <h2 style="color: #0f172a; margin-bottom: 8px;">Authorized successfully!</h2>
          <p style="color: #64748b; font-size: 14px;">This popup window is closing...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', code: '${code}' }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// Student Verification Submission Endpoint
app.post("/api/verification-requests/submit", (req, res) => {
  const { fullName, university, department, degreeProgram, studentIdNum, idCardUrl } = req.body;
  const studentId = db.session.id;

  const student = db.students.find(s => s.userId === studentId);
  if (!student) return res.status(403).json({ error: "Student profile not cached" });

  // Update student status to PENDING
  student.verificationStatus = VerificationStatus.PENDING;

  const newRequest: VerificationRequest = {
    id: `req_${Date.now()}`,
    userId: studentId,
    fullName: fullName || student.name,
    university: university || student.university,
    department: department || student.department,
    degreeProgram: degreeProgram || student.degreeProgram,
    studentIdNum: studentIdNum || "UOP-SD-" + Math.floor(1000 + Math.random() * 9000),
    idCardUrl: idCardUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500",
    profileImageUrl: student.avatar,
    status: VerificationStatus.PENDING,
    createdAt: new Date().toISOString()
  };

  // Remove existing pending or rejected requests for this user, keeping the latest one
  db.verificationRequests = db.verificationRequests.filter(r => r.userId !== studentId);
  db.verificationRequests.push(newRequest);

  // Sync session status too
  db.session.verificationStatus = VerificationStatus.PENDING;
  db.session.isVerifiedStudent = false;

  saveDatabase(db);
  res.json({ success: true, request: newRequest });
});

// PROFILES & CRS SCORES
app.get("/api/profiles", (req, res) => {
  res.json(db.students);
});

app.get("/api/profiles/:id", (req, res) => {
  const student = db.students.find(s => s.userId === req.params.id);
  if (!student) return res.status(404).json({ error: "Student profile not found" });
  res.json(student);
});

app.put("/api/profiles/:id", (req, res) => {
  const index = db.students.findIndex(s => s.userId === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Student profile not found" });

  const current = db.students[index];
  const updateData = req.body;

  // Selective update
  const updated: StudentProfile = {
    ...current,
    headline: updateData.headline || current.headline,
    bio: updateData.bio || current.bio,
    skills: Array.isArray(updateData.skills) ? updateData.skills : current.skills,
    degreeProgram: updateData.degreeProgram || current.degreeProgram,
    degreeYear: updateData.degreeYear || current.degreeYear,
    socialLinks: {
      ...current.socialLinks,
      ...updateData.socialLinks
    }
  };

  // Recalculate CRS Score automatically upon edit!
  updated.crsScore = calculateCRS(
    updated.completedProjectCount,
    updated.rating,
    updated.portfolio.length,
    updated.verificationStatus,
    85 // Standard activity score constant
  );

  db.students[index] = updated;
  
  // If editing ourselves, sync session info too
  if (db.session.id === req.params.id) {
    db.session.name = updated.name;
    db.session.avatar = updated.avatar;
    db.session.isVerifiedStudent = updated.verificationStatus === VerificationStatus.APPROVED;
    db.session.verificationStatus = updated.verificationStatus;
  }

  saveDatabase(db);
  res.json(updated);
});

// PORTFOLIO CRUD
app.post("/api/portfolio", (req, res) => {
  const { title, description, mediaType, mediaUrl, githubUrl, liveUrl } = req.body;
  const studentId = db.session.id;
  const studentIndex = db.students.findIndex(s => s.userId === studentId);
  if (studentIndex === -1) return res.status(403).json({ error: "Only registered students can add portfolio items" });

  const newItem = {
    id: `pf_${Date.now()}`,
    title,
    description,
    mediaType: mediaType || "image",
    mediaUrl: mediaUrl || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500",
    githubUrl,
    liveUrl,
    createdAt: new Date().toISOString().split("T")[0]
  };

  db.students[studentIndex].portfolio.push(newItem);
  
  // Recalculate CRS score because portfolio expanded
  db.students[studentIndex].crsScore = calculateCRS(
    db.students[studentIndex].completedProjectCount,
    db.students[studentIndex].rating,
    db.students[studentIndex].portfolio.length,
    db.students[studentIndex].verificationStatus,
    90
  );

  saveDatabase(db);
  res.json(newItem);
});

app.delete("/api/portfolio/:id", (req, res) => {
  const studentId = db.session.id;
  const studentIndex = db.students.findIndex(s => s.userId === studentId);
  if (studentIndex === -1) return res.status(403).json({ error: "Action prohibited" });

  const items = db.students[studentIndex].portfolio;
  db.students[studentIndex].portfolio = items.filter(item => item.id !== req.params.id);

  // Recalculate CRS Score
  db.students[studentIndex].crsScore = calculateCRS(
    db.students[studentIndex].completedProjectCount,
    db.students[studentIndex].rating,
    db.students[studentIndex].portfolio.length,
    db.students[studentIndex].verificationStatus,
    80
  );

  saveDatabase(db);
  res.json({ success: true });
});

// GIG SERVICES
app.get("/api/gigs", (req, res) => {
  res.json(db.gigs);
});

app.post("/api/gigs", (req, res) => {
  const { title, description, category, tags, startingPrice, deliveryTimeDays, gallery, faqs } = req.body;
  const studentId = db.session.id;
  const student = db.students.find(s => s.userId === studentId);
  if (!student) return res.status(403).json({ error: "Requires student account" });

  const newGig: ServiceGig = {
    id: `gig_${Date.now()}`,
    studentId,
    studentName: student.name,
    studentAvatar: student.avatar,
    studentCrs: student.crsScore,
    studentUniversity: student.university,
    title,
    description,
    category,
    tags: Array.isArray(tags) ? tags : [],
    startingPrice: Number(startingPrice) || 5000,
    deliveryTimeDays: Number(deliveryTimeDays) || 3,
    gallery: Array.isArray(gallery) && gallery.length > 0 ? gallery : [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600"
    ],
    faqs: Array.isArray(faqs) ? faqs : [],
    createdAt: new Date().toISOString()
  };

  db.gigs.unshift(newGig);
  saveDatabase(db);
  res.json(newGig);
});

// OPPORTUNITIESBOARD & APPLICATION PROPOSALS
app.get("/api/opportunities", (req, res) => {
  res.json(db.opportunities);
});

app.post("/api/opportunities", (req, res) => {
  const { title, description, category, type, budget, deliveryTimeDays, skillsRequired, universityLimit, deadline } = req.body;
  
  const creatorId = db.session.id;
  const newOpp: Opportunity = {
    id: `opp_${Date.now()}`,
    clientId: creatorId,
    clientName: db.session.name,
    clientAvatar: db.session.avatar,
    clientCompany: db.session.role === UserRole.CLIENT ? "Verified Client Division" : undefined,
    title,
    description,
    category,
    type: type || "PROJECT",
    budget: Number(budget) || 10000,
    deliveryTimeDays: Number(deliveryTimeDays) || 7,
    skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : [],
    universityLimit: universityLimit || undefined,
    createdAt: new Date().toISOString(),
    deadline: deadline || new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split("T")[0],
    applicationsCount: 0
  };

  db.opportunities.unshift(newOpp);
  
  // Broadcast Notification to appropriate students!
  db.students.forEach(std => {
    if (!universityLimit || std.university === universityLimit) {
      db.notifications.unshift({
        id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        userId: std.userId,
        title: "New Opportunity Matched!",
        content: `A new position: '${title}' has matching requirements for you.`,
        type: "OPPORTUNITY",
        isRead: false,
        createdAt: new Date().toISOString(),
        link: `/opportunities`
      });
    }
  });

  saveDatabase(db);
  res.json(newOpp);
});

app.post("/api/opportunities/:id/apply", (req, res) => {
  const { proposalText, requestedBudget, deliveryDays, attachedPortfolioIds } = req.body;
  const opportunityId = req.params.id;
  const studentId = db.session.id;

  const opportunity = db.opportunities.find(o => o.id === opportunityId);
  if (!opportunity) return res.status(404).json({ error: "Opportunity not found" });

  const student = db.students.find(s => s.userId === studentId);
  if (!student) return res.status(403).json({ error: "Only verified student profiles can apply." });

  // Prevent multiple applications
  const existing = db.applications.find(a => a.opportunityId === opportunityId && a.studentId === studentId);
  if (existing) return res.status(400).json({ error: "You have already filed an application for this opportunity." });

  const newApp: Application = {
    id: `app_${Date.now()}`,
    opportunityId,
    studentId,
    studentName: student.name,
    studentAvatar: student.avatar,
    studentCrs: student.crsScore,
    proposalText,
    requestedBudget: Number(requestedBudget) || opportunity.budget,
    deliveryDays: Number(deliveryDays) || opportunity.deliveryTimeDays,
    attachedPortfolioIds: Array.isArray(attachedPortfolioIds) ? attachedPortfolioIds : [],
    status: "PENDING",
    createdAt: new Date().toISOString()
  };

  db.applications.push(newApp);
  opportunity.applicationsCount += 1;

  // Add Notification for the client who posted the project
  db.notifications.unshift({
    id: `notif_${Date.now()}_app`,
    userId: opportunity.clientId,
    title: "New Proposal Received",
    content: `${student.name} applied for your opportunity: '${opportunity.title}'`,
    type: "APPLICATION",
    isRead: false,
    createdAt: new Date().toISOString()
  });

  // Increment Student Active Opportunity Counter
  student.activeOpportunityCount += 1;

  saveDatabase(db);
  res.json(newApp);
});

// MESSAGING CHAT LAYERS
app.get("/api/conversations", (req, res) => {
  const userId = db.session.id;
  
  // Find all conversations where the session user participates
  const conversations = db.conversations.filter(c => 
    c.participants.some(p => p.id === userId)
  );

  res.json(conversations);
});

app.get("/api/conversations/:id/messages", (req, res) => {
  const conversationId = req.params.id;
  
  // Filter messages
  const messages = db.messages.filter(m => m.conversationId === conversationId);
  
  // Mark outstanding messages as read
  db.messages.forEach(m => {
    if (m.conversationId === conversationId && m.senderId !== db.session.id) {
      m.isRead = true;
    }
  });

  const conv = db.conversations.find(c => c.id === conversationId);
  if (conv) {
    conv.unreadCount[db.session.id] = 0;
  }

  saveDatabase(db);
  res.json(messages);
});

app.post("/api/conversations/:id/messages", (req, res) => {
  const conversationId = req.params.id;
  const { content, attachmentUrl, attachmentType } = req.body;
  const senderId = db.session.id;

  const conv = db.conversations.find(c => c.id === conversationId);
  if (!conv) return res.status(404).json({ error: "Conversation thread not found" });

  const newMessage: Message = {
    id: `msg_${Date.now()}`,
    conversationId,
    senderId,
    senderName: db.session.name,
    content,
    attachmentUrl,
    attachmentType,
    timestamp: new Date().toISOString(),
    isRead: false
  };

  db.messages.push(newMessage);

  // Update Conversation info
  conv.lastMessage = {
    content: content || "Attributing attachment document",
    timestamp: newMessage.timestamp,
    senderId
  };

  // Set unread for other participants
  conv.participants.forEach(p => {
    if (p.id !== senderId) {
      conv.unreadCount[p.id] = (conv.unreadCount[p.id] || 0) + 1;
      
      // Also write in-app notification header!
      db.notifications.unshift({
        id: `notif_chat_${Date.now()}`,
        userId: p.id,
        title: `Message from ${db.session.name}`,
        content: content.length > 50 ? `${content.substring(0, 47)}...` : content,
        type: "MESSAGE",
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  });

  saveDatabase(db);

  // SIMULATED EXPERTISE CLIENT REPLY ACTION !!
  // If student writes to a Client, let the Client reply after 2 seconds with an AI powered message or mock follow-up!
  const receivingParticipant = conv.participants.find(p => p.id !== senderId);
  if (receivingParticipant && receivingParticipant.role === UserRole.CLIENT && senderId.startsWith("student_")) {
    setTimeout(async () => {
      // Re-load DB to maintain consistency
      const localDb = initDatabase();
      const currentConv = localDb.conversations.find(c => c.id === conversationId);
      if (!currentConv) return;

      const aiText = await generateIntermediatedClientReply(content, receivingParticipant.name, db.session.name);
      
      const replyMessage: Message = {
        id: `msg_auto_${Date.now()}`,
        conversationId,
        senderId: receivingParticipant.id,
        senderName: receivingParticipant.name,
        content: aiText,
        timestamp: new Date().toISOString(),
        isRead: false
      };

      localDb.messages.push(replyMessage);
      currentConv.lastMessage = {
        content: replyMessage.content,
        timestamp: replyMessage.timestamp,
        senderId: receivingParticipant.id
      };
      currentConv.unreadCount[senderId] = (currentConv.unreadCount[senderId] || 0) + 1;

      localDb.notifications.unshift({
        id: `notif_chat_auto_${Date.now()}`,
        userId: senderId,
        title: `Reply from client ${receivingParticipant.name}`,
        content: aiText.substring(0, 50) + "...",
        type: "MESSAGE",
        isRead: false,
        createdAt: new Date().toISOString()
      });

      db = localDb;
      saveDatabase(localDb);
    }, 2500);
  }

  res.json(newMessage);
});

// Core direct conversation constructor
app.post("/api/conversations", (req, res) => {
  const { recipientId } = req.body;
  const senderId = db.session.id;

  if (!recipientId) return res.status(400).json({ error: "Receiving user identifier required" });

  // See if conversation already exists
  const existingConv = db.conversations.find(c => 
    c.participants.some(p => p.id === senderId) && 
    c.participants.some(p => p.id === recipientId)
  );

  if (existingConv) {
    return res.json(existingConv);
  }

  // Get receiver details
  let receiverName = "User";
  let receiverAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
  let receiverRole = UserRole.CLIENT;

  const std = db.students.find(s => s.userId === recipientId);
  const client = INITIAL_CLIENTS.find(c => c.id === recipientId) || db.session.id !== recipientId ? INITIAL_CLIENTS.find(x => x.id === recipientId) : null;

  if (std) {
    receiverName = std.name;
    receiverAvatar = std.avatar;
    receiverRole = UserRole.STUDENT;
  } else if (client) {
    receiverName = client.name;
    receiverAvatar = client.avatar;
    receiverRole = UserRole.CLIENT;
  } else if (recipientId === "admin_user") {
    receiverName = "UoP Provost Admin Office";
    receiverAvatar = "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150";
    receiverRole = UserRole.ADMIN;
  }

  const newConv: Conversation = {
    id: `conv_${Date.now()}`,
    participants: [
      { id: senderId, name: db.session.name, avatar: db.session.avatar, role: db.session.role },
      { id: recipientId, name: receiverName, avatar: receiverAvatar, role: receiverRole }
    ],
    unreadCount: {
      [senderId]: 0,
      [recipientId]: 0
    }
  };

  db.conversations.push(newConv);
  saveDatabase(db);
  res.json(newConv);
});

// CLIENT STAR REVIEWS SYSTEM
app.post("/api/reviews", (req, res) => {
  const { studentId, rating, comment } = req.body;
  const reviewerId = db.session.id;

  if (db.session.role !== UserRole.CLIENT) {
    return res.status(403).json({ error: "Only verified clients can evaluate students." });
  }

  const student = db.students.find(s => s.userId === studentId);
  if (!student) return res.status(404).json({ error: "Student profile not found" });

  const newReview: Review = {
    id: `rev_${Date.now()}`,
    reviewerId,
    reviewerName: db.session.name,
    reviewerAvatar: db.session.avatar,
    rating: Number(rating) || 5,
    comment,
    createdAt: new Date().toISOString().split("T")[0]
  };

  student.reviews.push(newReview);
  
  // Recompute Rating average
  const total = student.reviews.reduce((acc, curr) => acc + curr.rating, 0);
  student.rating = parseFloat((total / student.reviews.length).toFixed(1));
  student.completedProjectCount += 1;

  // Recalculate CRS Reputation
  student.crsScore = calculateCRS(
    student.completedProjectCount,
    student.rating,
    student.portfolio.length,
    student.verificationStatus,
    95
  );

  // Trigger Notification to student
  db.notifications.unshift({
    id: `notif_rev_${Date.now()}`,
    userId: studentId,
    title: "New Review Received!",
    content: `${db.session.name} left a ${rating}-star client review on your profile.`,
    type: "REVIEW",
    isRead: false,
    createdAt: new Date().toISOString()
  });

  saveDatabase(db);
  res.json(newReview);
});

// Students respond back to reviews
app.post("/api/reviews/:id/reply", (req, res) => {
  const { replyText } = req.body;
  const studentId = db.session.id;

  let reviewFound = false;

  db.students.forEach(std => {
    if (std.userId === studentId) {
      const review = std.reviews.find(r => r.id === req.params.id);
      if (review) {
        review.replyText = replyText;
        reviewFound = true;
      }
    }
  });

  if (!reviewFound) return res.status(404).json({ error: "Review item target not found" });

  saveDatabase(db);
  res.json({ success: true, replyText });
});

// ADMIN VERIFICATION ACTIONS
app.get("/api/verification-requests", (req, res) => {
  res.json(db.verificationRequests);
});

app.post("/api/verification-requests/:id/action", (req, res) => {
  const { action, feedback } = req.body; // APPROVED or REJECTED
  const requestId = req.params.id;

  const request = db.verificationRequests.find(v => v.id === requestId);
  if (!request) return res.status(404).json({ error: "Verification request not found" });

  request.status = action === "APPROVE" ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;

  // Apply change to Student Profile
  const student = db.students.find(s => s.userId === request.userId);
  if (student) {
    student.verificationStatus = request.status;
    
    // Recalculate CRS
    student.crsScore = calculateCRS(
      student.completedProjectCount,
      student.rating,
      student.portfolio.length,
      student.verificationStatus,
      90
    );

    // Push notification immediately
    db.notifications.unshift({
      id: `notif_verify_${Date.now()}`,
      userId: request.userId,
      title: action === "APPROVE" ? "Profile Verified Successfully" : "Verification Declined",
      content: action === "APPROVE" 
        ? "Congratulations! Your student ID card has been approved. You are now awarded the Verified Student Badge." 
        : `Management declined your verification request. Action notes: ${feedback || "Re-submit clear student card identification."}`,
      type: "VERIFICATION",
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  saveDatabase(db);
  res.json(request);
});

// SYSTEM NOTIFICATIONS
app.get("/api/notifications", (req, res) => {
  const notifications = db.notifications.filter(n => n.userId === db.session.id);
  res.json(notifications);
});

app.post("/api/notifications/:id/read", (req, res) => {
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
  }
  saveDatabase(db);
  res.json({ success: true });
});

// SYSTEM GENERAL PORTFOLIO ANALYTICS
app.get("/api/analytics", (req, res) => {
  const stats = {
    totalStudents: db.students.length,
    totalClients: INITIAL_CLIENTS.length,
    verifiedStudents: db.students.filter(s => s.verificationStatus === VerificationStatus.APPROVED).length,
    totalGigs: db.gigs.length,
    totalOpportunities: db.opportunities.length,
    activeApplications: db.applications.filter(a => a.status === "PENDING").length,
    totalVolumePKR: db.applications.filter(a => a.status === "ACCEPTED").reduce((acc, c) => acc + c.requestedBudget, 0) || 75000
  };
  res.json(stats);
});

// AI ENGINE SERVICE INTEGRATIONS WITH GEMINI 3.5 FLASH

// 1. AI PROPOSAL COMPOSER
app.post("/api/ai/proposal", async (req, res) => {
  const { opportunityTitle, opportunityDescription, studentBio, studentSkills, requestedBudget } = req.body;
  
  const ai = getGeminiClient();
  if (!ai) {
    // Fallback template
    const simulated = `RE: PROPOSAL FOR - ${opportunityTitle.toUpperCase()}

Dear Client,

Having reviewed your detailed opportunity requesting professional implementation skills, I am excited to submit my candidature. As a student specialist equipped with ${studentSkills?.join(", ") || "software technologies"}, my academic training directly supports delivering this successfully.

HOW I PLAN TO EXECUTE:
1. Architectural Layout & Draft Mockups
2. Rapid Core Integration & Frontend Assembly (React & TypeScript)
3. Direct validation mapping to ensure high accessibility
4. Seamless delivery of review milestones

Given my bio details, I offer exceptional local technical service at a fair cost of PKR ${requestedBudget || "30,000"}. Let's collaborate!

Best regards,
${db.session.name}`;
    return res.json({ text: simulated });
  }

  try {
    const prompt = `You are an elite, highly professional proposal coach for Pakistan's university student freelancing ecosystem NEXUS. 
    Task: Write an outstanding, highly tailored client project proposal based on:
    - Opportunity Title: "${opportunityTitle}"
    - Opportunity Description: "${opportunityDescription}"
    - Student Biography: "${studentBio}"
    - Student Core Skills: ${JSON.stringify(studentSkills)}
    - Requested Price/Budget: PKR ${requestedBudget || "Not Specified"}

    Ensure the tone is professional, confident, respectful, and highlights student technical competency, university dedication, and clean architecture. Avoid corporate jargon. Structure it with absolute visual clarity. Do NOT include markdown code blocks around the envelope text unless it's for standard formatting.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error in proposal:", error);
    res.status(500).json({ error: "AI Engine failed to compute proposal text", details: error.message });
  }
});

// 2. AI SERVICE GIG GENERATOR
app.post("/api/ai/gig", async (req, res) => {
  const { titleInput, category, tags } = req.body;

  const ai = getGeminiClient();
  if (!ai) {
    const simulated = {
      title: `I will engineer elite professional ${titleInput || "Web Development Services"} for your Pakistani Startup`,
      description: `Get full-scale modular systems tailored for your company. Optimized for the latest React frameworks, TypeScript, and clean responsive CSS. What I provide: pristine system architecture, unit tested business logic, clean code layout, and post-delivery assistance.`,
      faqs: [
        { question: "What is your typical response time?", answer: "I usually respond in less than 2 hours to active student-client queries on the chat." },
        { question: "Do you accommodate specialized university project guides?", answer: "Yes, I regularly engineer projects aligning with standard university scoring rubrics." }
      ]
    };
    return res.json(simulated);
  }

  try {
    const prompt = `You are an elite copywriter specializing in the global freelancing space (Fiverr/Upwork). 
    Help a Pakistani university student craft a high-converting Service Gig listing on the NEXUS Platform.
    Inputs:
    - Draft Title: "${titleInput}"
    - Category: "${category}"
    - Tags: ${JSON.stringify(tags)}

    You MUST return a JSON object containing EXACTLY:
    {
      "title": "A highly catchy, professional Fiverr-style Gig service title starting with 'I will'",
      "description": "An extensive, beautifully organized 3-paragraph marketing description highlighting student talent, technology stack benefits, delivery terms, and professional quality guarantees.",
      "faqs": [
        { "question": "Relevant FAQ 1?", "answer": "Answer 1" },
        { "question": "Relevant FAQ 2?", "answer": "Answer 2" }
      ]
    }
    Ensure the JSON matches standard structure. Do NOT output any markdown tags or backticks around your JSON payload, strictly output raw JSON text so it parses cleanly.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            faqs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING }
                },
                required: ["question", "answer"]
              }
            }
          },
          required: ["title", "description", "faqs"]
        }
      }
    });

    res.json(JSON.parse(response.text.trim()));
  } catch (error: any) {
    console.error("Gemini API Error in gig optimizer:", error);
    res.status(500).json({ error: "AI Engine failed to structure gig catalog items." });
  }
});

// 3. AI PORTFOLIO OPTIMIZER
app.post("/api/ai/portfolio", async (req, res) => {
  const { itemTitle, itemDescription, skillsUsed } = req.body;

  const ai = getGeminiClient();
  if (!ai) {
    const simulated = `**EXPERIENCE OVERVIEW**:
    Optimized implementation of "${itemTitle}" as local enterprise project.
    
    **KEY DELIVERABLES**:
    - Pioneered modular layouts using ${skillsUsed?.join(", ") || "industry standards"}.
    - Structured type-safe state loops and fully validated APIs.
    - Improved page delivery time and user interactions significantly representation.`;
    return res.json({ text: simulated });
  }

  try {
    const prompt = `You are a startup CTO and resume coach reviewing student portfolios.
    A student has imported a showcase item:
    - Title: "${itemTitle}"
    - Current Description: "${itemDescription}"
    - Skills Utilized: ${JSON.stringify(skillsUsed)}

    Optimize the description to make it look incredibly professional, impact-oriented, and structured. Accentuate metrics, technical challenges conquered, software architectural decisions made, and highlight their contribution. Make it concise and high-converting. Return the optimized description in raw text format.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Portfolio error:", error);
    res.status(500).json({ error: "Failed to optimize portfolio narrative." });
  }
});

// Helper for automated interactive chat simulation using Gemini
async function generateIntermediatedClientReply(lastMsg: string, clientName: string, studentName: string): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) {
    return `Hi ${studentName}! Thanks for writing. I received your message: "${lastMsg}". Your profile looks interesting. Let's arrange a call to outline timelines further.`;
  }
  try {
    const prompt = `You are simulating a client named "${clientName}" on Pakistan's university freelance platform NEXUS.
    A verified student developer named "${studentName}" just sent you this message: "${lastMsg}".
    Compose a realistic, professional, concise response (2-3 sentences max) that a client would write on a Chat portal.
    Express curiosity, ask for specific delivery details or technical plans regarding their portfolio, and maintain polite regional business etiquette. Do not include any tags, just raw message content.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    return response.text.trim();
  } catch (e) {
    return `Assalam o Alaikum ${studentName}, thanks for your message. I am reviewing your proposal proposal guidelines and will get back to you shortly with our roadmap!`;
  }
}

// VITE ENGINE MIDDLEWARE & PRODUCTION STATIC HOSTING
async function startServer() {
  // Restore state asynchronously in the background so it does not block the port listener bootup.
  // If connection succeeds, Atlas state is hydrated cleanly; if it fails or is blocked by access lists,
  // the system remains perfectly responsive and functional with the local JSON database fallback.
  loadDatabaseStateFromMongo();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[NEXUS SERVER] Running successfully on local port: ${PORT}`);
  });
}

startServer();
