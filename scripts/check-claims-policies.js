const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing Supabase environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClaimsPolicies() {
	console.log('🔍 Checking claims table policies...\n');

	try {
		// Test inserting a claim directly to see if RLS is blocking it
		const testClaim = {
			listing_id: '00000000-0000-0000-0000-000000000000', // dummy ID
			claimant_id: '00000000-0000-0000-0000-000000000000', // dummy ID
			description: 'test claim',
			where_lost: 'test location',
			status: 'pending'
		};

		console.log('🧪 Testing direct insert with service role...');
		const { data, error } = await supabase
			.from('claims')
			.insert(testClaim)
			.select();

		if (error) {
			console.error('❌ Insert failed:', error);
			console.log('\n🔧 This suggests RLS policies are blocking the insert.');
			console.log('💡 The API endpoint should work since it uses the service role key.');
		} else {
			console.log('✅ Direct insert succeeded');
			// Clean up the test record
			await supabase.from('claims').delete().eq('id', data[0].id);
		}

		// Check if we can query the claims table
		console.log('\n🔍 Testing query access...');
		const { data: claims, error: queryError } = await supabase
			.from('claims')
			.select('*')
			.limit(1);

		if (queryError) {
			console.error('❌ Query failed:', queryError);
		} else {
			console.log('✅ Query succeeded');
			console.log(`📊 Found ${claims.length} claims in table`);
		}

	} catch (error) {
		console.error('❌ Error:', error);
	}
}

checkClaimsPolicies(); 