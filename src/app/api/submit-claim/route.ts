import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
	try {
		const { listingId, description, location, contents, proofImageUrl } = await request.json();

		// Get the current user from the request headers
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.substring(7);

		// Verify the user
		const { data: { user }, error: authError } = await supabase.auth.getUser(token);
		if (authError || !user) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
		}

		// Validate required fields
		if (!listingId || !description) {
			return NextResponse.json({ error: 'listingId and description are required' }, { status: 400 });
		}

		// Check if the listing exists
		const { data: listing, error: listingCheckError } = await supabase
			.from('listings')
			.select('id, status')
			.eq('id', listingId)
			.single();

		if (listingCheckError || !listing) {
			return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
		}

		// Check if user already submitted a claim for this listing
		const { data: existingClaim, error: existingError } = await supabase
			.from('claims')
			.select('id')
			.eq('listing_id', listingId)
			.eq('claimant_id', user.id)
			.single();

		if (existingClaim) {
			return NextResponse.json({ error: 'You have already submitted a claim for this listing' }, { status: 409 });
		}

		// Insert the claim using service role key (bypasses RLS)
		const { data: claim, error: insertError } = await supabase
			.from('claims')
			.insert({
				listing_id: listingId,
				claimant_id: user.id,
				description,
				where_lost: location,
				contents,
				proof_image_url: proofImageUrl,
				status: 'pending'
			})
			.select()
			.single();

		if (insertError) {
			console.error('Error inserting claim:', insertError);
			return NextResponse.json({ error: 'Failed to submit claim' }, { status: 500 });
		}

		// Get listing details for notification
		const { data: listingDetails, error: listingError } = await supabase
			.from('listings')
			.select('user_id, title')
			.eq('id', listingId)
			.single();

		if (listingDetails && listingDetails.user_id) {
			// Create notification for listing owner
			await supabase.from('notifications').insert({
				user_id: listingDetails.user_id,
				type: 'claim_submitted',
				message: `A new claim was submitted for your found item "${listingDetails.title}".`,
				listing_id: listingId,
				claim_id: claim.id
			});

			// Send email notification
			try {
				const { sendEmailNotification } = await import('../../../lib/notifications');
				await sendEmailNotification({
					user_id: listingDetails.user_id,
					type: 'claim_submitted',
					message: `A new claim was submitted for your found item "${listingDetails.title}".`,
					listing_title: listingDetails.title
				});
			} catch (emailError) {
				console.error('Failed to send email notification:', emailError);
				// Don't fail the claim submission if email fails
			}
		}

		console.log(`✅ Claim submitted successfully: ${claim.id}`);

		return NextResponse.json({
			success: true,
			claimId: claim.id,
			message: 'Claim submitted successfully. The listing owner will review your claim.'
		});

	} catch (error) {
		console.error('❌ Error in submit-claim API:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
} 