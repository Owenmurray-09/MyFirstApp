import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for full access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { jobId } = await req.json()

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'jobId is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the job details
    const { data: job, error: jobError } = await supabaseClient
      .from('jobs')
      .select(`
        *,
        companies (
          name,
          location
        )
      `)
      .eq('id', jobId)
      .single()

    if (jobError) {
      console.error('Error fetching job:', jobError)
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Find students with matching interests who want immediate notifications
    const { data: students, error: studentsError } = await supabaseClient
      .from('profiles')
      .select(`
        id,
        name,
        interests,
        daily_digest_enabled
      `)
      .eq('role', 'student')
      .eq('daily_digest_enabled', false) // Only immediate notifications for now

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return new Response(
        JSON.stringify({ error: 'Error finding students' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Match students based on job tags and their interests
    const matchedStudents = students?.filter(student => {
      if (!student.interests || student.interests.length === 0) return false
      if (!job.tags || job.tags.length === 0) return false

      // Check if any of the student's interests match job tags (case-insensitive)
      const studentInterests = student.interests.map((interest: string) => interest.toLowerCase())
      const jobTags = job.tags.map((tag: string) => tag.toLowerCase())
      
      return studentInterests.some((interest: string) => 
        jobTags.some((tag: string) => 
          tag.includes(interest) || interest.includes(tag)
        )
      )
    }) || []

    console.log(`Found ${matchedStudents.length} matched students for job: ${job.title}`)

    // TODO: Phase 2 - Send Expo Push Notifications
    // For each matched student:
    // 1. Get their push notification token from profiles.push_token
    // 2. Send push notification using Expo Push API
    // 3. Notification payload:
    //    - title: "New Job Match!"
    //    - body: `${job.title} at ${job.companies?.name || 'Company'} matches your interests`
    //    - data: { jobId, type: 'job_match' }
    // 4. Log notification results for analytics

    // For now, we'll just log the matches
    for (const student of matchedStudents) {
      console.log(`Would notify student: ${student.name} about job: ${job.title}`)
      
      // TODO: Phase 2 - Replace this console.log with actual push notification
      // await sendExpoPushNotification({
      //   to: student.push_token,
      //   title: 'New Job Match!',
      //   body: `${job.title} at ${job.companies?.name || 'Company'} matches your interests`,
      //   data: { jobId, type: 'job_match' }
      // })
    }

    // Store notification logs for analytics (optional)
    if (matchedStudents.length > 0) {
      const notificationLogs = matchedStudents.map(student => ({
        student_id: student.id,
        job_id: jobId,
        notification_type: 'job_match',
        sent_at: new Date().toISOString(),
        delivery_method: 'push', // Will be 'push' in Phase 2
        status: 'pending' // Will be 'sent'/'failed' in Phase 2
      }))

      // TODO: Create notification_logs table for tracking
      // const { error: logError } = await supabaseClient
      //   .from('notification_logs')
      //   .insert(notificationLogs)
      
      // if (logError) {
      //   console.error('Error logging notifications:', logError)
      // }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        matchedStudents: matchedStudents.length,
        jobTitle: job.title,
        companyName: job.companies?.name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('Error in new-job-notify function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})