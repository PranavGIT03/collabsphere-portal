/**
 * Seeds Aditya Goyal student account + accepted application so messaging is unlocked.
 * Run: MONGO_URI="mongodb+srv://..." node backend/src/seedAditya.js
 */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dotenv   = require('dotenv');
const path     = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User    = require('./models/User');
const Project = require('./models/Project');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/faculty_student_portal';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // 1. Create (or find) Aditya Goyal
  let aditya = await User.findOne({ email: 'se23uari003@mahindrauniversity.edu.in' });
  if (!aditya) {
    const hash = await bcrypt.hash('student123', 12);
    aditya = await User.create({
      name: 'Aditya Goyal',
      email: 'se23uari003@mahindrauniversity.edu.in',
      password: hash,
      role: 'student',
      rollNumber: 'se23uari003',
      branch: 'Computer Science & Engineering',
      year: 2,
      cgpa: 8.4,
      headline: 'CSE sophomore | ML & Web Dev enthusiast',
      bio: 'Second-year CSE student at Mahindra University. Interested in machine learning, full-stack development, and open-source contributions.',
      skills: ['Python', 'React', 'Node.js', 'Machine Learning', 'SQL'],
      interests: ['AI/ML', 'Web Development', 'Open Source'],
      linkedinUrl: 'https://linkedin.com/in/aditya-goyal',
      githubUrl: 'https://github.com/aditya-goyal',
    });
    console.log('Created student: Aditya Goyal');
  } else {
    console.log('Found existing student: Aditya Goyal');
  }

  // 2. Find the first open/active project that Aditya hasn't already applied to
  const projects = await Project.find({ status: { $in: ['open', 'active'] } }).populate('professor', 'name email');
  if (!projects.length) {
    console.error('No open projects found — run seedDemo.js first');
    process.exit(1);
  }

  // Pick project where Aditya isn't already an applicant
  let target = projects.find(p =>
    !p.applications.some(a => a.student?.toString() === aditya._id.toString())
  );
  if (!target) target = projects[0]; // fallback: reuse first project

  // 3. Check if application already exists and is accepted
  const existingApp = target.applications.find(a => a.student?.toString() === aditya._id.toString());
  if (existingApp) {
    if (existingApp.status !== 'accepted') {
      existingApp.status = 'accepted';
      existingApp.remarks = 'Strong profile — selected for the project.';
      await target.save();
      console.log(`Updated Aditya's application to ACCEPTED on: "${target.title}"`);
    } else {
      console.log(`Aditya already has an accepted application on: "${target.title}"`);
    }
  } else {
    target.applications.push({
      student: aditya._id,
      pitch: 'I am deeply interested in this research area and have completed relevant coursework in machine learning and data structures. I believe this project aligns perfectly with my academic goals and I am committed to contributing meaningfully.',
      status: 'accepted',
      remarks: 'Strong profile — selected for the project.',
    });
    if (!target.contributors.includes(aditya._id)) {
      target.contributors.push(aditya._id);
    }
    await target.save();
    console.log(`Added Aditya as ACCEPTED applicant on: "${target.title}"`);
  }

  console.log(`\nFaculty: ${target.professor?.name} (${target.professor?.email})`);
  console.log(`Project: "${target.title}"`);
  console.log('\nCredentials:');
  console.log('  Student — se23uari003@mahindrauniversity.edu.in / student123');
  console.log(`  Faculty — ${target.professor?.email} / faculty123`);
  console.log('\nTo test messaging:');
  console.log('  1. Log in as Aditya → Browse Projects → find the project above → "Message professor"');
  console.log(`  2. Log in as ${target.professor?.name} → My Projects → expand applicants → "Chat"`);

  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
