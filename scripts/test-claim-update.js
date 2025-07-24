const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing Supabase environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClaimUpdate() {
	console.log('🧪 Testing claim status update...\n');

	try {
		// Get the pending claim
		const { data: claims, error: fetchError } = await supabase
			.from('claims')
			.select('*')
			.eq('status', 'pending')
			.order('created_at', { ascending: false })
			.limit(1);

		if (fetchError) {
			console.error('❌ Error fetching claims:', fetchError);
			return;
		}

		if (!claims || claims.length === 0) {
			console.log('❌ No pending claims found');
			return;
		}

		const claim = claims[0];
		console.log(`📋 Found pending claim: ${claim.id}`);
		console.log(`   Description: ${claim.description}`);
		console.log(`   Current status: ${claim.status}`);

		// Try to update the claim status
		console.log('\n🔄 Attempting to update claim status...');
		const { data: updatedClaim, error: updateError } = await supabase
			.from('claims')
			.update({ status: 'accepted' })
			.eq('id', claim.id)
			.select()
			.single();

		if (updateError) {
			console.error('❌ Error updating claim:', updateError);
			console.log('\n💡 This suggests RLS policies are blocking the update.');
		} else {
			console.log('✅ Claim updated successfully!');
			console.log(`   New status: ${updatedClaim.status}`);
		}

		// Verify the update
		console.log('\n🔍 Verifying update...');
		const { data: verifyClaim, error: verifyError } = await supabase
			.from('claims')
			.select('*')
			.eq('id', claim.id)
			.single();

		if (verifyError) {
			console.error('❌ Error verifying claim:', verifyError);
		} else {
			console.log(`✅ Verification: Claim status is now "${verifyClaim.status}"`);
		}

	} catch (error) {
		console.error('❌ Error:', error);
	}
}

testClaimUpdate(); 