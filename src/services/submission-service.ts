import { supabase } from '@/utils/supabase'
import { createAdminClient } from '@/utils/supabase/admin'

// We need to use the admin client with service role to access game submissions
// due to RLS policies that restrict access to service_role only
const adminClient = createAdminClient()

export type GameSubmission = {
  id: number
  name: string
  link_to_socials: string
  email: string
  submitted_at: string
}

export const submissionService = {
  /**
   * Get all game submissions
   * @returns Array of game submissions
   */
  async getAllSubmissions(): Promise<GameSubmission[]> {
    try {
      const { data, error } = await adminClient
        .from('game_submissions')
        .select('*')
        .order('submitted_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching game submissions:', error)
        return []
      }

      console.log('Game submissions data:', data);
      
      return data || []
    } catch (error) {
      console.error('Error in getAllSubmissions:', error)
      return []
    }
  },
  
  /**
   * Get recent game submissions with a limit
   * @param limit Number of submissions to return
   * @returns Array of recent game submissions
   */
  async getRecentSubmissions(limit: number = 5): Promise<GameSubmission[]> {
    try {
      const { data, error } = await adminClient
        .from('game_submissions')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('Error fetching recent game submissions:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Error in getRecentSubmissions:', error)
      return []
    }
  }
}
