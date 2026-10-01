import { createClient } from "@supabase/supabase-js";

// ─── NEW CMS TYPES ────────────────────────────────────────────

export type RichDocument = {
  type: "doc";
  content?: unknown[];
};

export type DepartmentFeature = {
  id: string;
  department_id: string;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: RichDocument | null;
  cover_image: string | null;
  pdf_url: string | null;
  external_url: string | null;
  feature_icon: string | null;
  display_order: number;
  is_active: boolean;
  published: boolean;
  open_in_new_page: boolean;
  created_at?: string;
  updated_at?: string;
  // joined
  images?: DepartmentFeatureImage[];
  documents?: DepartmentFeatureDocument[];
};

export type DepartmentFeatureImage = {
  id: string;
  feature_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at?: string;
};

export type DepartmentFeatureDocument = {
  id: string;
  feature_id: string;
  display_title: string;
  file_url: string;
  file_name: string | null;
  file_type: string | null;
  file_size: string | null;
  sort_order: number;
  created_at?: string;
};

export type DepartmentHOD = {
  id: string;
  department_id: string;
  name: string;
  designation: string | null;
  qualification: string | null;
  experience: string | null;
  photo_url: string | null;
  short_intro: string | null;
  full_message: RichDocument | null;
  email: string | null;
  phone: string | null;
  resume_pdf: string | null;
  display_order: number;
  is_active: boolean;
  published: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DepartmentFacultyMember = {
  id: string;
  department_id: string;
  name: string;
  designation: string | null;
  qualification: string | null;
  experience: string | null;
  specialization: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  short_bio: string | null;
  full_bio: RichDocument | null;
  resume_pdf: string | null;
  research_info: string | null;
  publications: string | null;
  display_order: number;
  is_active: boolean;
  published: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DepartmentLab = {
  id: string;
  department_id: string;
  name: string;
  lab_code: string | null;
  description: string | null;
  incharge: string | null;
  cover_image: string | null;
  equipment: string | null;
  facilities: string | null;
  pdf_url: string | null;
  external_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  images?: DepartmentLabImage[];
};

export type DepartmentLabImage = {
  id: string;
  lab_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

export type DepartmentGalleryImage = {
  id: string;
  department_id: string;
  image_url: string;
  caption: string | null;
  album_name: string | null;
  sort_order: number;
  published: boolean;
  created_at?: string;
};

// ─── EXISTING TYPES ───────────────────────────────────────────

export type Laboratory = {
  name: string;
  description: string;
  capacity?: string;
  incharge?: string;
  photo?: string;
};

export type FacultyMember = {
  name: string;
  designation: string;
  qualification: string;
  experience: string;
  photo?: string;
  email?: string;
};

export type SyllabusItem = {
  title: string;
  semester: string;
  url?: string;
  file_size?: string;
};

export type PlacementData = {
  highest_package?: string;
  average_package?: string;
  placed_percentage?: string;
  top_companies?: string[];
};

export type ContactData = {
  email?: string;
  phone?: string;
  cabin?: string;
  office_hours?: string;
};

export type Department = {
  id: string;
  name: string;
  short_code: string;
  slug: string;
  icon_url: string | null;
  hero_image: string | null;
  card_image?: string | null;
  description: string | null;
  overview?: string | null;
  hod_name: string | null;
  hod_photo: string | null;
  hod_designation?: string | null;
  hod_qualification?: string | null;
  hod_experience?: string | null;
  hod_short_intro?: string | null;
  hod_message?: string | null;
  hod_message_rich?: RichDocument | null;
  hod_email?: string | null;
  hod_phone?: string | null;
  hod_resume_pdf?: string | null;
  intake: string | null;
  duration: string | null;
  display_order: number;
  button_text: string | null;
  theme?: string | null;
  is_active: boolean;
  published: boolean;
  vision?: string | null;
  mission?: string | null;
  laboratories?: Laboratory[] | null;
  faculty?: FacultyMember[] | null;
  syllabus?: SyllabusItem[] | null;
  gallery?: string[] | null;
  placements?: PlacementData | null;
  contact?: ContactData | null;
  created_at?: string;
  updated_at?: string;
};

export const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: "seed-dept-1",
    name: "Computer Engineering",
    short_code: "CE",
    slug: "computer-engineering",
    icon_url: "cpu",
    theme: "blue",
    display_order: 1,
    intake: "120 Seats",
    duration: "4 Years / 8 Semesters",
    description:
      "Empowering future technologists with cutting-edge expertise in software architecture, cloud computing, cybersecurity, and modern systems design.",
    hod_name: "Dr. S. R. Mane",
    hod_photo:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    hero_image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80",
    button_text: "Explore Department",
    is_active: true,
    published: true,
    vision:
      "To develop globally competent computer engineers dedicated to technological innovation, research leadership, and societal advancement.",
    mission:
      "Deliver high-quality technical education through experiential learning, industry immersion, state-of-the-art computational laboratories, and ethical leadership.",
    laboratories: [
      {
        name: "High Performance Computing Lab",
        description:
          "Equipped with Xeon workstations and GPU clusters for deep learning, parallel algorithms, and cloud simulation.",
        capacity: "40 Workstations",
        incharge: "Prof. A. V. Kulkarni",
      },
      {
        name: "Software Engineering & Web Technologies Lab",
        description:
          "Advanced setup for full-stack software development, containerization, and modern CI/CD pipelines.",
        capacity: "40 Systems",
        incharge: "Prof. M. B. Joshi",
      },
      {
        name: "Cybersecurity & Networking Research Center",
        description:
          "Isolated network topology simulator, Cisco hardware routers, and packet analysis tools.",
        capacity: "35 Systems",
        incharge: "Prof. P. R. Deshmukh",
      },
    ],
    faculty: [
      {
        name: "Dr. S. R. Mane",
        designation: "Professor & Head of Department",
        qualification: "Ph.D. in Computer Science & Engg.",
        experience: "19 Years",
        photo:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      },
      {
        name: "Prof. A. V. Kulkarni",
        designation: "Associate Professor",
        qualification: "M.Tech (CSE), Pursuing Ph.D.",
        experience: "14 Years",
        photo:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      },
      {
        name: "Prof. Neha S. Patil",
        designation: "Assistant Professor",
        qualification: "M.E. (Computer Engineering)",
        experience: "9 Years",
        photo:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
      },
    ],
    syllabus: [
      {
        title: "First Year Engineering Curriculum (Common)",
        semester: "Semester 1 & 2",
        url: "#",
        file_size: "2.4 MB",
      },
      {
        title: "B.Tech Computer Engineering Syllabus (2024-28 Pattern)",
        semester: "Semester 3 to 8",
        url: "#",
        file_size: "4.8 MB",
      },
      {
        title: "Electives & Honors Degree Curriculum Handbook",
        semester: "Final Year Specializations",
        url: "#",
        file_size: "1.6 MB",
      },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=80",
    ],
    placements: {
      highest_package: "₹14.5 LPA",
      average_package: "₹4.8 LPA",
      placed_percentage: "96%",
      top_companies: [
        "Tata Consultancy Services",
        "Infosys",
        "Cognizant",
        "Persistent Systems",
        "Capgemini",
        "L&T Infotech",
      ],
    },
    contact: {
      email: "hod.comp@sanjeevan.edu.in",
      phone: "+91 231 2686600",
      cabin: "Main Engineering Complex, 3rd Floor, Room 304",
      office_hours: "Monday - Friday: 9:00 AM - 5:00 PM",
    },
  },
  {
    id: "seed-dept-2",
    name: "Artificial Intelligence & ML",
    short_code: "AI",
    slug: "artificial-intelligence-ml",
    icon_url: "sparkles",
    theme: "red",
    display_order: 2,
    intake: "60 Seats",
    duration: "4 Years / 8 Semesters",
    description:
      "Pioneering the frontiers of autonomous intelligence, machine perception, natural language processing, and neural network algorithms.",
    hod_name: "Dr. V. N. Pawar",
    hod_photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    hero_image:
      "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1600&q=80",
    button_text: "Explore Department",
    is_active: true,
    published: true,
    vision:
      "To be a premier center of excellence producing AI specialists capable of inventing ethical, transformative machine intelligence solutions.",
    mission:
      "Foster deep mathematical foundations, real-world algorithmic implementation, interdisciplinary research, and active industry collaboration in AI/ML.",
    laboratories: [
      {
        name: "Deep Learning & Neural Systems Lab",
        description:
          "Equipped with NVIDIA RTX workstations, TensorRT acceleration frameworks, and PyTorch/TensorFlow suites.",
        capacity: "35 Workstations",
        incharge: "Prof. R. D. Chavan",
      },
      {
        name: "Cognitive Robotics & Perception Lab",
        description:
          "Stereo cameras, LiDAR sensors, edge AI boards (Jetson Orin), and computer vision hardware.",
        capacity: "30 Systems",
        incharge: "Prof. S. M. Jadhav",
      },
    ],
    faculty: [
      {
        name: "Dr. V. N. Pawar",
        designation: "Professor & HOD (AI & ML)",
        qualification: "Ph.D. in Artificial Intelligence",
        experience: "17 Years",
        photo:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      },
      {
        name: "Prof. Snehal A. More",
        designation: "Assistant Professor",
        qualification: "M.Tech (AI & Data Science)",
        experience: "7 Years",
        photo:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
      },
    ],
    syllabus: [
      {
        title: "B.Tech AI & Data Science Integrated Syllabus",
        semester: "Complete Scheme 2024-28",
        url: "#",
        file_size: "3.9 MB",
      },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=80",
    ],
    placements: {
      highest_package: "₹16.0 LPA",
      average_package: "₹5.4 LPA",
      placed_percentage: "94%",
      top_companies: [
        "NVIDIA Collaborations",
        "Infosys AI Labs",
        "KPIT Technologies",
        "Accenture",
      ],
    },
    contact: {
      email: "hod.aiml@sanjeevan.edu.in",
      phone: "+91 231 2686612",
      cabin: "Technology Block A, 2nd Floor, Room 210",
      office_hours: "Monday - Saturday: 9:30 AM - 5:00 PM",
    },
  },
  {
    id: "seed-dept-3",
    name: "Mechanical Engineering",
    short_code: "ME",
    slug: "mechanical-engineering",
    icon_url: "arrow-up-right",
    theme: "gold",
    display_order: 3,
    intake: "60 Seats",
    duration: "4 Years / 8 Semesters",
    description:
      "Integrating thermodynamics, CAD/CAM computational design, precision manufacturing, and thermal energy conversion systems.",
    hod_name: "Dr. A. S. Patil",
    hod_photo:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80",
    hero_image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80",
    button_text: "Explore Department",
    is_active: true,
    published: true,
    vision:
      "To empower mechanical engineers with strong fundamentals, modern manufacturing acumen, and eco-sustainable industrial design skills.",
    mission:
      "Provide hands-on laboratory experiences, advanced CAD/CAE simulations, robust industry internships, and entrepreneurship incubation.",
    laboratories: [
      {
        name: "CAD/CAM & FEA Simulation Center",
        description:
          "Licensed CATIA, ANSYS, and SolidWorks suites running on dedicated engineering workstations.",
        capacity: "45 Workstations",
        incharge: "Prof. K. G. Salunkhe",
      },
      {
        name: "IC Engines & Thermal Systems Lab",
        description:
          "Multi-cylinder computerized test rigs, gas analyzers, and refrigeration test apparatus.",
        capacity: "30 Students",
        incharge: "Prof. B. T. Bhosale",
      },
    ],
    faculty: [
      {
        name: "Dr. A. S. Patil",
        designation: "Professor & HOD (Mechanical)",
        qualification: "Ph.D. (Machine Design)",
        experience: "22 Years",
        photo:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
      },
    ],
    syllabus: [
      {
        title: "B.Tech Mechanical Engineering Course Structure",
        semester: "Semesters 1-8",
        url: "#",
        file_size: "4.1 MB",
      },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80",
    ],
    placements: {
      highest_package: "₹10.5 LPA",
      average_package: "₹4.2 LPA",
      placed_percentage: "91%",
      top_companies: [
        "Tata Motors",
        "Kirloskar Oil Engines",
        "Thermax",
        "Bharat Forge",
        "Mahindra & Mahindra",
      ],
    },
    contact: {
      email: "hod.mech@sanjeevan.edu.in",
      phone: "+91 231 2686620",
      cabin: "Workshop Complex, Ground Floor, Room W102",
      office_hours: "Monday - Friday: 8:30 AM - 4:30 PM",
    },
  },
  {
    id: "seed-dept-4",
    name: "Civil Engineering",
    short_code: "CV",
    slug: "civil-engineering",
    icon_url: "map-pin",
    theme: "green",
    display_order: 4,
    intake: "60 Seats",
    duration: "4 Years / 8 Semesters",
    description:
      "Constructing resilient infrastructure, structural engineering, environmental protection, smart city surveying, and geotechnics.",
    hod_name: "Dr. P. K. Shinde",
    hod_photo:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
    hero_image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80",
    button_text: "Explore Department",
    is_active: true,
    published: true,
    vision:
      "To develop forward-thinking civil engineering professionals committed to building sustainable, earthquake-resilient infrastructure.",
    mission:
      "Train engineers through modern surveying instruments, geotechnical testing, structural analysis software, and environmental impact assessments.",
    laboratories: [
      {
        name: "Advanced Geotechnical Engineering Lab",
        description:
          "Triaxial shear apparatus, consolidometers, and soil stabilization testing rigs.",
        capacity: "30 Students",
        incharge: "Prof. D. K. Ghadge",
      },
      {
        name: "Total Station & Digital Surveying Lab",
        description:
          "Leica Total Stations, digital theodolites, and GPS geodetic mapping units.",
        capacity: "25 Students",
        incharge: "Prof. V. B. Jadhav",
      },
    ],
    faculty: [
      {
        name: "Dr. P. K. Shinde",
        designation: "Professor & HOD (Civil)",
        qualification: "Ph.D. in Structural Engineering",
        experience: "20 Years",
        photo:
          "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
      },
    ],
    syllabus: [
      {
        title: "B.Tech Civil Engineering Syllabus & Scheme",
        semester: "All Semesters",
        url: "#",
        file_size: "3.5 MB",
      },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=900&q=80",
    ],
    placements: {
      highest_package: "₹8.5 LPA",
      average_package: "₹3.8 LPA",
      placed_percentage: "88%",
      top_companies: [
        "Larsen & Toubro",
        "Afcons Infrastructure",
        "Shapoorji Pallonji",
        "Godrej Construction",
      ],
    },
    contact: {
      email: "hod.civil@sanjeevan.edu.in",
      phone: "+91 231 2686630",
      cabin: "Civil Block, 1st Floor, Room C105",
      office_hours: "Monday - Friday: 9:00 AM - 5:00 PM",
    },
  },
  {
    id: "seed-dept-5",
    name: "Electrical Engineering",
    short_code: "EE",
    slug: "electrical-engineering",
    icon_url: "lightbulb",
    theme: "red",
    display_order: 5,
    intake: "60 Seats",
    duration: "4 Years / 8 Semesters",
    description:
      "Advancing smart grid systems, electric vehicle drivetrains, power electronics, renewable energy, and industrial automation.",
    hod_name: "Dr. M. S. Mohite",
    hod_photo:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
    hero_image:
      "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1600&q=80",
    button_text: "Explore Department",
    is_active: true,
    published: true,
    vision:
      "To spearhead sustainable electrical power transition and prepare engineers for clean energy, EV systems, and smart grid automation.",
    mission:
      "Equip students with electrical machine diagnostics, high-voltage safety paradigms, power system simulations, and micro-grid control expertise.",
    laboratories: [
      {
        name: "Power Electronics & Electric Drives Lab",
        description:
          "Inverters, converters, chopper units, and PMSM motor drives for EV bench testing.",
        capacity: "30 Students",
        incharge: "Prof. S. R. Chougule",
      },
    ],
    faculty: [
      {
        name: "Dr. M. S. Mohite",
        designation: "Associate Professor & HOD",
        qualification: "Ph.D. in Power Systems",
        experience: "16 Years",
        photo:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
      },
    ],
    syllabus: [
      {
        title: "B.Tech Electrical Engineering Curriculum",
        semester: "Semester 1-8",
        url: "#",
        file_size: "3.2 MB",
      },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=900&q=80",
    ],
    placements: {
      highest_package: "₹9.2 LPA",
      average_package: "₹4.1 LPA",
      placed_percentage: "90%",
      top_companies: [
        "Schneider Electric",
        "Siemens",
        "ABB India",
        "Tata Power",
        "Kirloskar Electric",
      ],
    },
    contact: {
      email: "hod.elect@sanjeevan.edu.in",
      phone: "+91 231 2686640",
      cabin: "Electrical Block, 2nd Floor, Room E202",
      office_hours: "Monday - Friday: 9:00 AM - 5:00 PM",
    },
  },
  {
    id: "seed-dept-6",
    name: "Electronics Engineering",
    short_code: "EC",
    slug: "electronics-engineering",
    icon_url: "sparkles",
    theme: "blue",
    display_order: 6,
    intake: "60 Seats",
    duration: "4 Years / 8 Semesters",
    description:
      "Specializing in VLSI chip design, embedded IoT architectures, wireless telecommunications, and digital signal processing.",
    hod_name: "Prof. S. C. Bhosale",
    hod_photo:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80",
    hero_image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80",
    button_text: "Explore Department",
    is_active: true,
    published: true,
    vision:
      "To lead research and education in microelectronics, semiconductor devices, and connected IoT ecosystems.",
    mission:
      "Provide cutting-edge VLSI CAD tools, FPGA prototyping benches, RF measurement chambers, and industrial IoT testbeds.",
    laboratories: [
      {
        name: "VLSI Design & Embedded Systems Lab",
        description:
          "Cadence EDA tools, Xilinx FPGA development boards, and ARM Cortex processors.",
        capacity: "35 Workstations",
        incharge: "Prof. G. V. Kadam",
      },
    ],
    faculty: [
      {
        name: "Prof. S. C. Bhosale",
        designation: "Head of Department (Electronics)",
        qualification: "M.E. (VLSI & Embedded Systems)",
        experience: "15 Years",
        photo:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
      },
    ],
    syllabus: [
      {
        title: "B.Tech Electronics & Telecommunication Syllabus",
        semester: "Complete Scheme",
        url: "#",
        file_size: "3.8 MB",
      },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
    ],
    placements: {
      highest_package: "₹11.0 LPA",
      average_package: "₹4.5 LPA",
      placed_percentage: "92%",
      top_companies: [
        "Qualcomm",
        "Intel Testbeds",
        "KPIT",
        "Bosch India",
        "Wipro",
      ],
    },
    contact: {
      email: "hod.entc@sanjeevan.edu.in",
      phone: "+91 231 2686650",
      cabin: "Electronics Wing, 1st Floor, Room EL104",
      office_hours: "Monday - Friday: 9:00 AM - 5:00 PM",
    },
  },
  {
    id: "seed-dept-7",
    name: "Robotics & Automation",
    short_code: "RA",
    slug: "robotics-automation",
    icon_url: "cpu",
    theme: "gold",
    display_order: 7,
    intake: "60 Seats",
    duration: "4 Years / 8 Semesters",
    description:
      "Mastering mechatronics, industrial robotic arms, automated vision inspection, programmable logic controllers, and Industry 4.0 factory automation.",
    hod_name: "Dr. T. S. Sawant",
    hod_photo:
      "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=600&q=80",
    hero_image:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1600&q=80",
    button_text: "Explore Department",
    is_active: true,
    published: true,
    vision:
      "To emerge as a national center of expertise for robotics engineering, smart factory automation, and human-robot collaboration.",
    mission:
      "Impart multidisciplinary knowledge combining sensors, hydraulics, kinematics, embedded firmware, and intelligent autonomous systems.",
    laboratories: [
      {
        name: "Industrial Robotics & Mechatronics Lab",
        description:
          "6-axis articulated industrial robotic arms, SCARA demo units, and pneumatic simulation rigs.",
        capacity: "30 Students",
        incharge: "Prof. R. P. Shaha",
      },
      {
        name: "PLC & SCADA Automation Suite",
        description:
          "Siemens S7-1200 PLCs, Allen Bradley modules, and digital twin manufacturing software.",
        capacity: "30 Workstations",
        incharge: "Prof. H. K. Patel",
      },
    ],
    faculty: [
      {
        name: "Dr. T. S. Sawant",
        designation: "Professor & HOD (Robotics)",
        qualification: "Ph.D. in Robotics & Automation",
        experience: "18 Years",
        photo:
          "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=400&q=80",
      },
    ],
    syllabus: [
      {
        title: "B.Tech Robotics & Automation Approved Scheme",
        semester: "All Semesters 2024-28",
        url: "#",
        file_size: "4.3 MB",
      },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=80",
    ],
    placements: {
      highest_package: "₹12.0 LPA",
      average_package: "₹4.6 LPA",
      placed_percentage: "93%",
      top_companies: [
        "Fanuc India",
        "KUKA Robotics",
        "ABB Automation",
        "Tata Advanced Systems",
        "Honeywell",
      ],
    },
    contact: {
      email: "hod.robotics@sanjeevan.edu.in",
      phone: "+91 231 2686660",
      cabin: "Mechatronics Center, 2nd Floor, Room RA201",
      office_hours: "Monday - Friday: 9:00 AM - 5:00 PM",
    },
  },
];

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Fetches active & published departments ordered by display_order.
 * Falls back to DEFAULT_DEPARTMENTS if Supabase table is not yet configured.
 */
export async function getPublishedDepartments(): Promise<Department[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return DEFAULT_DEPARTMENTS;

    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("published", true)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_DEPARTMENTS;
    }

    return data as Department[];
  } catch {
    return DEFAULT_DEPARTMENTS;
  }
}

/**
 * Fetches a single department by its slug.
 */
export async function getDepartmentBySlug(slug: string): Promise<Department | null> {
  try {
    const supabase = getPublicClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .eq("is_active", true)
        .maybeSingle();

      if (!error && data) {
        return data as Department;
      }
    }

    // Fallback to default
    const fallback = DEFAULT_DEPARTMENTS.find(
      (d) => d.slug === slug && d.published && d.is_active
    );
    return fallback ?? null;
  } catch {
    const fallback = DEFAULT_DEPARTMENTS.find((d) => d.slug === slug);
    return fallback ?? null;
  }
}

/**
 * Fetches all department slugs for dynamic routing.
 */
export async function getAllDepartmentSlugs(): Promise<string[]> {
  try {
    const supabase = getPublicClient();
    if (supabase) {
      const { data } = await supabase
        .from("departments")
        .select("slug")
        .eq("published", true)
        .eq("is_active", true);

      if (data && data.length > 0) {
        return data.map((d: { slug: string }) => d.slug);
      }
    }
    return DEFAULT_DEPARTMENTS.map((d) => d.slug);
  } catch {
    return DEFAULT_DEPARTMENTS.map((d) => d.slug);
  }
}

// ─────────────────────────────────────────────────────────────
// NEW CMS DATA HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all published+active features for a department,
 * including their images and documents.
 */
export async function getDepartmentFeatures(
  departmentId: string,
): Promise<DepartmentFeature[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];

    const { data: features, error } = await supabase
      .from("department_features")
      .select("*")
      .eq("department_id", departmentId)
      .eq("published", true)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !features) return [];

    const featureIds = features.map((f) => f.id as string);
    if (featureIds.length === 0) return features as DepartmentFeature[];

    const [{ data: images }, { data: docs }] = await Promise.all([
      supabase
        .from("department_feature_images")
        .select("*")
        .in("feature_id", featureIds)
        .order("sort_order"),
      supabase
        .from("department_feature_documents")
        .select("*")
        .in("feature_id", featureIds)
        .order("sort_order"),
    ]);

    return features.map((f) => ({
      ...f,
      images: (images ?? []).filter((img) => img.feature_id === f.id),
      documents: (docs ?? []).filter((doc) => doc.feature_id === f.id),
    })) as DepartmentFeature[];
  } catch {
    return [];
  }
}

/**
 * Fetch a single feature by department_id + slug (with images + docs).
 */
export async function getDepartmentFeatureBySlug(
  departmentId: string,
  featureSlug: string,
): Promise<DepartmentFeature | null> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return null;

    const { data: feature, error } = await supabase
      .from("department_features")
      .select("*")
      .eq("department_id", departmentId)
      .eq("slug", featureSlug)
      .eq("published", true)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !feature) return null;

    const [{ data: images }, { data: docs }] = await Promise.all([
      supabase
        .from("department_feature_images")
        .select("*")
        .eq("feature_id", feature.id)
        .order("sort_order"),
      supabase
        .from("department_feature_documents")
        .select("*")
        .eq("feature_id", feature.id)
        .order("sort_order"),
    ]);

    return {
      ...feature,
      images: images ?? [],
      documents: docs ?? [],
    } as DepartmentFeature;
  } catch {
    return null;
  }
}

/**
 * Fetch the published HOD for a department.
 */
export async function getDepartmentHOD(
  departmentId: string,
): Promise<DepartmentHOD | null> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("department_hods")
      .select("*")
      .eq("department_id", departmentId)
      .eq("published", true)
      .eq("is_active", true)
      .order("display_order")
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as DepartmentHOD;
  } catch {
    return null;
  }
}

/**
 * Fetch all published+active faculty for a department.
 */
export async function getDepartmentFaculty(
  departmentId: string,
): Promise<DepartmentFacultyMember[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("department_faculty")
      .select("*")
      .eq("department_id", departmentId)
      .eq("published", true)
      .eq("is_active", true)
      .order("display_order");

    if (error || !data) return [];
    return data as DepartmentFacultyMember[];
  } catch {
    return [];
  }
}

/**
 * Fetch all active labs for a department (with images).
 */
export async function getDepartmentLabs(
  departmentId: string,
): Promise<DepartmentLab[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];

    const { data: labs, error } = await supabase
      .from("department_labs")
      .select("*")
      .eq("department_id", departmentId)
      .eq("is_active", true)
      .order("display_order");

    if (error || !labs || labs.length === 0) return [];

    const labIds = labs.map((l) => l.id as string);
    const { data: images } = await supabase
      .from("department_lab_images")
      .select("*")
      .in("lab_id", labIds)
      .order("sort_order");

    return labs.map((l) => ({
      ...l,
      images: (images ?? []).filter((img) => img.lab_id === l.id),
    })) as DepartmentLab[];
  } catch {
    return [];
  }
}

/**
 * Fetch published gallery images for a department.
 */
export async function getDepartmentGallery(
  departmentId: string,
): Promise<DepartmentGalleryImage[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("department_gallery")
      .select("*")
      .eq("department_id", departmentId)
      .eq("published", true)
      .order("sort_order");

    if (error || !data) return [];
    return data as DepartmentGalleryImage[];
  } catch {
    return [];
  }
}
