import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');

  // 1. Clear database
  console.log('Clearing existing data...');
  await prisma.bookmark.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create passwords
  console.log('Hashing passwords...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 3. Create Users
  console.log('Creating demo users...');
  
  // Create Seeker
  const seeker = await prisma.user.create({
    data: {
      email: 'seeker@example.com',
      passwordHash,
      role: 'JOB_SEEKER',
      name: 'Jane Doe',
    },
  });

  await prisma.profile.create({
    data: {
      userId: seeker.id,
      title: 'Full Stack Engineer',
      bio: 'Passionate web developer with 3+ years of experience building responsive, user-friendly web applications. Specializes in React, Node.js, and modern CSS.',
      skills: 'React, Node.js, Express, JavaScript, PostgreSQL, CSS, Tailwind CSS, Git',
      resumeUrl: '/uploads/dummy-resume.pdf',
    },
  });

  // Create Employer 1
  const employer1 = await prisma.user.create({
    data: {
      email: 'employer@example.com',
      passwordHash,
      role: 'EMPLOYER',
      name: 'John Smith',
    },
  });

  await prisma.profile.create({
    data: {
      userId: employer1.id,
      companyName: 'TechVibe Solutions',
      companyWebsite: 'https://techvibe.example.com',
      bio: 'Leading digital transformation agency creating web products that scale. Building next-generation developer tooling.',
      companyLogo: '⚡',
    },
  });

  // Create Employer 2
  const employer2 = await prisma.user.create({
    data: {
      email: 'employer2@example.com',
      passwordHash,
      role: 'EMPLOYER',
      name: 'Alice Johnson',
    },
  });

  await prisma.profile.create({
    data: {
      userId: employer2.id,
      companyName: 'Apex Data Labs',
      companyWebsite: 'https://apexdata.example.com',
      bio: 'Pioneers in artificial intelligence and big data analytics. Helping global enterprises unlock insights.',
      companyLogo: '📊',
    },
  });

  // 4. Create Jobs
  console.log('Creating dummy job listings...');

  const jobsData = [
    // Software Engineering
    {
      employerId: employer1.id,
      title: 'Senior Frontend Engineer (React)',
      companyName: 'TechVibe Solutions',
      companyLogo: '⚡',
      location: 'San Francisco, CA',
      jobType: 'FULL_TIME',
      experienceLevel: 'SENIOR',
      salaryMin: 130000,
      salaryMax: 175000,
      description: 'We are seeking an experienced Frontend Developer to lead the development of our dashboard and workspace tools. You will be building smooth interfaces, managing application state, and mentoring junior engineers. If you are obsessed with clean code and micro-interactions, we want you!',
      requirements: '5+ years of software engineering experience.\nProficiency with React, Redux, and TypeScript.\nStrong knowledge of CSS layout systems (Flexbox, Grid, Tailwind CSS).\nExperience with performance optimization of client-side web apps.',
      responsibilities: 'Lead development of core user-facing features.\nCollaborate closely with product managers and designers to translate mockups into working features.\nMentor and guide 3 junior frontend developers.\nEnsure high code quality through code reviews and automated tests.',
    },
    {
      employerId: employer1.id,
      title: 'Junior React Developer',
      companyName: 'TechVibe Solutions',
      companyLogo: '⚡',
      location: 'Remote',
      jobType: 'REMOTE',
      experienceLevel: 'ENTRY',
      salaryMin: 65000,
      salaryMax: 85000,
      description: 'TechVibe is looking for a self-motivated Junior React Developer to join our growing engineering team. This is an excellent role for someone starting their career, offering mentorship from senior engineers and hands-on experience with cutting-edge tech.',
      requirements: '1+ years of experience with React (including personal projects).\nStrong knowledge of JavaScript (ES6+), HTML5, and CSS3.\nFamiliarity with git and GitHub workflow.\nEagerness to learn and take constructive feedback.',
      responsibilities: 'Write clean, maintainable JSX and CSS.\nFix UI bugs and implement minor feature improvements.\nParticipate in daily standup and sprint planning meetings.\nWrite basic unit tests for React components.',
    },
    {
      employerId: employer2.id,
      title: 'Full Stack Engineer (Node/Postgres)',
      companyName: 'Apex Data Labs',
      companyLogo: '📊',
      location: 'New York, NY',
      jobType: 'FULL_TIME',
      experienceLevel: 'MID',
      salaryMin: 100000,
      salaryMax: 130000,
      description: 'Join Apex Data Labs as a Full Stack Engineer! You will work across our stack, from designing robust database schemas to implementing APIs in Node.js and building dashboards in React. Help us deliver low-latency analytics tools to our clients.',
      requirements: '3+ years of experience building Node.js REST APIs.\nPrisma experience or relational database skills (PostgreSQL).\nExperience with React and state management.\nFamiliarity with containerized applications (Docker).',
      responsibilities: 'Design database tables, indexes, and queries.\nBuild secure, efficient, and well-documented Express endpoints.\nIntegrate backend APIs with the React frontend dashboard.\nMonitor backend system performance and resolve bottlenecks.',
    },
    {
      employerId: employer2.id,
      title: 'AI/ML Engineering Intern',
      companyName: 'Apex Data Labs',
      companyLogo: '📊',
      location: 'Boston, MA',
      jobType: 'INTERNSHIP',
      experienceLevel: 'ENTRY',
      salaryMin: 45000,
      salaryMax: 60000,
      description: 'Apex Data Labs offers a dynamic AI/ML internship for computer science students or recent grads. You will assist in building, evaluating, and fine-tuning predictive models using Python, TensorFlow, and PyTorch.',
      requirements: 'Pursuing or recently completed BS/MS in Computer Science, Math, or Data Science.\nStrong programming skills in Python.\nBasic understanding of machine learning algorithms.\nFamiliarity with NumPy, Pandas, and Scikit-Learn.',
      responsibilities: 'Clean, preprocess, and analyze large datasets for model ingestion.\nTrain and run evaluation metrics on machine learning pipelines.\nDocument experiment results and present findings to the data science team.\nCollaborate on model deployment workflows.',
    },
    {
      employerId: employer2.id,
      title: 'Senior Data Scientist',
      companyName: 'Apex Data Labs',
      companyLogo: '📊',
      location: 'Remote',
      jobType: 'REMOTE',
      experienceLevel: 'SENIOR',
      salaryMin: 150000,
      salaryMax: 200000,
      description: 'We are hiring a Senior Data Scientist to spearhead our predictive analytics and recommendation engines. You will lead research, develop production-grade models, and define the technical vision for our AI features.',
      requirements: '5+ years of industry experience as a Data Scientist or ML Engineer.\nMS/PhD in Quantitative Field (CS, Stats, physics, etc.).\nExpertise with PyTorch, Scikit-Learn, and Python.\nExperience deploying machine learning models in cloud environments (AWS, GCP).',
      responsibilities: 'Formulate predictive algorithms and optimization models.\nPartner with engineers to integrate model outputs into the customer dashboard.\nDefine KPIs to monitor model performance in production.\nAdvise executives on technological breakthroughs and opportunities.',
    },
    // Design
    {
      employerId: employer1.id,
      title: 'UI/UX Product Designer',
      companyName: 'TechVibe Solutions',
      companyLogo: '⚡',
      location: 'Austin, TX',
      jobType: 'FULL_TIME',
      experienceLevel: 'MID',
      salaryMin: 95000,
      salaryMax: 125000,
      description: 'TechVibe is seeking a UI/UX Product Designer to shape the identity of our products. You will turn complex developer workflows into simple, beautiful, and intuitive interfaces. A strong portfolio demonstrating design systems and prototyping is required.',
      requirements: '3+ years of experience as a product designer or UX researcher.\nExpertise in Figma, including design systems, auto-layout, and interactive prototypes.\nDeep understanding of visual hierarchy, typography, grids, and accessibility standards.\nBasic understanding of HTML/CSS is a big plus.',
      responsibilities: 'Conduct user research and translate insights into wireframes and mockups.\nDevelop and maintain our shared Figma design library.\nDesign interactive prototypes to communicate animations and flows.\nWork closely with frontend engineers to ensure design-accurate implementations.',
    },
    {
      employerId: employer1.id,
      title: 'Graphic & Brand Designer',
      companyName: 'TechVibe Solutions',
      companyLogo: '⚡',
      location: 'Remote',
      jobType: 'PART_TIME',
      experienceLevel: 'MID',
      salaryMin: 40000,
      salaryMax: 60000,
      description: 'We are seeking a creative Graphic & Brand Designer to support our marketing initiatives. This is a part-time role (20 hours per week) focused on creating landing page assets, social media graphics, and digital marketing materials.',
      requirements: '2+ years of graphic design experience.\nExpertise in Adobe Creative Suite (Illustrator, Photoshop) and Figma.\nStrong visual storytelling and layout skills.\nAbility to manage multiple deliverables on a deadline.',
      responsibilities: 'Design marketing banner graphics, social graphics, and newsletter assets.\nMaintain cohesive visual brand guidelines across all external channels.\nCollaborate on visual refreshes of the company landing pages.\nExport assets optimized for web performance.',
    },
    // Product Management
    {
      employerId: employer2.id,
      title: 'Lead Product Manager (B2B SaaS)',
      companyName: 'Apex Data Labs',
      companyLogo: '📊',
      location: 'New York, NY',
      jobType: 'FULL_TIME',
      experienceLevel: 'SENIOR',
      salaryMin: 140000,
      salaryMax: 185000,
      description: 'Apex Data Labs is looking for a Lead Product Manager to own our B2B SaaS platform. You will drive product strategy, define features, align cross-functional teams, and own the roadmap from conception to launch.',
      requirements: '6+ years of experience as a Product Manager in SaaS or B2B tech.\nProven track record of launching successful data-heavy software features.\nStrong analytical mindset with ability to draw insights from user data.\nExcellent written and verbal communication.',
      responsibilities: 'Translate company vision into an actionable product roadmap.\nWrite detailed product requirements docs (PRDs) and define user stories.\nPartner with engineering leads and designers to schedule sprints and coordinate launches.\nCoordinate with customer success and sales to gather continuous customer feedback.',
    },
    {
      employerId: employer1.id,
      title: 'Product Owner',
      companyName: 'TechVibe Solutions',
      companyLogo: '⚡',
      location: 'Remote',
      jobType: 'FULL_TIME',
      experienceLevel: 'MID',
      salaryMin: 90000,
      salaryMax: 120000,
      description: 'We are hiring a Product Owner to manage the backlog, facilitate agile rituals, and serve as the main liaison between customer success and our software engineering teams.',
      requirements: '3+ years of experience in product owner, business analyst, or project manager roles.\nIn-depth knowledge of Agile/Scrum methodologies.\nExperience with Jira, linear, or similar project tools.\nTechnical background or familiarity with web apps.',
      responsibilities: 'Manage and prioritize the engineering backlog.\nLead sprint planning, grooming, and retro sessions.\nWrite clear acceptance criteria for all feature tickets.\nValidate completed developer tasks against acceptance criteria.',
    },
    // Marketing & Content
    {
      employerId: employer1.id,
      title: 'Content Marketing Manager',
      companyName: 'TechVibe Solutions',
      companyLogo: '⚡',
      location: 'Remote',
      jobType: 'FULL_TIME',
      experienceLevel: 'MID',
      salaryMin: 80000,
      salaryMax: 110000,
      description: 'TechVibe is searching for a Content Marketing Manager to lead our organic growth strategy. You will produce high-quality articles, technical documentation summaries, and coordinate our developer relations blog.',
      requirements: '3+ years of experience in content marketing, copy writing, or tech blogging.\nStrong writing skills with ability to simplify complex technical topics.\nBasic understanding of SEO principles.\nExperience with email marketing tools (Mailchimp, ConvertKit).',
      responsibilities: 'Write 2 blog posts and 1 technical newsletter per week.\nManage calendar for content production and distribution.\nOptimize existing blog articles for organic search rankings.\nReport on blog traffic and conversion metrics.',
    },
    {
      employerId: employer2.id,
      title: 'Digital Marketing Intern',
      companyName: 'Apex Data Labs',
      companyLogo: '📊',
      location: 'Remote',
      jobType: 'INTERNSHIP',
      experienceLevel: 'ENTRY',
      salaryMin: 35000,
      salaryMax: 50000,
      description: 'Learn the ins and outs of B2B digital marketing with Apex Data Labs. This internship offers hands-on experience running Google Ads, managing LinkedIn outreach, and tracking customer journeys.',
      requirements: 'Currently enrolled in or recently graduated with a Marketing or Business degree.\nFamiliarity with Google Analytics and social media platforms.\nExcellent proofreading and copywriting skills.\nBasic experience with design tools like Figma or Canva.',
      responsibilities: 'Monitor and coordinate LinkedIn posts and engagements.\nConduct competitor ad research and suggest copywriting tests.\nHelp analyze weekly Google Analytics performance.\nCompile monthly marketing performance decks.',
    },
    // Sales & Support
    {
      employerId: employer2.id,
      title: 'Account Executive (SaaS)',
      companyName: 'Apex Data Labs',
      companyLogo: '📊',
      location: 'Denver, CO',
      jobType: 'FULL_TIME',
      experienceLevel: 'MID',
      salaryMin: 85000,
      salaryMax: 130000,
      description: 'Apex Data Labs is looking for a driven Account Executive to acquire new enterprise clients. You will manage the entire sales pipeline from discovery calls to close, demoing our data tools to business leaders.',
      requirements: '3+ years of B2B software sales experience.\nProven record of meeting or exceeding sales quotas.\nStrong relationship-building skills and consultative sales approach.\nExperience using Salesforce or HubSpot.',
      responsibilities: 'Manage outbound prospecting and respond to inbound sales leads.\nConduct product demos highlighting Apex Analytics values.\nNegotiate enterprise contracts and close sales targets.\nCoordinate handoff of won accounts to customer success.',
    },
    {
      employerId: employer1.id,
      title: 'Technical Support Specialist',
      companyName: 'TechVibe Solutions',
      companyLogo: '⚡',
      location: 'Remote',
      jobType: 'FULL_TIME',
      experienceLevel: 'MID',
      salaryMin: 70000,
      salaryMax: 90000,
      description: 'TechVibe is hiring a Technical Support Specialist to support developers using our tools. You will troubleshoot API integrations, investigate dashboard bugs, and escalate server issues to engineering.',
      requirements: '2+ years of experience in technical support, customer engineering, or IT.\nBasic reading capability of JavaScript and API logs.\nStrong empathy and problem-solving skills.\nExperience using helpdesk systems like Zendesk or Intercom.',
      responsibilities: 'Answer customer tickets in a helpful, timely manner.\nDebug customer API requests and identify root causes.\nWrite clear bug reports for the engineering team.\nUpdate the customer knowledge base and help articles.',
    },
    {
      employerId: employer1.id,
      title: 'Customer Success Manager',
      companyName: 'TechVibe Solutions',
      companyLogo: '⚡',
      location: 'Chicago, IL',
      jobType: 'FULL_TIME',
      experienceLevel: 'MID',
      salaryMin: 80000,
      salaryMax: 110000,
      description: 'We are hiring a Customer Success Manager to manage onboarding, renewals, and expansion opportunities for our mid-market clients, ensuring they realize full value from the TechVibe workspace.',
      requirements: '3+ years of experience in CSM, Account Management, or Consulting.\nPassion for customer satisfaction and product adoption.\nStrong communication, presentation, and project management skills.\nFamiliarity with tech client business cycles.',
      responsibilities: 'Own post-sale customer relationship, driving software adoption.\nLead custom onboarding sessions for client software engineering teams.\nIdentify churn risks and implement account mitigation plans.\nTrack and report client health metrics.',
    },
    {
      employerId: employer2.id,
      title: 'Sales Operations Coordinator',
      companyName: 'Apex Data Labs',
      companyLogo: '📊',
      location: 'Remote',
      jobType: 'PART_TIME',
      experienceLevel: 'ENTRY',
      salaryMin: 30000,
      salaryMax: 45000,
      description: 'Apex Data Labs is seeking a part-time Sales Operations Coordinator (20h/week) to maintain database hygiene in HubSpot, generate pipeline reports, and coordinate sales materials.',
      requirements: '1+ years of administration or database entry experience.\nHigh attention to detail and accuracy.\nExperience with HubSpot, Excel, or Google Sheets.\nStrong organizational skills.',
      responsibilities: 'Audit and clean sales lead entries in HubSpot CRM.\nPrepare weekly pipeline summaries for the VP of Sales.\nHelp coordinate presentation slides and contract templates.\nRespond to routing questions from sales reps.',
    }
  ];

  for (const job of jobsData) {
    await prisma.job.create({
      data: job,
    });
  }

  // 5. Create some sample applications and bookmarks
  console.log('Adding some initial applications and bookmarks...');
  const allJobs = await prisma.job.findMany({});
  
  // Jane Doe (seeker) applies to first job
  await prisma.application.create({
    data: {
      jobId: allJobs[0].id,
      seekerId: seeker.id,
      name: seeker.name,
      email: seeker.email,
      resumeUrl: '/uploads/dummy-resume.pdf',
      coverLetter: 'I am highly interested in the Senior Frontend Engineer role. My experience building with React and Tailwind matches your requirements perfectly. I look forward to hearing from you!',
      status: 'SHORTLISTED',
    },
  });

  // Jane Doe applies to third job
  await prisma.application.create({
    data: {
      jobId: allJobs[2].id,
      seekerId: seeker.id,
      name: seeker.name,
      email: seeker.email,
      resumeUrl: '/uploads/dummy-resume.pdf',
      coverLetter: 'Hello! I am a full-stack engineer and I have worked with Node.js and Postgres database for over 3 years. Apex Data Labs seems like an incredible place to work.',
      status: 'APPLIED',
    },
  });

  // Jane Doe bookmarks second and fifth job
  await prisma.bookmark.create({
    data: {
      userId: seeker.id,
      jobId: allJobs[1].id,
    },
  });

  await prisma.bookmark.create({
    data: {
      userId: seeker.id,
      jobId: allJobs[4].id,
    },
  });

  // Add random view numbers to make analytics page look realistic
  console.log('Populating job views for realistic analytics...');
  for (let i = 0; i < allJobs.length; i++) {
    const views = Math.floor(Math.random() * 80) + 15; // 15 to 95 views
    await prisma.job.update({
      where: { id: allJobs[i].id },
      data: { views },
    });
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
