const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
	console.error('Missing required environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseSetup() {
	console.log('🔍 Checking FindIt database setup...\n');

	try {
		// Check if listings table exists and has correct structure
		console.log('📋 Checking listings table...');
		const { data: listingsData, error: listingsError } = await supabase
			.from('listings')
			.select('*')
			.limit(1);

		if (listingsError) {
			console.error('❌ Listings table error:', listingsError.message);
		} else {
			console.log('✅ Listings table exists');

			// Check for required columns
			if (listingsData && listingsData.length > 0) {
				const sampleListing = listingsData[0];
				const requiredColumns = ['id', 'title', 'description', 'status', 'location', 'date', 'user_id', 'created_at'];
				const missingColumns = requiredColumns.filter(col => !(col in sampleListing));

				if (missingColumns.length > 0) {
					console.error('❌ Missing columns in listings table:', missingColumns);
				} else {
					console.log('✅ All required columns present in listings table');
				}

				// Check for image_embedding column
				if ('image_embedding' in sampleListing) {
					console.log('✅ image_embedding column exists');
				} else {
					console.log('⚠️  image_embedding column missing - run add-image-embeddings.sql');
				}
			}
		}

		// Check if matches table exists
		console.log('\n🔗 Checking matches table...');
		const { data: matchesData, error: matchesError } = await supabase
			.from('matches')
			.select('*')
			.limit(1);

		if (matchesError) {
			console.error('❌ Matches table error:', matchesError.message);
		} else {
			console.log('✅ Matches table exists');
		}

		// Check if match_notifications table exists
		console.log('\n🔔 Checking match_notifications table...');
		const { data: notificationsData, error: notificationsError } = await supabase
			.from('match_notifications')
			.select('*')
			.limit(1);

		if (notificationsError) {
			console.error('❌ Match notifications table error:', notificationsError.message);
		} else {
			console.log('✅ Match notifications table exists');
		}

		// Check if users table exists
		console.log('\n👥 Checking users table...');
		const { data: usersData, error: usersError } = await supabase
			.from('users')
			.select('*')
			.limit(1);

		if (usersError) {
			console.error('❌ Users table error:', usersError.message);
		} else {
			console.log('✅ Users table exists');
		}

		// Check for required functions
		console.log('\n⚙️  Checking database functions...');

		// Test find_matches_for_listing function
		try {
			const { data: functionTest, error: functionError } = await supabase
				.rpc('find_matches_for_listing', { new_listing_id: '00000000-0000-0000-0000-000000000000' });

			if (functionError && functionError.message.includes('function') && functionError.message.includes('does not exist')) {
				console.log('⚠️  find_matches_for_listing function missing - run setup-matches.sql');
			} else {
				console.log('✅ find_matches_for_listing function exists');
			}
		} catch (error) {
			console.log('⚠️  find_matches_for_listing function missing - run setup-matches.sql');
		}

		// Check for vector extension
		console.log('\n🧮 Checking vector extension...');
		try {
			const { data: vectorTest, error: vectorError } = await supabase
				.rpc('pg_extension_exists', { extname: 'vector' });

			if (vectorError) {
				console.log('⚠️  Vector extension may not be enabled');
			} else {
				console.log('✅ Vector extension is available');
			}
		} catch (error) {
			console.log('⚠️  Vector extension may not be enabled');
		}

		// Count records in each table
		console.log('\n📊 Database statistics:');

		const { count: listingsCount } = await supabase
			.from('listings')
			.select('*', { count: 'exact', head: true });
		console.log(`📋 Listings: ${listingsCount || 0} records`);

		const { count: matchesCount } = await supabase
			.from('matches')
			.select('*', { count: 'exact', head: true });
		console.log(`🔗 Matches: ${matchesCount || 0} records`);

		const { count: notificationsCount } = await supabase
			.from('match_notifications')
			.select('*', { count: 'exact', head: true });
		console.log(`🔔 Notifications: ${notificationsCount || 0} records`);

		const { count: usersCount } = await supabase
			.from('users')
			.select('*', { count: 'exact', head: true });
		console.log(`👥 Users: ${usersCount || 0} records`);

		// Check for listings with image embeddings
		const { count: embeddingsCount } = await supabase
			.from('listings')
			.select('*', { count: 'exact', head: true })
			.not('image_embedding', 'is', null);
		console.log(`🖼️  Listings with image embeddings: ${embeddingsCount || 0} records`);

		console.log('\n✅ Database setup check complete!');

	} catch (error) {
		console.error('❌ Error checking database setup:', error);
	}
}

// Run the check
checkDatabaseSetup()
	.then(() => {
		console.log('\n🎯 Next steps:');
		console.log('1. If any tables are missing, run the corresponding SQL scripts');
		console.log('2. If image_embedding column is missing, run: add-image-embeddings.sql');
		console.log('3. If functions are missing, run: setup-matches.sql');
		console.log('4. If vector extension is missing, enable it in Supabase dashboard');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	}); 