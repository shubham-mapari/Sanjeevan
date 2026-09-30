-- ==========================================================
-- DEPARTMENTS CMS — FULL DYNAMIC MANAGEMENT SCHEMA
-- ==========================================================

create table if not exists public.departments (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  short_code    text        not null,
  slug          text        not null unique,
  icon_url      text,
  hero_image    text,
  description   text,
  hod_name      text,
  hod_photo     text,
  intake        text        default '60 Seats',
  duration      text        default '4 Years / 8 Semesters',
  display_order integer     not null default 0,
  button_text   text        default 'Explore Department',
  theme         text        default 'blue',
  is_active     boolean     not null default true,
  published     boolean     not null default true,
  vision        text,
  mission       text,
  laboratories  jsonb       default '[]'::jsonb,
  faculty       jsonb       default '[]'::jsonb,
  syllabus      jsonb       default '[]'::jsonb,
  gallery       jsonb       default '[]'::jsonb,
  placements    jsonb       default '{}'::jsonb,
  contact       jsonb       default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Indexes for performance
create index if not exists departments_order_idx
  on public.departments(display_order, is_active, published);

create index if not exists departments_slug_idx
  on public.departments(slug);

-- Auto-update updated_at trigger
create or replace function public.set_departments_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists departments_set_updated_at on public.departments;
create trigger departments_set_updated_at
  before update on public.departments
  for each row execute function public.set_departments_updated_at();

-- Enable RLS
alter table public.departments enable row level security;

-- RLS Policies
create policy "public read published departments"
  on public.departments for select to anon, authenticated
  using (published = true and is_active = true);

create policy "admins read all departments"
  on public.departments for select to authenticated
  using (public.is_navigation_admin());

create policy "admins manage departments"
  on public.departments for all to authenticated
  using (public.is_navigation_admin())
  with check (public.is_navigation_admin());

-- Seed initial departments data matching the current verified departments
insert into public.departments (
  name, short_code, slug, icon_url, theme, display_order, intake, duration,
  description, hod_name, hod_photo, hero_image, button_text, is_active, published,
  vision, mission, laboratories, faculty, syllabus, gallery, placements, contact
) values
(
  'Computer Engineering',
  'CE',
  'computer-engineering',
  'cpu',
  'blue',
  1,
  '120 Seats',
  '4 Years / 8 Semesters',
  'Empowering future technologists with cutting-edge expertise in software architecture, cloud computing, cybersecurity, and modern systems design.',
  'Dr. S. R. Mane',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80',
  'Explore Department',
  true,
  true,
  'To develop globally competent computer engineers dedicated to technological innovation, research leadership, and societal advancement.',
  'Deliver high-quality technical education through experiential learning, industry immersion, state-of-the-art computational laboratories, and ethical leadership.',
  '[{"name":"High Performance Computing Lab","description":"Equipped with Xeon workstations and GPU clusters for deep learning, parallel algorithms, and cloud simulation.","capacity":"40 Workstations","incharge":"Prof. A. V. Kulkarni"},{"name":"Software Engineering & Web Technologies Lab","description":"Advanced setup for full-stack software development, containerization, and modern CI/CD pipelines.","capacity":"40 Systems","incharge":"Prof. M. B. Joshi"},{"name":"Cybersecurity & Networking Research Center","description":"Isolated network topology simulator, Cisco hardware routers, and packet analysis tools.","capacity":"35 Systems","incharge":"Prof. P. R. Deshmukh"}]'::jsonb,
  '[{"name":"Dr. S. R. Mane","designation":"Professor & Head of Department","qualification":"Ph.D. in Computer Science & Engg.","experience":"19 Years","photo":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"},{"name":"Prof. A. V. Kulkarni","designation":"Associate Professor","qualification":"M.Tech (CSE), Pursuing Ph.D.","experience":"14 Years","photo":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"},{"name":"Prof. Neha S. Patil","designation":"Assistant Professor","qualification":"M.E. (Computer Engineering)","experience":"9 Years","photo":"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"}]'::jsonb,
  '[{"title":"First Year Engineering Curriculum (Common)","semester":"Semester 1 & 2","url":"#","file_size":"2.4 MB"},{"title":"B.Tech Computer Engineering Syllabus (2024-28 Pattern)","semester":"Semester 3 to 8","url":"#","file_size":"4.8 MB"},{"title":"Electives & Honors Degree Curriculum Handbook","semester":"Final Year Specializations","url":"#","file_size":"1.6 MB"}]'::jsonb,
  '["https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=80"]'::jsonb,
  '{"highest_package":"₹14.5 LPA","average_package":"₹4.8 LPA","placed_percentage":"96%","top_companies":["Tata Consultancy Services","Infosys","Cognizant","Persistent Systems","Capgemini","L&T Infotech"]}'::jsonb,
  '{"email":"hod.comp@sanjeevan.edu.in","phone":"+91 231 2686600","cabin":"Main Engineering Complex, 3rd Floor, Room 304","office_hours":"Monday - Friday: 9:00 AM - 5:00 PM"}'::jsonb
),
(
  'Artificial Intelligence & ML',
  'AI',
  'artificial-intelligence-ml',
  'sparkles',
  'red',
  2,
  '60 Seats',
  '4 Years / 8 Semesters',
  'Pioneering the frontiers of autonomous intelligence, machine perception, natural language processing, and neural network algorithms.',
  'Dr. V. N. Pawar',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1600&q=80',
  'Explore Department',
  true,
  true,
  'To be a premier center of excellence producing AI specialists capable of inventing ethical, transformative machine intelligence solutions.',
  'Foster deep mathematical foundations, real-world algorithmic implementation, interdisciplinary research, and active industry collaboration in AI/ML.',
  '[{"name":"Deep Learning & Neural Systems Lab","description":"Equipped with NVIDIA RTX workstations, TensorRT acceleration frameworks, and PyTorch/TensorFlow suites.","capacity":"35 Workstations","incharge":"Prof. R. D. Chavan"},{"name":"Cognitive Robotics & Perception Lab","description":"Stereo cameras, LiDAR sensors, edge AI boards (Jetson Orin), and computer vision hardware.","capacity":"30 Systems","incharge":"Prof. S. M. Jadhav"}]'::jsonb,
  '[{"name":"Dr. V. N. Pawar","designation":"Professor & HOD (AI & ML)","qualification":"Ph.D. in Artificial Intelligence","experience":"17 Years","photo":"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"},{"name":"Prof. Snehal A. More","designation":"Assistant Professor","qualification":"M.Tech (AI & Data Science)","experience":"7 Years","photo":"https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80"}]'::jsonb,
  '[{"title":"B.Tech AI & Data Science Integrated Syllabus","semester":"Complete Scheme 2024-28","url":"#","file_size":"3.9 MB"}]'::jsonb,
  '["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=80"]'::jsonb,
  '{"highest_package":"₹16.0 LPA","average_package":"₹5.4 LPA","placed_percentage":"94%","top_companies":["NVIDIA Collaborations","Infosys AI Labs","KPIT Technologies","Accenture"]}'::jsonb,
  '{"email":"hod.aiml@sanjeevan.edu.in","phone":"+91 231 2686612","cabin":"Technology Block A, 2nd Floor, Room 210","office_hours":"Monday - Saturday: 9:30 AM - 5:00 PM"}'::jsonb
),
(
  'Mechanical Engineering',
  'ME',
  'mechanical-engineering',
  'arrow-up-right',
  'gold',
  3,
  '60 Seats',
  '4 Years / 8 Semesters',
  'Integrating thermodynamics, CAD/CAM computational design, precision manufacturing, and thermal energy conversion systems.',
  'Dr. A. S. Patil',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80',
  'Explore Department',
  true,
  true,
  'To empower mechanical engineers with strong fundamentals, modern manufacturing acumen, and eco-sustainable industrial design skills.',
  'Provide hands-on laboratory experiences, advanced CAD/CAE simulations, robust industry internships, and entrepreneurship incubation.',
  '[{"name":"CAD/CAM & FEA Simulation Center","description":"Licensed CATIA, ANSYS, and SolidWorks suites running on dedicated engineering workstations.","capacity":"45 Workstations","incharge":"Prof. K. G. Salunkhe"},{"name":"IC Engines & Thermal Systems Lab","description":"Multi-cylinder computerized test rigs, gas analyzers, and refrigeration test apparatus.","capacity":"30 Students","incharge":"Prof. B. T. Bhosale"}]'::jsonb,
  '[{"name":"Dr. A. S. Patil","designation":"Professor & HOD (Mechanical)","qualification":"Ph.D. (Machine Design)","experience":"22 Years","photo":"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80"}]'::jsonb,
  '[{"title":"B.Tech Mechanical Engineering Course Structure","semester":"Semesters 1-8","url":"#","file_size":"4.1 MB"}]'::jsonb,
  '["https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80"]'::jsonb,
  '{"highest_package":"₹10.5 LPA","average_package":"₹4.2 LPA","placed_percentage":"91%","top_companies":["Tata Motors","Kirloskar Oil Engines","Thermax","Bharat Forge","Mahindra & Mahindra"]}'::jsonb,
  '{"email":"hod.mech@sanjeevan.edu.in","phone":"+91 231 2686620","cabin":"Workshop Complex, Ground Floor, Room W102","office_hours":"Monday - Friday: 8:30 AM - 4:30 PM"}'::jsonb
),
(
  'Civil Engineering',
  'CV',
  'civil-engineering',
  'map-pin',
  'green',
  4,
  '60 Seats',
  '4 Years / 8 Semesters',
  'Constructing resilient infrastructure, structural engineering, environmental protection, smart city surveying, and geotechnics.',
  'Dr. P. K. Shinde',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80',
  'Explore Department',
  true,
  true,
  'To develop forward-thinking civil engineering professionals committed to building sustainable, earthquake-resilient infrastructure.',
  'Train engineers through modern surveying instruments, geotechnical testing, structural analysis software, and environmental impact assessments.',
  '[{"name":"Advanced Geotechnical Engineering Lab","description":"Triaxial shear apparatus, consolidometers, and soil stabilization testing rigs.","capacity":"30 Students","incharge":"Prof. D. K. Ghadge"},{"name":"Total Station & Digital Surveying Lab","description":"Leica Total Stations, digital theodolites, and GPS geodetic mapping units.","capacity":"25 Students","incharge":"Prof. V. B. Jadhav"}]'::jsonb,
  '[{"name":"Dr. P. K. Shinde","designation":"Professor & HOD (Civil)","qualification":"Ph.D. in Structural Engineering","experience":"20 Years","photo":"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80"}]'::jsonb,
  '[{"title":"B.Tech Civil Engineering Syllabus & Scheme","semester":"All Semesters","url":"#","file_size":"3.5 MB"}]'::jsonb,
  '["https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=900&q=80"]'::jsonb,
  '{"highest_package":"₹8.5 LPA","average_package":"₹3.8 LPA","placed_percentage":"88%","top_companies":["Larsen & Toubro","Afcons Infrastructure","Shapoorji Pallonji","Godrej Construction"]}'::jsonb,
  '{"email":"hod.civil@sanjeevan.edu.in","phone":"+91 231 2686630","cabin":"Civil Block, 1st Floor, Room C105","office_hours":"Monday - Friday: 9:00 AM - 5:00 PM"}'::jsonb
),
(
  'Electrical Engineering',
  'EE',
  'electrical-engineering',
  'lightbulb',
  'red',
  5,
  '60 Seats',
  '4 Years / 8 Semesters',
  'Advancing smart grid systems, electric vehicle drivetrains, power electronics, renewable energy, and industrial automation.',
  'Dr. M. S. Mohite',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1600&q=80',
  'Explore Department',
  true,
  true,
  'To spearhead sustainable electrical power transition and prepare engineers for clean energy, EV systems, and smart grid automation.',
  'Equip students with electrical machine diagnostics, high-voltage safety paradigms, power system simulations, and micro-grid control expertise.',
  '[{"name":"Power Electronics & Electric Drives Lab","description":"Inverters, converters, chopper units, and PMSM motor drives for EV bench testing.","capacity":"30 Students","incharge":"Prof. S. R. Chougule"}]'::jsonb,
  '[{"name":"Dr. M. S. Mohite","designation":"Associate Professor & HOD","qualification":"Ph.D. in Power Systems","experience":"16 Years","photo":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80"}]'::jsonb,
  '[{"title":"B.Tech Electrical Engineering Curriculum","semester":"Semester 1-8","url":"#","file_size":"3.2 MB"}]'::jsonb,
  '["https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=900&q=80"]'::jsonb,
  '{"highest_package":"₹9.2 LPA","average_package":"₹4.1 LPA","placed_percentage":"90%","top_companies":["Schneider Electric","Siemens","ABB India","Tata Power","Kirloskar Electric"]}'::jsonb,
  '{"email":"hod.elect@sanjeevan.edu.in","phone":"+91 231 2686640","cabin":"Electrical Block, 2nd Floor, Room E202","office_hours":"Monday - Friday: 9:00 AM - 5:00 PM"}'::jsonb
),
(
  'Electronics Engineering',
  'EC',
  'electronics-engineering',
  'sparkles',
  'blue',
  6,
  '60 Seats',
  '4 Years / 8 Semesters',
  'Specializing in VLSI chip design, embedded IoT architectures, wireless telecommunications, and digital signal processing.',
  'Prof. S. C. Bhosale',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
  'Explore Department',
  true,
  true,
  'To lead research and education in microelectronics, semiconductor devices, and connected IoT ecosystems.',
  'Provide cutting-edge VLSI CAD tools, FPGA prototyping benches, RF measurement chambers, and industrial IoT testbeds.',
  '[{"name":"VLSI Design & Embedded Systems Lab","description":"Cadence EDA tools, Xilinx FPGA development boards, and ARM Cortex processors.","capacity":"35 Workstations","incharge":"Prof. G. V. Kadam"}]'::jsonb,
  '[{"name":"Prof. S. C. Bhosale","designation":"Head of Department (Electronics)","qualification":"M.E. (VLSI & Embedded Systems)","experience":"15 Years","photo":"https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80"}]'::jsonb,
  '[{"title":"B.Tech Electronics & Telecommunication Syllabus","semester":"Complete Scheme","url":"#","file_size":"3.8 MB"}]'::jsonb,
  '["https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80"]'::jsonb,
  '{"highest_package":"₹11.0 LPA","average_package":"₹4.5 LPA","placed_percentage":"92%","top_companies":["Qualcomm","Intel Testbeds","KPIT","Bosch India","Wipro"]}'::jsonb,
  '{"email":"hod.entc@sanjeevan.edu.in","phone":"+91 231 2686650","cabin":"Electronics Wing, 1st Floor, Room EL104","office_hours":"Monday - Friday: 9:00 AM - 5:00 PM"}'::jsonb
),
(
  'Robotics & Automation',
  'RA',
  'robotics-automation',
  'cpu',
  'gold',
  7,
  '60 Seats',
  '4 Years / 8 Semesters',
  'Mastering mechatronics, industrial robotic arms, automated vision inspection, programmable logic controllers, and Industry 4.0 factory automation.',
  'Dr. T. S. Sawant',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1600&q=80',
  'Explore Department',
  true,
  true,
  'To emerge as a national center of expertise for robotics engineering, smart factory automation, and human-robot collaboration.',
  'Impart multidisciplinary knowledge combining sensors, hydraulics, kinematics, embedded firmware, and intelligent autonomous systems.',
  '[{"name":"Industrial Robotics & Mechatronics Lab","description":"6-axis articulated industrial robotic arms, SCARA demo units, and pneumatic simulation rigs.","capacity":"30 Students","incharge":"Prof. R. P. Shaha"},{"name":"PLC & SCADA Automation Suite","description":"Siemens S7-1200 PLCs, Allen Bradley modules, and digital twin manufacturing software.","capacity":"30 Workstations","incharge":"Prof. H. K. Patel"}]'::jsonb,
  '[{"name":"Dr. T. S. Sawant","designation":"Professor & HOD (Robotics)","qualification":"Ph.D. in Robotics & Automation","experience":"18 Years","photo":"https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=400&q=80"}]'::jsonb,
  '[{"title":"B.Tech Robotics & Automation Approved Scheme","semester":"All Semesters 2024-28","url":"#","file_size":"4.3 MB"}]'::jsonb,
  '["https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=80"]'::jsonb,
  '{"highest_package":"₹12.0 LPA","average_package":"₹4.6 LPA","placed_percentage":"93%","top_companies":["Fanuc India","KUKA Robotics","ABB Automation","Tata Advanced Systems","Honeywell"]}'::jsonb,
  '{"email":"hod.robotics@sanjeevan.edu.in","phone":"+91 231 2686660","cabin":"Mechatronics Center, 2nd Floor, Room RA201","office_hours":"Monday - Friday: 9:00 AM - 5:00 PM"}'::jsonb
)
on conflict (slug) do update set
  name = excluded.name,
  short_code = excluded.short_code,
  icon_url = excluded.icon_url,
  theme = excluded.theme,
  display_order = excluded.display_order,
  intake = excluded.intake,
  duration = excluded.duration,
  description = excluded.description,
  hod_name = excluded.hod_name,
  hod_photo = excluded.hod_photo,
  hero_image = excluded.hero_image,
  button_text = excluded.button_text,
  is_active = excluded.is_active,
  published = excluded.published,
  vision = excluded.vision,
  mission = excluded.mission,
  laboratories = excluded.laboratories,
  faculty = excluded.faculty,
  syllabus = excluded.syllabus,
  gallery = excluded.gallery,
  placements = excluded.placements,
  contact = excluded.contact;
