import { NextRequest, NextResponse } from 'next/server'
// import { supabase } from '@/utils/supabase'

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { gameId } = await request.json()
    
    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      )
    }

    // Call the SQL function to increment visit count
    // const { error } = await supabase.rpc('increment_game_visit_count', {
    //   game_id: gameId
    // })

    // if (error) {
    //   console.error('Error tracking visit:', error)
    //   return NextResponse.json(
    //     { error: 'Failed to track visit' },
    //     { status: 500 }
    //   )
    // }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in track-visit API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
