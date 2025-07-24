const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing Supabase environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserClaims() {
	console.log('🔍 Testing user claims access...\n');

	try {
		// First, let's see all claims in the table
		console.log('📊 All claims in the table:');
		const { data: allClaims, error: allClaimsError } = await supabase
			.from('claims')
			.select('*')
			.order('created_at', { ascending: false });

		if (allClaimsError) {
			console.error('❌ Error fetching all claims:', allClaimsError);
			return;
		}

		if (allClaims && allClaims.length > 0) {
			allClaims.forEach((claim, index) => {
				console.log(`${index + 1}. Claim ID: ${claim.id}`);
				console.log(`   Listing ID: ${claim.listing_id}`);
				console.log(`   Claimant ID: ${claim.claimant_id}`);
				console.log(`   Description: ${claim.description}`);
				console.log(`   Status: ${claim.status}`);
				console.log(`   Created: ${new Date(claim.created_at).toLocaleString()}`);
				console.log('');
			});
		} else {
			console.log('❌ No claims found in the table');
			return;
		}

		// Now let's test what a user would see (using regular client)
		console.log('👤 Testing user view (simulating regular client)...');

		// Get the first claim's claimant_id to test with
		const testClaimantId = allClaims[0].claimant_id;

		// Test with regular client (should respect RLS)
		const regularClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

		const { data: userClaims, error: userClaimsError } = await regularClient
			.from('claims')
			.select('*')
			.eq('claimant_id', testClaimantId);

		if (userClaimsError) {
			console.error('❌ Error fetching user claims:', userClaimsError);
			console.log('💡 This suggests RLS is blocking the query');
		} else {
			console.log(`✅ User can see ${userClaims.length} claims`);
			if (userClaims.length > 0) {
				userClaims.forEach(claim => {
					console.log(`   - ${claim.description} (${claim.status})`);
				});
			}
		}

	} catch (error) {
		console.error('❌ Error:', error);
	}
}

testUserClaims(); 