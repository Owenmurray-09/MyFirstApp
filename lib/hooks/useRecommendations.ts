import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Database } from '@/types/db';

type Recommendation = Database['public']['Tables']['recommendations']['Row'] & {
  employer?: Database['public']['Tables']['profiles']['Row'];
  student?: Database['public']['Tables']['profiles']['Row'];
  job?: Database['public']['Tables']['jobs']['Row'] & {
    companies?: Database['public']['Tables']['companies']['Row'];
  };
};

type CreateRecommendationData = Database['public']['Tables']['recommendations']['Insert'];

export function useRecommendations(studentId?: string) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchRecommendations = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('recommendations')
        .select(`
          *,
          employer:employer_id (
            id,
            name,
            role
          ),
          student:student_id (
            id,
            name,
            role
          ),
          job:job_id (
            *,
            companies (*)
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [studentId]);

  const refresh = async () => {
    await fetchRecommendations();
  };

  return {
    recommendations,
    loading,
    refresh,
  };
}

export function useCreateRecommendation() {
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  const createRecommendation = async (recommendationData: {
    student_id: string;
    job_id?: string;
    content: string;
  }) => {
    if (!profile?.id) throw new Error('Not authenticated');

    try {
      setLoading(true);

      const newRecommendation: CreateRecommendationData = {
        ...recommendationData,
        employer_id: profile.id,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('recommendations')
        .insert(newRecommendation)
        .select(`
          *,
          employer:employer_id (
            id,
            name,
            role
          ),
          student:student_id (
            id,
            name,
            role
          ),
          job:job_id (
            *,
            companies (*)
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating recommendation:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createRecommendation,
    loading,
  };
}

export function generateRecommendationTemplate(
  studentName: string,
  jobTitle?: string,
  companyName?: string,
  employerName?: string
): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `To Whom It May Concern,

I am writing to provide a strong recommendation for ${studentName}, who ${jobTitle ? `worked with us as a ${jobTitle}` : 'worked with our team'}${companyName ? ` at ${companyName}` : ''}.

During their time with us, ${studentName} demonstrated:

• Strong work ethic and reliability
• Excellent communication skills
• Ability to learn quickly and adapt
• Professional attitude and teamwork
• [Add specific examples of achievements or skills]

${studentName} was a valuable member of our team and consistently exceeded expectations. They showed initiative, took feedback well, and contributed positively to our workplace culture.

I recommend ${studentName} without reservation for future opportunities. They would be an asset to any organization and I believe they will continue to excel in their career.

Please feel free to contact me if you need any additional information regarding this recommendation.

Sincerely,

${employerName || '[Your Name]'}
${companyName ? `${companyName}` : '[Your Company]'}
${currentDate}

---
This recommendation was generated through JobConnect on ${currentDate}.`;
}