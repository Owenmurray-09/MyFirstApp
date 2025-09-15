// Generated types placeholder - replace with actual Supabase generated types
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > types/db.ts

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'student' | 'employer';
          name: string | null;
          bio: string | null;
          interests: string[];
          location: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role: 'student' | 'employer';
          name?: string | null;
          bio?: string | null;
          interests?: string[];
          location?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: 'student' | 'employer';
          name?: string | null;
          bio?: string | null;
          interests?: string[];
          location?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          description: string | null;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          description?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          name?: string;
          description?: string | null;
          location?: string | null;
          created_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          description: string | null;
          tags: string[];
          is_paid: boolean;
          stipend_amount: number | null;
          location: string | null;
          images: string[];
          status: 'open' | 'closed';
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title: string;
          description?: string | null;
          tags?: string[];
          is_paid?: boolean;
          stipend_amount?: number | null;
          location?: string | null;
          images?: string[];
          status?: 'open' | 'closed';
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          title?: string;
          description?: string | null;
          tags?: string[];
          is_paid?: boolean;
          stipend_amount?: number | null;
          location?: string | null;
          images?: string[];
          status?: 'open' | 'closed';
          created_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          job_id: string;
          student_user_id: string;
          note: string | null;
          status: 'submitted' | 'accepted' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          student_user_id: string;
          note?: string | null;
          status?: 'submitted' | 'accepted' | 'rejected';
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          student_user_id?: string;
          note?: string | null;
          status?: 'submitted' | 'accepted' | 'rejected';
          created_at?: string;
        };
      };
      threads: {
        Row: {
          id: string;
          job_id: string;
          employer_user_id: string;
          student_user_id: string;
          last_message_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          employer_user_id: string;
          student_user_id: string;
          last_message_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          employer_user_id?: string;
          student_user_id?: string;
          last_message_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_user_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_user_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          sender_user_id?: string;
          body?: string;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          job_id: string;
          author_user_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          author_user_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          author_user_id?: string;
          body?: string;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          job_id: string | null;
          organizer_user_id: string;
          participant_user_id: string | null;
          title: string;
          notes: string | null;
          start_at: string;
          end_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id?: string | null;
          organizer_user_id: string;
          participant_user_id?: string | null;
          title: string;
          notes?: string | null;
          start_at: string;
          end_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string | null;
          organizer_user_id?: string;
          participant_user_id?: string | null;
          title?: string;
          notes?: string | null;
          start_at?: string;
          end_at?: string;
          created_at?: string;
        };
      };
      student_preferences: {
        Row: {
          student_user_id: string;
          interest_tags: string[];
        };
        Insert: {
          student_user_id: string;
          interest_tags?: string[];
        };
        Update: {
          student_user_id?: string;
          interest_tags?: string[];
        };
      };
    };
  };
}