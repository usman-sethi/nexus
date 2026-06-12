import { UserRole, VerificationStatus, StudentProfile, ServiceGig, Opportunity } from "./types";

export const UNIVERSITIES = [
  "University of Peshawar",
  "IM Sciences, Peshawar",
  "FAST NUCES, Peshawar Campus",
  "UET Peshawar",
  "Khyber Medical College"
];

export const DEPARTMENTS = [
  "Computer Science",
  "Software Engineering",
  "Information Technology",
  "Management Sciences",
  "Art & Graphic Design",
  "Media & Journalism",
  "Electrical Engineering",
  "English & Linguistics"
];

export const CATEGORIES = [
  "Web Development",
  "Mobile Apps",
  "UI/UX & Product Design",
  "Graphic & Brand Design",
  "Content Writing & Translation",
  "AI & Data Science",
  "Digital Marketing"
];

// Helper to calculate CRS Score based on formula:
// 30% Completed Projects (e.g. min of 10 projects = 100%)
// 25% Average Rating (averageRating * 20 = score out of 100%)
// 20% Portfolio Quality (based on count of items, 4+ items = 100%)
// 15% Verification Level (APPROVED = 100%, PENDING = 50%, REJECTED = 0%)
// 10% Activity level (based on project/opportunity count)
export function calculateCRS(
  completedProjects: number,
  averageRating: number,
  portfolioCount: number,
  verification: VerificationStatus,
  activityScore: number // 0 to 100
): number {
  const pScore = Math.min((completedProjects / 10) * 100, 100) * 0.30;
  const rScore = (averageRating / 5) * 100 * 0.25;
  const pfScore = Math.min((portfolioCount / 5) * 100, 100) * 0.20;
  const vScore = (verification === VerificationStatus.APPROVED ? 100 : verification === VerificationStatus.PENDING ? 50 : 0) * 0.15;
  const aScore = activityScore * 0.10;
  
  return Math.round(pScore + rScore + pfScore + vScore + aScore);
}

// Initial mock clients
export const INITIAL_CLIENTS = [
  {
    id: "client_1",
    name: "Zawar Shah",
    email: "zawar@shinwaritech.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    role: UserRole.CLIENT,
    company: "Shinwari Tech Labs"
  },
  {
    id: "client_2",
    name: "Dr. Maria Khan",
    email: "maria.khan@peshawarresearch.org",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    role: UserRole.CLIENT,
    company: "Peshawar Research & Innovations"
  }
];

// Seed profiles
export const INITIAL_STUDENTS: StudentProfile[] = [
  {
    userId: "student_1",
    name: "Zeeshan Ahmad",
    email: "zeeshan.cs@uop.edu.pk",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
    headline: "Frontend Architect & React Native Enthusiast",
    bio: "Computer Science senior at the University of Peshawar. Passionate about building highly responsive user interfaces and modern hybrid apps with React Native. Freelancing to build local enterprise solutions and student-centered tools since 3 years.",
    skills: ["React", "TypeScript", "Tailwind CSS", "React Native", "Next.js", "Node.js"],
    university: "University of Peshawar",
    department: "Computer Science",
    degreeProgram: "BS Computer Science",
    degreeYear: "Senior (4th Year)",
    crsScore: 88,
    verificationStatus: VerificationStatus.APPROVED,
    rating: 4.9,
    activeOpportunityCount: 1,
    completedProjectCount: 12,
    socialLinks: {
      github: "https://github.com/zeeshan-ahmad-uop",
      linkedin: "https://linkedin.com/in/zeeshan-cs",
      portfolio: "https://zeeshan.dev"
    },
    portfolio: [
      {
        id: "pf_1",
        title: "Khyber Transit Live Tracking App",
        description: "Mobile app for tracking student buses around Peshawar University campus in real-time. Native maps integration.",
        mediaType: "image",
        mediaUrl: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=500",
        githubUrl: "https://github.com/zeeshan-ahmad-uop/khyber-transit",
        liveUrl: "https://khybertransit.uop.edu.pk",
        createdAt: "2026-01-10"
      },
      {
        id: "pf_2",
        title: "Peshawar Artisans Marketplace e-Commerce",
        description: "An elegant Next.js storefront built to connect regional Peshawar copper and jewelry craftsmen with federal e-pay. Integrates stripe and secure vendor panels.",
        mediaType: "image",
        mediaUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500",
        githubUrl: "https://github.com/zeeshan-ahmad-uop/artisans-shop",
        liveUrl: "https://peshawar-artisans.org",
        createdAt: "2026-03-05"
      }
    ],
    reviews: [
      {
        id: "rev_1",
        reviewerId: "client_1",
        reviewerName: "Zawar Shah",
        reviewerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        rating: 5,
        comment: "Excellent work delivering our React team tracker on schedule. Very competent with TypeScript and quick to resolve local requirements.",
        replyText: "Thank you Zawar, it was an absolute pleasure engineering this solution for Shinwari Tech Labs!",
        createdAt: "2026-05-12"
      }
    ]
  },
  {
    userId: "student_2",
    name: "Ayesha Bibi",
    email: "ayesha.se@imsciences.edu.pk",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    headline: "UI/UX & Product Designer",
    bio: "Software Engineering student at IM Sciences. Dedicated to researching clean typography, user personas, and pixel-perfect interactive mockups. Inspired by Linear and Stripe Design systems.",
    skills: ["Figma", "Adobe XD", "UI/UX Design", "Wireframing", "Tailwind CSS", "Graphic Design"],
    university: "IM Sciences, Peshawar",
    department: "Art & Graphic Design",
    degreeProgram: "BS Software Engineering",
    degreeYear: "Junior (3rd Year)",
    crsScore: 82,
    verificationStatus: VerificationStatus.APPROVED,
    rating: 4.8,
    activeOpportunityCount: 0,
    completedProjectCount: 6,
    socialLinks: {
      linkedin: "https://linkedin.com/in/ayesha-design",
      twitter: "https://twitter.com/ayesha_ux"
    },
    portfolio: [
      {
        id: "pf_3",
        title: "NEXUS Visual Mockup & Design Kit",
        description: "Entire Figma file detailing UX research, layout constants, accessible typographic scales, and components for university talent ecosystems across Pakistan.",
        mediaType: "image",
        mediaUrl: "https://images.unsplash.com/photo-1581291518655-9523c932dedf?w=500",
        githubUrl: "",
        liveUrl: "https://figma.com/file/nexus-design",
        createdAt: "2026-04-18"
      }
    ],
    reviews: [
      {
        id: "rev_2",
        reviewerId: "client_2",
        reviewerName: "Dr. Maria Khan",
        reviewerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        rating: 4.8,
        comment: "Ayesha created an exceptional layout proposal for our medical diagnostics dashboard. Her wireframes were extremely organized.",
        replyText: "It was fantastic collaborating with your research division, Dr. Maria!",
        createdAt: "2026-05-30"
      }
    ]
  },
  {
    userId: "student_3",
    name: "Haris Khattak",
    email: "haris@fast.edu.pk",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    headline: "Python Backend and AI Engineer",
    bio: "Senior Student at FAST Peshawar specializing in Artificial Intelligence. Proficient with FastAPI, Docker, and training/fine-tuning large language model endpoints. Created multiple chatbots for domestic businesses.",
    skills: ["Python", "FastAPI", "TensorFlow", "PostgreSQL", "Docker", "PyTorch"],
    university: "FAST NUCES, Peshawar Campus",
    department: "Computer Science",
    degreeProgram: "BS Artificial Intelligence",
    degreeYear: "Senior (4th Year)",
    crsScore: 78,
    verificationStatus: VerificationStatus.PENDING,
    rating: 4.6,
    activeOpportunityCount: 0,
    completedProjectCount: 8,
    socialLinks: {
      github: "https://github.com/haris-khattak",
      linkedin: "https://linkedin.com/in/haris-ai"
    },
    portfolio: [
      {
        id: "pf_4",
        title: "Pashto Speech-to-Text Deep Neural Endpoint",
        description: "Developed and served a fine-tuned Whisper model capable of transcribing local Pashto dialect accents to Romanized Urdu text with low-latency API.",
        mediaType: "link",
        mediaUrl: "https://huggingface.co/models/pashto-stt",
        githubUrl: "https://github.com/haris-khattak/pashto-whisper",
        createdAt: "2026-02-28"
      }
    ],
    reviews: []
  }
];

// Seed active gig services
export const INITIAL_GIGS: ServiceGig[] = [
  {
    id: "gig_1",
    studentId: "student_1",
    studentName: "Zeeshan Ahmad",
    studentAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
    studentCrs: 88,
    studentUniversity: "University of Peshawar",
    title: "I will design and build a high-performance React Native Mobile App with beautiful controls",
    description: "Are you looking for a fully-featured, cross-platform app for your venture, institution, or startup? I offer mobile app development using React Native, TypeScript, and NativeWind layout. Each build boasts rich features like maps, persistent local caching, SQLite integrations, and seamless push notifications.",
    category: "Mobile Apps",
    tags: ["React Native", "Expo", "Mobile App", "TypeScript", "iOS", "Android"],
    startingPrice: 35000,
    deliveryTimeDays: 14,
    gallery: [
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600",
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600"
    ],
    faqs: [
      {
        question: "Do you supply testing APK/IPA builds?",
        answer: "Yes, I configure Expo EAS pipelines to deliver live testing builds and scan codes on Android/iOS."
      },
      {
        question: "Can we link local SQL/Firebase backends?",
        answer: "Absolutely. I can construct secure, server-side APIs proxies or integrate directly with Firestore and REST nodes."
      }
    ],
    createdAt: "2026-05-01"
  },
  {
    id: "gig_2",
    studentId: "student_2",
    studentName: "Ayesha Bibi",
    studentAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    studentCrs: 82,
    studentUniversity: "IM Sciences, Peshawar",
    title: "I will craft minimalist Figma UX Design wireframes and product mockups",
    description: "Unveil your product's potential with highly professional, elegant interactive custom prototypes designed strictly in Figma using Linear, Stripe-style aesthetic standards. I craft wireframes, interactive user flows, and extensive design tokens.",
    category: "UI/UX & Product Design",
    tags: ["UI UX", "Figma", "Landing Page", "Wireframes", "Mockup", "Web Design"],
    startingPrice: 12000,
    deliveryTimeDays: 5,
    gallery: [
      "https://images.unsplash.com/photo-1581291518655-9523c932dedf?w=600",
      "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=600"
    ],
    faqs: [
      {
        question: "What files do I retrieve?",
        answer: "You get a fully-organized, complete Figma link with responsive layouts, pixel grids, style guides, and nested elements."
      }
    ],
    createdAt: "2026-05-10"
  },
  {
    id: "gig_3",
    studentId: "student_3",
    studentName: "Haris Khattak",
    studentAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    studentCrs: 78,
    studentUniversity: "FAST NUCES, Peshawar Campus",
    title: "I will deploy high-availability Python FastAPI endpoints with complete Docker packaging",
    description: "Get robust server-side processing for your web apps. I build clean, RESTful APIs using Python, FastAPI, and Pydantic validation. The delivery includes complete SQL migrations, auto-generated Swagger documentations, secure JWT token mechanisms, and full multi-container Docker Compose scripting.",
    category: "Web Development",
    tags: ["Python", "FastAPI", "API", "Docker", "Database", "Backend"],
    startingPrice: 20000,
    deliveryTimeDays: 7,
    gallery: [
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600",
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600"
    ],
    faqs: [
      {
        question: "Do you configure server-side automated tests?",
        answer: "Yes, I construct unit testing setups using Pytest covering over 90% routing path coverage."
      }
    ],
    createdAt: "2026-05-15"
  }
];

// Seed public opportunities on board
export const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp_1",
    clientId: "client_1",
    clientName: "Zawar Shah",
    clientCompany: "Shinwari Tech Labs",
    clientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    title: "Peshawar Artisans Web Application Development",
    description: "We are seeking a talented student developer (preferably in Peshawar) to craft an ecommerce marketplace showcasing Peshawar copper models. The developer must build clean Stripe hooks, inventory management panels, and write server-side API endpoints following Clean Architecture. Experience with Tailwind CSS is desired.",
    category: "Web Development",
    type: "PROJECT",
    budget: 45000,
    deliveryTimeDays: 20,
    skillsRequired: ["Next.js", "React", "Node.js", "Tailwind CSS", "MongoDB"],
    universityLimit: "University of Peshawar",
    deadline: "2026-07-31",
    createdAt: "2026-06-05",
    applicationsCount: 2
  },
  {
    id: "opp_2",
    clientId: "client_2",
    clientName: "Dr. Maria Khan",
    clientCompany: "Peshawar Research & Innovations",
    clientAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    title: "Interactive Medical Sample Diagnostics Wireframes",
    description: "Looking for a UX Design Intern to draft complex clinical sample tracking wireframes and layout prototypes. The applicant will study operator patterns, design high-contrast accessible widgets targeting medical personnel, and generate reusable Figma UI kits. Requires active communication.",
    category: "UI/UX & Product Design",
    type: "INTERNSHIP",
    budget: 15000,
    deliveryTimeDays: 10,
    skillsRequired: ["Figma", "UI/UX Design", "Wireframing", "User Research"],
    deadline: "2026-06-30",
    createdAt: "2026-06-08",
    applicationsCount: 1
  }
];

// Initial mock comments & applications
export const INITIAL_APPLICATIONS = [
  {
    id: "app_1",
    opportunityId: "opp_1",
    studentId: "student_1",
    studentName: "Zeeshan Ahmad",
    studentAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
    studentCrs: 88,
    proposalText: "Hi Zawar, I am perfectly suited for this web application project. I have extensive experience building scalable solutions like my Peshawar Artisans project. I can write beautiful Tailwind panels, secure session trackers, and integrate local server actions on our custom Next server. Looking forward to engineering this together!",
    requestedBudget: 42000,
    deliveryDays: 18,
    attachedPortfolioIds: ["pf_2"],
    status: "PENDING",
    createdAt: "2026-06-06"
  }
];
