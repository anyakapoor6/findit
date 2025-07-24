const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing Supabase environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClaimsRLS() {
	console.log('🔍 Checking claims table and RLS policies...\n');

	try {
		// Check if claims table exists
		const { data: tableExists, error: tableError } = await supabase
			.from('information_schema.tables')
			.select('table_name')
			.eq('table_schema', 'public')
			.eq('table_name', 'claims')
			.single();

		if (tableError) {
			console.error('❌ Error checking if claims table exists:', tableError);
		} else if (tableExists) {
			console.log('✅ Claims table exists');
		} else {
			console.log('❌ Claims table does not exist');
			return;
		}

		// Check table structure
		const { data: columns, error: columnsError } = await supabase
			.from('information_schema.columns')
			.select('column_name, data_type, is_nullable')
			.eq('table_schema', 'public')
			.eq('table_name', 'claims')
			.order('ordinal_position');

		if (columnsError) {
			console.error('❌ Error checking table structure:', columnsError);
		} else if (columns && columns.length > 0) {
			console.log('\n📋 Claims table structure:');
			columns.forEach(col => {
				console.log(`  • ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
			});
		}

		// Check RLS policies
		const { data: policies, error: policiesError } = await supabase
			.from('pg_policies')
			.select('policyname, permissive, roles, cmd, qual, with_check')
			.eq('tablename', 'claims');

		if (policiesError) {
			console.error('❌ Error checking RLS policies:', policiesError);
		} else if (policies && policies.length > 0) {
			console.log('\n🔐 RLS Policies for claims table:');
			policies.forEach(policy => {
				console.log(`  • ${policy.policyname}: ${policy.cmd} (${policy.permissive ? 'permissive' : 'restrictive'})`);
				console.log(`    Roles: ${policy.roles.join(', ')}`);
				if (policy.qual) console.log(`    Condition: ${policy.qual}`);
				if (policy.with_check) console.log(`    Check: ${policy.with_check}`);
			});
		} else {
			console.log('\n❌ No RLS policies found for claims table');
		}

		// Check if RLS is enabled
		const { data: rlsEnabled, error: rlsError } = await supabase
			.from('pg_tables')
			.select('rowsecurity')
			.eq('tablename', 'claims')
			.single();

		if (rlsError) {
			console.error('❌ Error checking RLS status:', rlsError);
		} else {
			console.log(`\n🔒 RLS enabled: ${rlsEnabled.rowsecurity ? 'Yes' : 'No'}`);
		}

	} catch (error) {
		console.error('❌ Error:', error);
	}
}

checkClaimsRLS(); 