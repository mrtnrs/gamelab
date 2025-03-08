// import { NextRequest, NextResponse } from 'next/server'
// import { supabase } from '@/utils/supabase'

// export const runtime = 'edge';

// export async function POST(request: NextRequest) {
//   try {
//     const { gameId, rating } = await request.json()
    
//     if (!gameId || !rating) {
//       return NextResponse.json(
//         { error: 'Game ID and rating are required' },
//         { status: 400 }
//       )
//     }

//     // Validate rating value
//     const ratingValue = Number(rating)
//     if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
//       return NextResponse.json(
//         { error: 'Rating must be a number between 1 and 5' },
//         { status: 400 }
//       )
//     }

//     // Get the user's IP address for duplicate prevention
//     const userIp = request.headers.get('x-forwarded-for') || 
//                   request.headers.get('x-real-ip') || 
//                   'unknown'

//     // First, check if this IP has already rated this game
//     const { data: existingRating, error: checkError } = await supabase
//       .from('game_ratings')
//       .select('id')
//       .eq('game_id', gameId)
//       .eq('user_ip', userIp)
//       .maybeSingle()

//     if (checkError) {
//       console.error('Error checking existing rating:', checkError)
//       return NextResponse.json(
//         { error: 'Failed to check existing rating' },
//         { status: 500 }
//       )
//     }

//     if (existingRating) {
//       return NextResponse.json(
//         { error: 'You have already rated this game' },
//         { status: 409 }
//       )
//     }

//     // Insert the new rating
//     const { error: insertError } = await supabase
//       .from('game_ratings')
//       .insert({
//         game_id: gameId,
//         rating: ratingValue,
//         user_ip: userIp
//       })

//     if (insertError) {
//       console.error('Error inserting rating:', insertError)
//       return NextResponse.json(
//         { error: 'Failed to save rating' },
//         { status: 500 }
//       )
//     }

//     // Update the game's rating stats
//     const { error: updateError } = await supabase.rpc('update_game_rating_stats', {
//       game_id: gameId,
//       new_rating: ratingValue
//     })

//     if (updateError) {
//       console.error('Error updating game rating stats:', updateError)
//       return NextResponse.json(
//         { error: 'Failed to update game rating stats' },
//         { status: 500 }
//       )
//     }

//     return NextResponse.json({ success: true })
//   } catch (error) {
//     console.error('Error in rate API:', error)
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }
