#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- EXPO_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Demo user IDs (these would normally be created by Supabase Auth)
const DEMO_EMPLOYER_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_STUDENT_1_ID = '00000000-0000-0000-0000-000000000002';
const DEMO_STUDENT_2_ID = '00000000-0000-0000-0000-000000000003';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Clean up existing demo data
    console.log('🧹 Cleaning up existing demo data...');
    await cleanupDemoData();

    // 2. Create demo profiles
    console.log('👥 Creating demo user profiles...');
    await createDemoProfiles();

    // 3. Create demo company
    console.log('🏢 Creating demo company...');
    const company = await createDemoCompany();

    // 4. Create demo jobs
    console.log('💼 Creating demo jobs...');
    const jobs = await createDemoJobs(company.id);

    // 5. Create job comments
    console.log('💬 Adding job comments...');
    await createJobComments(jobs);

    // 6. Create applications
    console.log('📝 Creating job applications...');
    const applications = await createApplications(jobs);

    // 7. Create threads and messages
    console.log('💌 Creating message threads...');
    await createThreadsAndMessages(applications);

    // 8. Create student preferences
    console.log('⚙️ Setting student preferences...');
    await createStudentPreferences();

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Demo data summary:');
    console.log(`- 1 Demo company with ${jobs.length} jobs`);
    console.log(`- 2 Demo students with different preferences`);
    console.log(`- ${applications.length} Job applications`);
    console.log(`- Comments on all jobs`);
    console.log(`- Sample message threads`);
    console.log('\n🎉 Your app is ready for demos and testing!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

async function cleanupDemoData() {
  const demoUserIds = [DEMO_EMPLOYER_ID, DEMO_STUDENT_1_ID, DEMO_STUDENT_2_ID];
  
  // Delete in reverse dependency order
  await supabase.from('messages').delete().in('sender_user_id', demoUserIds);
  await supabase.from('threads').delete().in('employer_user_id', demoUserIds);
  await supabase.from('threads').delete().in('student_user_id', demoUserIds);
  await supabase.from('comments').delete().in('author_user_id', demoUserIds);
  await supabase.from('applications').delete().in('student_user_id', demoUserIds);
  await supabase.from('student_preferences').delete().in('student_user_id', demoUserIds);
  await supabase.from('jobs').delete().in('company_id', 
    (await supabase.from('companies').select('id').in('owner_user_id', demoUserIds)).data?.map(c => c.id) || []
  );
  await supabase.from('companies').delete().in('owner_user_id', demoUserIds);
  await supabase.from('profiles').delete().in('id', demoUserIds);
}

async function createDemoProfiles() {
  const profiles = [
    {
      id: DEMO_EMPLOYER_ID,
      role: 'employer',
      name: 'Sarah Chen',
      bio: 'Hiring Manager at TechStart Inc. Always looking for talented students to join our team!',
      location: 'San Francisco, CA',
      interests: [],
      daily_digest_enabled: false,
    },
    {
      id: DEMO_STUDENT_1_ID,
      role: 'student',
      name: 'Alex Rodriguez',
      bio: 'Computer Science major with a passion for web development and design. Looking for internship opportunities!',
      location: 'Berkeley, CA',
      interests: ['customer service', 'basic coding', 'graphic design', 'front desk'],
      daily_digest_enabled: false,
    },
    {
      id: DEMO_STUDENT_2_ID,
      role: 'student',
      name: 'Maya Patel',
      bio: 'Business student interested in retail operations and customer experience. Love working with people!',
      location: 'Oakland, CA',
      interests: ['retail', 'customer service', 'inventory', 'cash register'],
      daily_digest_enabled: true,
    },
  ];

  const { error } = await supabase.from('profiles').insert(profiles);
  if (error) throw error;
}

async function createDemoCompany() {
  const companyData = {
    owner_user_id: DEMO_EMPLOYER_ID,
    name: 'TechStart Inc.',
    description: 'A fast-growing tech startup focused on building innovative solutions for local businesses. We value creativity, collaboration, and continuous learning.',
    location: 'San Francisco, CA',
  };

  const { data, error } = await supabase
    .from('companies')
    .insert(companyData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function createDemoJobs(companyId: string) {
  const jobs = [
    {
      company_id: companyId,
      title: 'Frontend Development Intern',
      description: 'Join our development team to build beautiful user interfaces using React and TypeScript. Perfect for CS students looking to gain real-world experience!\n\n• Work on our main web application\n• Learn modern development practices\n• Collaborate with senior developers\n• Flexible schedule around classes',
      tags: ['basic coding', 'graphic design', 'customer service'],
      is_paid: true,
      stipend_amount: 18.00,
      location: 'San Francisco, CA (Hybrid)',
      status: 'open',
    },
    {
      company_id: companyId,
      title: 'Customer Support Representative',
      description: 'Help our customers succeed by providing excellent support via chat, email, and phone. Great opportunity to develop communication skills!\n\n• Respond to customer inquiries\n• Help troubleshoot technical issues\n• Document feedback for product team\n• Part-time, flexible hours',
      tags: ['customer service', 'front desk'],
      is_paid: true,
      stipend_amount: 16.50,
      location: 'San Francisco, CA (Remote)',
      status: 'open',
    },
    {
      company_id: companyId,
      title: 'Marketing Assistant (Unpaid Internship)',
      description: 'Gain hands-on marketing experience while building your portfolio. Learn about digital marketing, content creation, and brand management.\n\n• Create social media content\n• Assist with marketing campaigns\n• Analyze marketing metrics\n• Great for business/marketing students',
      tags: ['graphic design', 'customer service'],
      is_paid: false,
      stipend_amount: null,
      location: 'San Francisco, CA',
      status: 'open',
    },
    {
      company_id: companyId,
      title: 'Office Administrative Assistant',
      description: 'Support our growing team with various administrative tasks. Perfect for students who enjoy organizing and helping teams run smoothly.\n\n• Manage office supplies and inventory\n• Greet visitors and handle front desk\n• Assist with scheduling and coordination\n• Data entry and filing',
      tags: ['front desk', 'inventory', 'customer service'],
      is_paid: true,
      stipend_amount: 15.00,
      location: 'San Francisco, CA',
      status: 'open',
    },
    {
      company_id: companyId,
      title: 'Retail Sales Associate - Pop-up Store',
      description: 'Help us run our weekend pop-up store at local markets! Great way to gain retail experience and learn about our products.\n\n• Process transactions using POS system\n• Help customers find products\n• Maintain store appearance\n• Weekend shifts available',
      tags: ['retail', 'cash register', 'customer service'],
      is_paid: true,
      stipend_amount: 17.00,
      location: 'Various Bay Area Locations',
      status: 'open',
    },
    {
      company_id: companyId,
      title: 'Data Entry Specialist',
      description: 'Help us organize and digitize important business data. Attention to detail required, but training provided!\n\n• Enter data from various sources\n• Verify accuracy of information\n• Maintain organized filing systems\n• Flexible remote work options',
      tags: ['basic coding', 'inventory'],
      is_paid: true,
      stipend_amount: 14.50,
      location: 'Remote',
      status: 'open',
    },
    {
      company_id: companyId,
      title: 'Coffee Shop Barista (Partner Location)',
      description: 'Work at our partner café location while representing our brand. Learn customer service skills in a fast-paced environment!\n\n• Prepare coffee and light food items\n• Handle cash register and payments\n• Maintain clean workspace\n• Early morning shifts available',
      tags: ['cash register', 'customer service', 'front desk'],
      is_paid: true,
      stipend_amount: 16.00,
      location: 'Downtown San Francisco',
      status: 'open',
    },
    {
      company_id: companyId,
      title: 'Event Setup Assistant (Seasonal)',
      description: 'Help us set up and tear down events, trade shows, and company gatherings. Physical work but great team environment!\n\n• Set up tables, chairs, and displays\n• Assist with inventory tracking\n• Help with event logistics\n• Weekend and evening availability preferred',
      tags: ['heavy lifting', 'inventory', 'customer service'],
      is_paid: true,
      stipend_amount: 15.50,
      location: 'Bay Area (Various Venues)',
      status: 'open',
    },
  ];

  const { data, error } = await supabase
    .from('jobs')
    .insert(jobs)
    .select();

  if (error) throw error;
  return data;
}

async function createJobComments(jobs: any[]) {
  const comments = [];
  
  // Add 1-2 comments per job
  for (const job of jobs) {
    // First comment for each job
    comments.push({
      job_id: job.id,
      author_user_id: DEMO_STUDENT_1_ID,
      body: job.title.includes('Frontend') 
        ? "This sounds like an amazing opportunity! I'm a CS student with React experience and would love to contribute to your team."
        : job.title.includes('Customer Support')
        ? "I have great communication skills and genuinely enjoy helping people solve problems. When can I apply?"
        : job.title.includes('Marketing')
        ? "As a business major, this internship looks perfect for building my portfolio. Do you provide mentorship?"
        : job.title.includes('Retail')
        ? "I have weekend availability and retail experience from my previous job. The location works great for me!"
        : "This position aligns perfectly with my career goals. Looking forward to learning more about the role!"
    });

    // Second comment for some jobs
    if (Math.random() > 0.4) {
      comments.push({
        job_id: job.id,
        author_user_id: DEMO_STUDENT_2_ID,
        body: job.title.includes('Administrative')
          ? "I'm very organized and detail-oriented. Is there opportunity for growth within the company?"
          : job.title.includes('Data Entry')
          ? "I have strong attention to detail and am comfortable working remotely. What software do you use?"
          : job.title.includes('Barista')
          ? "I love coffee culture and have morning availability! Do you provide training for new baristas?"
          : "Great opportunity! What's the typical schedule like for this position?"
      });
    }
  }

  const { error } = await supabase.from('comments').insert(comments);
  if (error) throw error;
}

async function createApplications(jobs: any[]) {
  const applications = [];
  
  // Student 1 applies to 3-4 jobs
  const student1Jobs = jobs.slice(0, 4);
  for (const job of student1Jobs) {
    applications.push({
      job_id: job.id,
      student_user_id: DEMO_STUDENT_1_ID,
      note: job.title.includes('Frontend')
        ? "I've built several React projects and am excited to contribute to a real product. Check out my GitHub for examples of my work!"
        : job.title.includes('Customer Support')
        ? "I have 2 years of retail experience and love helping customers. Available for part-time remote work around my class schedule."
        : "I'm a quick learner and very motivated to gain experience in this field. Available to start immediately!"
    });
  }

  // Student 2 applies to 2-3 different jobs
  const student2Jobs = jobs.slice(3, 6);
  for (const job of student2Jobs) {
    applications.push({
      job_id: job.id,
      student_user_id: DEMO_STUDENT_2_ID,
      note: job.title.includes('Retail')
        ? "I have cash register experience and love the retail environment. Weekends work perfectly with my school schedule!"
        : job.title.includes('Administrative')
        ? "Very organized and experienced with office software. Looking for consistent part-time hours that complement my studies."
        : "This role matches my interests and career goals perfectly. I'm committed and eager to learn!"
    });
  }

  const { data, error } = await supabase
    .from('applications')
    .insert(applications)
    .select();

  if (error) throw error;
  return data;
}

async function createThreadsAndMessages(applications: any[]) {
  const threads = [];
  const messages = [];

  // Create threads for some applications
  const threadApplications = applications.slice(0, 3);
  
  for (const app of threadApplications) {
    // Create thread
    const thread = {
      job_id: app.job_id,
      employer_user_id: DEMO_EMPLOYER_ID,
      student_user_id: app.student_user_id,
      application_id: app.id,
      last_message_at: new Date().toISOString(),
    };
    
    const { data: threadData, error: threadError } = await supabase
      .from('threads')
      .insert(thread)
      .select()
      .single();
    
    if (threadError) throw threadError;

    // Create initial messages
    const threadMessages = [
      {
        thread_id: threadData.id,
        sender_user_id: DEMO_EMPLOYER_ID,
        content: `Hi ${app.student_user_id === DEMO_STUDENT_1_ID ? 'Alex' : 'Maya'}! Thanks for applying to our position. Your background looks great! When would be a good time to chat about the role?`,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        thread_id: threadData.id,
        sender_user_id: app.student_user_id,
        content: app.student_user_id === DEMO_STUDENT_1_ID 
          ? "Hi Sarah! Thank you for reaching out. I'm available for a call this week after 3pm on weekdays, or anytime on weekends. Looking forward to discussing the opportunity!"
          : "Hello! I'm so excited about this opportunity. I have classes until 2pm most days, but I'm flexible in the evenings. Would a phone or video call work better?",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
      {
        thread_id: threadData.id,
        sender_user_id: DEMO_EMPLOYER_ID,
        content: "Perfect! Let's schedule a brief video call for tomorrow at 4pm. I'll send you the Zoom link. We can discuss the role in more detail and answer any questions you have.",
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      }
    ];

    messages.push(...threadMessages);
  }

  // Insert all messages
  if (messages.length > 0) {
    const { error } = await supabase.from('messages').insert(messages);
    if (error) throw error;
  }
}

async function createStudentPreferences() {
  const preferences = [
    {
      student_user_id: DEMO_STUDENT_1_ID,
      interest_tags: ['customer service', 'basic coding', 'graphic design', 'front desk'],
      preferred_locations: ['San Francisco', 'Berkeley', 'Remote'],
      min_hourly_rate: 15.00,
      max_hours_per_week: 20,
    },
    {
      student_user_id: DEMO_STUDENT_2_ID,
      interest_tags: ['retail', 'customer service', 'inventory', 'cash register'],
      preferred_locations: ['Oakland', 'San Francisco', 'Bay Area'],
      min_hourly_rate: 16.00,
      max_hours_per_week: 25,
    },
  ];

  const { error } = await supabase.from('student_preferences').insert(preferences);
  if (error) throw error;
}

// Run the seeding
if (require.main === module) {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}