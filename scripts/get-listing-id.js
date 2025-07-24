const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing Supabase environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getListingId() {
	try {
		const { data: listing, error } = await supabase
			.from('listings')
			.select('id, title, status')
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		if (error) {
			console.error('❌ Error:', error);
			return;
		}

		console.log(`📋 Most recent listing:`);
		console.log(`   ID: ${listing.id}`);
		console.log(`   Title: "${listing.title}"`);
		console.log(`   Status: ${listing.status}`);
		console.log(`\n🔗 Test URL: curl -X POST http://localhost:3000/api/create-matches -H "Content-Type: application/json" -d '{"listingId": "${listing.id}"}'`);

	} catch (error) {
		console.error('❌ Error:', error);
	}
}

getListingId(); 