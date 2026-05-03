/**
 * Demo data seed — Mahindra University School of Engineering
 * Run once: node src/seedDemo.js
 */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dotenv   = require('dotenv');
const path     = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User    = require('./models/User');
const Project = require('./models/Project');
const Post    = require('./models/Post');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/faculty_student_portal';

// ── Faculty ───────────────────────────────────────────────
const FACULTY = [
  {
    name: 'Dr. Arun Kumar Pujari',
    email: 'arun.pujari@mahindrauniversity.edu.in',
    password: 'faculty123',
    role: 'faculty',
    domain: 'Artificial Intelligence & Data Mining',
    position: 'Professor & Research Advisor',
    headline: 'AI researcher with 25+ years in data mining, combinatorial algorithms, and computer vision.',
    bio: 'Professor Pujari has authored landmark textbooks on data mining and has been a visiting researcher at multiple international universities. His lab focuses on applied machine learning and pattern recognition for real-world domains.',
    skills: ['Artificial Intelligence', 'Data Mining', 'Computer Vision', 'Pattern Recognition', 'Python', 'R'],
    linkedinUrl: 'https://linkedin.com/in/arun-pujari-mu',
  },
  {
    name: 'Dr. Arya Kumar Bhattacharya',
    email: 'arya.bhattacharya@mahindrauniversity.edu.in',
    password: 'faculty123',
    role: 'faculty',
    domain: 'Machine Learning & Autonomous Systems',
    position: 'Professor & Dean of R&D',
    headline: 'Dean of R&D specialising in autonomous systems, game theory, and deep learning.',
    bio: 'Dr. Bhattacharya leads interdisciplinary research at the intersection of AI, robotics, and game theory. He oversees all research initiatives at the School of Engineering and has guided 20+ PhD students.',
    skills: ['Deep Learning', 'Autonomous Systems', 'Game Theory', 'Robotics', 'TensorFlow', 'PyTorch'],
    linkedinUrl: 'https://linkedin.com/in/arya-bhattacharya-mu',
  },
  {
    name: 'Dr. Om Prakash Patel',
    email: 'om.patel@mahindrauniversity.edu.in',
    password: 'faculty123',
    role: 'faculty',
    domain: 'Quantum Computing & Machine Learning',
    position: 'Associate Professor',
    headline: 'Researcher in quantum ML, hybrid neural networks, and computational intelligence.',
    bio: 'Dr. Patel explores quantum-classical hybrid approaches for machine learning. He has published extensively on quantum neural networks and is actively involved in national quantum computing initiatives.',
    skills: ['Quantum Computing', 'Machine Learning', 'Deep Learning', 'Hybrid Neural Networks', 'Qiskit', 'Python'],
    githubUrl: 'https://github.com/oppatel-mu',
  },
  {
    name: 'Dr. Neha Bharill',
    email: 'neha.bharill@mahindrauniversity.edu.in',
    password: 'faculty123',
    role: 'faculty',
    domain: 'Big Data Analytics & Bioinformatics',
    position: 'Associate Professor',
    headline: 'Expert in big data frameworks, bioinformatics pipelines, and ML-based diagnostics.',
    bio: 'Dr. Bharill specialises in large-scale data analytics and bioinformatics, building ML pipelines for healthcare and genomics. She leads the Data Science Research Group and mentors student projects in health-tech.',
    skills: ['Big Data', 'Apache Spark', 'Bioinformatics', 'Machine Learning', 'Python', 'Hadoop'],
    linkedinUrl: 'https://linkedin.com/in/neha-bharill-mu',
    githubUrl: 'https://github.com/nehab-mu',
  },
  {
    name: 'Dr. Prafulla Kalapatapu',
    email: 'prafulla.kalapatapu@mahindrauniversity.edu.in',
    password: 'faculty123',
    role: 'faculty',
    domain: 'Information Retrieval & Deep Learning',
    position: 'Assistant Professor',
    headline: 'Building intelligent retrieval systems and deep learning models for audio and structural data.',
    bio: 'Dr. Kalapatapu works on information retrieval, music information retrieval, and structural health monitoring using deep learning. He is passionate about bridging the gap between signal processing and modern AI.',
    skills: ['Information Retrieval', 'Deep Learning', 'Signal Processing', 'Music IR', 'PyTorch', 'Python'],
    githubUrl: 'https://github.com/prafulla-k-mu',
  },
  {
    name: 'Dr. Ram Mohan Vemuri',
    email: 'ram.vemuri@mahindrauniversity.edu.in',
    password: 'faculty123',
    role: 'faculty',
    domain: 'VLSI Design & Electronic Design Automation',
    position: 'Professor & Head of ECE',
    headline: 'Head of ECE; expert in VLSI, EDA, and semiconductor circuit design.',
    bio: 'Dr. Vemuri heads the Electrical and Computer Engineering department. He has decades of experience in VLSI design and EDA tools and has been a key contributor to open-source hardware projects.',
    skills: ['VLSI Design', 'EDA', 'Semiconductor Engineering', 'Verilog', 'CMOS', 'Circuit Simulation'],
    linkedinUrl: 'https://linkedin.com/in/ram-vemuri-mu',
  },
];

// ── Projects per faculty ──────────────────────────────────
const buildProjects = (faculty) => [
  // Arun Pujari
  {
    title: 'Explainable AI for Medical Imaging Diagnostics',
    summary: 'Develop explainable deep learning models to assist radiologists in detecting anomalies in chest X-rays and CT scans.',
    description: `This project aims to build and evaluate explainable AI (XAI) pipelines for medical image analysis. Students will work with real-world radiology datasets, train CNN and Vision Transformer models, and apply explainability techniques like Grad-CAM and SHAP to make model decisions interpretable to clinicians.\n\nThe output will be a deployable web-based tool that highlights suspicious regions in X-ray/CT images and provides confidence scores with textual explanations.`,
    professor: faculty['arun.pujari@mahindrauniversity.edu.in'],
    domain: 'Artificial Intelligence',
    department: 'Computer Science Engineering',
    duration: '6 months',
    deadline: new Date('2025-08-31'),
    minCgpa: 7.5,
    eligibleYears: ['3rd Year', '4th Year'],
    eligibleDepartments: ['Computer Science Engineering', 'Software Engineering', 'Artificial Intelligence & Machine Learning'],
    requiredSkills: ['Python', 'PyTorch', 'Computer Vision', 'Deep Learning'],
    tags: ['XAI', 'Medical Imaging', 'CNN', 'Healthcare AI'],
    basket: 'Research',
    projectType: 'Research Project',
    flavorText: 'Where deep learning meets clinical impact',
    status: 'open',
    futureProspects: { text: 'Potential for publication in a top-tier medical AI journal and collaboration with a partner hospital.', isMandatory: false },
  },
  // Arya Bhattacharya
  {
    title: 'Multi-Agent Simulation for Autonomous Campus Delivery Drones',
    summary: 'Design and simulate a multi-agent system of autonomous drones coordinating deliveries across the Mahindra University campus.',
    description: `Working under Dr. Bhattacharya, students will design a multi-agent reinforcement learning environment in which autonomous drone agents navigate a simulated campus map, avoid collisions, optimise delivery routes, and coordinate with ground robots.\n\nThe project involves environment modelling in Python/ROS, training RL agents using PPO/SAC algorithms, and evaluating emergent coordination behaviours. A live demo on a scaled physical model is the stretch goal.`,
    professor: faculty['arya.bhattacharya@mahindrauniversity.edu.in'],
    domain: 'Autonomous Systems & Robotics',
    department: 'Computer Science Engineering',
    duration: '5 months',
    deadline: new Date('2025-07-15'),
    minCgpa: 7.0,
    eligibleYears: ['2nd Year', '3rd Year', '4th Year'],
    eligibleDepartments: ['Computer Science Engineering', 'Software Engineering', 'Electrical Engineering'],
    requiredSkills: ['Python', 'Reinforcement Learning', 'ROS', 'Simulation'],
    tags: ['Multi-Agent', 'RL', 'Drones', 'Robotics'],
    basket: 'Research',
    projectType: 'Research & Prototype',
    flavorText: 'Teaching machines to cooperate — one campus delivery at a time',
    status: 'open',
    futureProspects: { text: 'Students may present findings at ICRA or IROS student workshops. Physical prototype possible in semester 2.', isMandatory: false },
  },
  // Om Prakash Patel
  {
    title: 'Quantum-Classical Hybrid Model for Drug Discovery',
    summary: 'Leverage quantum computing circuits combined with classical neural networks to accelerate molecular property prediction for drug candidates.',
    description: `This cutting-edge project combines quantum variational circuits (using Qiskit and PennyLane) with classical deep learning layers to form a hybrid model for predicting binding affinity of small molecules. Students will learn quantum circuit design, data encoding strategies, and how to benchmark hybrid models against classical baselines on drug discovery datasets (QM9, MoleculeNet).\n\nNo prior quantum computing experience is necessary — training sessions will be provided.`,
    professor: faculty['om.patel@mahindrauniversity.edu.in'],
    domain: 'Quantum Computing',
    department: 'Computer Science Engineering',
    duration: '4 months',
    deadline: new Date('2025-09-30'),
    minCgpa: 7.0,
    eligibleYears: ['3rd Year', '4th Year'],
    eligibleDepartments: ['Computer Science Engineering', 'Software Engineering', 'Electrical Engineering'],
    requiredSkills: ['Python', 'Machine Learning', 'Linear Algebra'],
    tags: ['Quantum ML', 'Drug Discovery', 'Qiskit', 'Hybrid AI'],
    basket: 'Research',
    projectType: 'Exploratory Research',
    flavorText: 'Where qubits meet molecules',
    status: 'open',
    futureProspects: { text: 'Possible co-authorship on a quantum ML research paper. Gateway to national quantum computing fellowships.', isMandatory: false },
  },
  // Neha Bharill
  {
    title: 'Real-Time Genomic Data Pipeline for Disease Surveillance',
    summary: 'Build a scalable data engineering pipeline that ingests, processes, and analyses genomic sequencing data in near real-time for infectious disease surveillance.',
    description: `In collaboration with a public health partner, this project tasks students with designing an Apache Kafka + Spark Streaming pipeline that ingests raw FASTQ genomic sequences, performs quality control, variant calling, and stores structured results in a data warehouse for epidemiological analysis.\n\nStudents will gain hands-on experience with cloud-native data engineering (AWS/GCP), bioinformatics tools (BWA, GATK), and real-time analytics dashboards.`,
    professor: faculty['neha.bharill@mahindrauniversity.edu.in'],
    domain: 'Bioinformatics & Big Data',
    department: 'Computer Science Engineering',
    duration: '6 months',
    deadline: new Date('2025-08-01'),
    minCgpa: 7.5,
    eligibleYears: ['3rd Year', '4th Year'],
    eligibleDepartments: ['Computer Science Engineering', 'Software Engineering', 'Artificial Intelligence & Machine Learning', 'Data Science'],
    requiredSkills: ['Python', 'Apache Spark', 'Data Engineering', 'SQL'],
    tags: ['Bioinformatics', 'Data Pipeline', 'Genomics', 'Real-Time'],
    basket: 'Industry Collaboration',
    projectType: 'Applied Research',
    flavorText: 'Tracking outbreaks one genome at a time',
    status: 'open',
    futureProspects: { text: 'Pipeline may be open-sourced and adopted by partner NGOs. Students co-author a data engineering case study.', isMandatory: false },
  },
  // Prafulla Kalapatapu
  {
    title: 'Deep Learning for Structural Health Monitoring of Bridges',
    summary: 'Deploy sensor fusion and deep learning models to detect micro-cracks and fatigue in bridge structures using vibration and acoustic emission data.',
    description: `Bridges and civil structures degrade silently. This project develops an end-to-end SHM (Structural Health Monitoring) system using IoT vibration sensors, acoustic emission hardware, and deep learning time-series models (TCN, Transformers) to detect anomalies indicative of structural fatigue.\n\nStudents will work with real sensor data from Mahindra University's civil engineering test structures, build and train anomaly detection models, and develop a monitoring dashboard.`,
    professor: faculty['prafulla.kalapatapu@mahindrauniversity.edu.in'],
    domain: 'Deep Learning & Signal Processing',
    department: 'Computer Science Engineering',
    duration: '5 months',
    deadline: new Date('2025-10-15'),
    minCgpa: 6.5,
    eligibleYears: ['2nd Year', '3rd Year', '4th Year'],
    eligibleDepartments: ['Computer Science Engineering', 'Software Engineering', 'Electrical Engineering', 'Civil Engineering'],
    requiredSkills: ['Python', 'Deep Learning', 'Signal Processing', 'Time Series'],
    tags: ['SHM', 'IoT', 'Anomaly Detection', 'Civil-AI'],
    basket: 'Research',
    projectType: 'Interdisciplinary Research',
    flavorText: 'Teaching silicon to listen to concrete',
    status: 'open',
    futureProspects: { text: 'Potential deployment in real infrastructure monitoring projects with civil engineering department and government partners.', isMandatory: false },
  },
  // Ram Mohan Vemuri
  {
    title: 'Open-Source RISC-V Processor Core Verification Suite',
    summary: 'Build a comprehensive UVM-based functional verification suite for an open-source RISC-V processor implementation, targeting 95%+ coverage.',
    description: `RISC-V is becoming the de-facto open ISA. This project tasks students with writing SystemVerilog/UVM test benches for an existing open-source RISC-V core (e.g., CVA6). Students will learn industry-standard hardware verification methodologies — coverage-driven verification, constrained-random testing, and formal property checking.\n\nThe deliverable is a reusable open-source verification IP that can be contributed upstream to the RISC-V Foundation's verification working group.`,
    professor: faculty['ram.vemuri@mahindrauniversity.edu.in'],
    domain: 'VLSI & Hardware Verification',
    department: 'Electronics & Communication Engineering',
    duration: '6 months',
    deadline: new Date('2025-09-01'),
    minCgpa: 7.0,
    eligibleYears: ['3rd Year', '4th Year'],
    eligibleDepartments: ['Electronics & Communication Engineering', 'Electrical Engineering', 'Computer Science Engineering'],
    requiredSkills: ['Verilog', 'SystemVerilog', 'Digital Design', 'Computer Architecture'],
    tags: ['RISC-V', 'VLSI', 'Verification', 'Open Source'],
    basket: 'Open Source',
    projectType: 'Engineering Project',
    flavorText: 'Proving silicon correctness, one assertion at a time',
    status: 'open',
    futureProspects: { text: 'Verified IP contributed to RISC-V Foundation. Strong preparation for VLSI/EDA industry roles at companies like Qualcomm, Intel, Synopsys.', isMandatory: false },
  },
];

// ── Bulletin posts ────────────────────────────────────────
const buildPosts = (admin, faculty) => [
  {
    author: admin._id,
    title: 'Applications Open: Mahindra University Research Fellowship 2025',
    content: 'The Office of Research & Development is pleased to announce the MU Research Fellowship 2025. Eligible final-year students and postgraduates may apply for fully-funded research positions under faculty mentors. Application portal opens June 1, 2025. Selected fellows receive a monthly stipend, lab access, and co-authorship opportunities. Contact: research@mahindrauniversity.edu.in',
    type: 'announcement',
  },
  {
    author: admin._id,
    title: 'Project Application Deadline Reminder — July 15',
    content: 'Several research projects listed on CollabSphere have a fast-approaching deadline of July 15, 2025. Students in their 3rd and 4th year are strongly encouraged to browse open projects and submit applications well in advance. Late applications will not be entertained. Visit the Projects tab to explore and apply.',
    type: 'deadline',
  },
  {
    author: faculty['neha.bharill@mahindrauniversity.edu.in'],
    title: 'Workshop: Introduction to Big Data Tools — Spark & Kafka',
    content: 'Dr. Neha Bharill\'s Data Science Research Group is hosting a 2-day hands-on workshop on Apache Spark and Kafka on June 14–15, 2025 (10 AM – 4 PM) in the Computer Science Lab, Block B. Open to all undergraduate students. Pre-registration required — limited to 30 seats. Register at: forms.mahindrauniversity.edu.in/spark-workshop',
    type: 'announcement',
  },
  {
    author: faculty['arya.bhattacharya@mahindrauniversity.edu.in'],
    title: 'Research Colloquium: Autonomous Systems & AI — June 20',
    content: 'The School of Engineering R&D Division will host a Research Colloquium on June 20, 2025 at the MU Auditorium. Guest speakers include researchers from IIT Hyderabad and IIIT Hyderabad on topics spanning autonomous vehicles, multi-agent systems, and ethical AI. All students and faculty are welcome. No registration needed.',
    type: 'notice',
  },
  {
    author: faculty['arun.pujari@mahindrauniversity.edu.in'],
    title: 'New Open-Access Dataset: MU-MedScan Chest X-ray Repository',
    content: 'Prof. Arun Pujari\'s lab has released the MU-MedScan dataset — 12,000 annotated chest X-rays (with radiologist labels) — as an open-access resource for the research community. Students working on the Explainable AI for Medical Imaging project will have priority access. Dataset available at: research.mahindrauniversity.edu.in/mu-medscan',
    type: 'announcement',
  },
  {
    author: admin._id,
    title: 'End Semester Project Submission Guidelines',
    content: 'Students enrolled in research projects under faculty mentors must submit their mid-semester progress reports by June 30, 2025. Reports should include: work completed, challenges faced, next milestones, and preliminary results. Submit via the CollabSphere portal under your project\'s discussion section or email your faculty mentor directly.',
    type: 'notice',
  },
  {
    author: faculty['om.patel@mahindrauniversity.edu.in'],
    title: 'Quantum Computing Reading Group — Weekly Sessions',
    content: 'Dr. Om Patel is starting a weekly Quantum Computing Reading Group every Friday at 5 PM in Room 204, CSE Block. Topics will cover quantum algorithms, variational circuits, and quantum ML. All are welcome — no prior quantum background needed. First session: June 6, 2025. WhatsApp group link: bit.ly/mu-qc-group',
    type: 'general',
  },
  {
    author: admin._id,
    title: 'CollabSphere Platform Launch — Welcome!',
    content: 'We\'re excited to officially launch CollabSphere, Mahindra University\'s faculty-student research collaboration portal. Faculty can now post projects, review applications, and manage their research teams. Students can discover projects, apply, and track their applications — all in one place. For support or feedback, contact: collabsphere@mahindrauniversity.edu.in',
    type: 'announcement',
  },
];

// ── Main ──────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Find admin
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) { console.error('No admin found — run server first to auto-seed admin'); process.exit(1); }

  // Check if already seeded
  const existingFaculty = await User.findOne({ email: 'arun.pujari@mahindrauniversity.edu.in' });
  if (existingFaculty) {
    console.log('Demo data already seeded. Skipping.');
    await mongoose.disconnect();
    return;
  }

  // Create faculty
  const hash = await bcrypt.hash('faculty123', 10);
  const facultyDocs = {};
  for (const f of FACULTY) {
    const { password, ...rest } = f;
    const doc = await User.create({ ...rest, password: hash });
    facultyDocs[f.email] = doc._id;
    console.log(`Created faculty: ${f.name}`);
  }

  // Create projects
  const projects = buildProjects(facultyDocs);
  for (const p of projects) {
    await Project.create(p);
    console.log(`Created project: ${p.title}`);
  }

  // Create bulletin posts
  const posts = buildPosts(admin, facultyDocs);
  for (const p of posts) {
    await Post.create(p);
    console.log(`Created post: ${p.title}`);
  }

  console.log('\n✓ Demo seed complete!');
  console.log('Faculty login password: faculty123');
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
