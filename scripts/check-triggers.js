const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing Supabase environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
	console.log('🔍 Checking database triggers...\n');

	try {
		// Check if the trigger exists
		const { data: triggers, error: triggerError } = await supabase
			.from('information_schema.triggers')
			.select('trigger_name, event_manipulation, event_object_table, action_statement')
			.eq('event_object_table', 'listings');

		if (triggerError) {
			console.error('❌ Error checking triggers:', triggerError);
			return;
		}

		if (triggers && triggers.length > 0) {
			console.log('✅ Found triggers for listings table:');
			triggers.forEach(trigger => {
				console.log(`• ${trigger.trigger_name}`);
				console.log(`  Event: ${trigger.event_manipulation}`);
				console.log(`  Table: ${trigger.event_object_table}`);
				console.log('');
			});
		} else {
			console.log('❌ No triggers found for listings table');
			console.log('This means automatic matching is not working!');
		}

		// Also check if the trigger function exists
		const { data: functions, error: functionError } = await supabase
			.from('information_schema.routines')
			.select('routine_name, routine_type')
			.eq('routine_name', 'trigger_find_matches');

		if (functionError) {
			console.error('❌ Error checking functions:', functionError);
			return;
		}

		if (functions && functions.length > 0) {
			console.log('✅ Found trigger function: trigger_find_matches');
		} else {
			console.log('❌ Trigger function not found: trigger_find_matches');
		}

	} catch (error) {
		console.error('❌ Error:', error);
	}
}

checkTriggers(); 