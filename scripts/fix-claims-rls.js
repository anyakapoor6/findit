const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing Supabase environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixClaimsRLS() {
	console.log('🔧 Fixing claims table RLS policies...\n');

	try {
		// First, let's see what policies currently exist
		console.log('📋 Current policies:');
		const { data: policies, error: policiesError } = await supabase
			.rpc('exec_sql', {
				sql: `
        SELECT policyname, cmd, permissive, roles, qual, with_check 
        FROM pg_policies 
        WHERE tablename = 'claims'
      ` });

		if (policiesError) {
			console.error('❌ Error checking policies:', policiesError);
		} else if (policies && policies.length > 0) {
			policies.forEach(policy => {
				console.log(`  • ${policy.policyname}: ${policy.cmd}`);
			});
		} else {
			console.log('  No policies found');
		}

		// Drop all existing policies
		console.log('\n🗑️  Dropping existing policies...');
		const dropPolicies = [
			'DROP POLICY IF EXISTS "Users can insert their own claims" ON claims;',
			'DROP POLICY IF EXISTS "Users can view claims they submitted" ON claims;',
			'DROP POLICY IF EXISTS "Users can update their own pending claims" ON claims;',
			'DROP POLICY IF EXISTS "Listing owners can view claims on their listings" ON claims;',
			'DROP POLICY IF EXISTS "Listing owners can update claim status" ON claims;',
			'DROP POLICY IF EXISTS "Allow all operations" ON claims;'
		];

		for (const sql of dropPolicies) {
			const { error } = await supabase.rpc('exec_sql', { sql });
			if (error) {
				console.error(`❌ Error dropping policy: ${error.message}`);
			}
		}

		// Create new policies
		console.log('\n✅ Creating new policies...');
		const createPolicies = [
			`CREATE POLICY "Users can insert their own claims" ON claims
       FOR INSERT WITH CHECK (auth.uid() = claimant_id);`,

			`CREATE POLICY "Users can view claims they submitted" ON claims
       FOR SELECT USING (auth.uid() = claimant_id);`,

			`CREATE POLICY "Users can update their own pending claims" ON claims
       FOR UPDATE USING (auth.uid() = claimant_id AND status = 'pending');`,

			`CREATE POLICY "Listing owners can view claims on their listings" ON claims
       FOR SELECT USING (
         EXISTS (
           SELECT 1 FROM listings 
           WHERE listings.id = claims.listing_id 
           AND listings.user_id = auth.uid()
         )
       );`,

			`CREATE POLICY "Listing owners can update claim status" ON claims
       FOR UPDATE USING (
         EXISTS (
           SELECT 1 FROM listings 
           WHERE listings.id = claims.listing_id 
           AND listings.user_id = auth.uid()
         )
       );`
		];

		for (const sql of createPolicies) {
			const { error } = await supabase.rpc('exec_sql', { sql });
			if (error) {
				console.error(`❌ Error creating policy: ${error.message}`);
			} else {
				console.log('  ✅ Policy created successfully');
			}
		}

		console.log('\n🎉 RLS policies updated!');

		// Test if it works now
		console.log('\n🧪 Testing user access...');
		const testClaimantId = '02f18aa4-71d9-4fbb-93b6-d9e227b1f6c1'; // From the test above

		const regularClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

		const { data: userClaims, error: userClaimsError } = await regularClient
			.from('claims')
			.select('*')
			.eq('claimant_id', testClaimantId);

		if (userClaimsError) {
			console.error('❌ Still can\'t access claims:', userClaimsError);
		} else {
			console.log(`✅ Success! User can now see ${userClaims.length} claims`);
		}

	} catch (error) {
		console.error('❌ Error:', error);
	}
}

fixClaimsRLS(); 