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

async function setupNotifications() {
	console.log('🔧 Setting up match_notifications table...');

	try {
		// Create the match_notifications table
		const createTableSQL = `
      CREATE TABLE IF NOT EXISTS match_notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        matched_listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        notification_type TEXT NOT NULL CHECK (notification_type IN ('match_found', 'match_updated')),
        sent_via TEXT NOT NULL CHECK (sent_via IN ('web', 'email', 'sms')),
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        read_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

		console.log('Creating match_notifications table...');
		const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });

		if (tableError) {
			console.log('Table creation failed, trying alternative approach...');
			// Try to create table by inserting a dummy record and catching the error
			const { error: insertError } = await supabase
				.from('match_notifications')
				.insert([{
					user_id: '00000000-0000-0000-0000-000000000000',
					match_id: '00000000-0000-0000-0000-000000000000',
					listing_id: '00000000-0000-0000-0000-000000000000',
					matched_listing_id: '00000000-0000-0000-0000-000000000000',
					notification_type: 'match_found',
					sent_via: 'web'
				}]);

			if (insertError && insertError.message.includes('relation "match_notifications" does not exist')) {
				console.log('❌ Please run the following SQL in your Supabase SQL Editor:');
				console.log('\n' + createTableSQL);
				console.log('\nThen run this script again.');
				return;
			}
		}

		// Create indexes
		console.log('Creating indexes...');
		const indexes = [
			'CREATE INDEX IF NOT EXISTS idx_match_notifications_user_id ON match_notifications(user_id);',
			'CREATE INDEX IF NOT EXISTS idx_match_notifications_match_id ON match_notifications(match_id);',
			'CREATE INDEX IF NOT EXISTS idx_match_notifications_sent_at ON match_notifications(sent_at DESC);',
			'CREATE INDEX IF NOT EXISTS idx_match_notifications_read_at ON match_notifications(read_at);'
		];

		for (const indexSQL of indexes) {
			await supabase.rpc('exec_sql', { sql: indexSQL });
		}

		// Create functions
		console.log('Creating functions...');
		const functions = [
			`CREATE OR REPLACE FUNCTION get_unread_match_notifications_count(user_uuid UUID)
       RETURNS INTEGER AS $$
       BEGIN
         RETURN (
           SELECT COUNT(*)
           FROM match_notifications
           WHERE user_id = user_uuid AND read_at IS NULL
         );
       END;
       $$ LANGUAGE plpgsql;`,

			`CREATE OR REPLACE FUNCTION mark_all_match_notifications_read(user_uuid UUID)
       RETURNS VOID AS $$
       BEGIN
         UPDATE match_notifications
         SET read_at = NOW()
         WHERE user_id = user_uuid AND read_at IS NULL;
       END;
       $$ LANGUAGE plpgsql;`,

			`CREATE OR REPLACE FUNCTION get_match_notification_stats(user_uuid UUID)
       RETURNS TABLE (
         total_notifications INTEGER,
         unread_notifications INTEGER,
         web_notifications INTEGER,
         email_notifications INTEGER,
         sms_notifications INTEGER
       ) AS $$
       BEGIN
         RETURN QUERY
         SELECT 
           COUNT(*)::INTEGER as total_notifications,
           COUNT(*) FILTER (WHERE read_at IS NULL)::INTEGER as unread_notifications,
           COUNT(*) FILTER (WHERE sent_via = 'web')::INTEGER as web_notifications,
           COUNT(*) FILTER (WHERE sent_via = 'email')::INTEGER as email_notifications,
           COUNT(*) FILTER (WHERE sent_via = 'sms')::INTEGER as sms_notifications
         FROM match_notifications
         WHERE user_id = user_uuid;
       END;
       $$ LANGUAGE plpgsql;`
		];

		for (const functionSQL of functions) {
			await supabase.rpc('exec_sql', { sql: functionSQL });
		}

		console.log('✅ Notifications setup complete!');

		// Verify the setup
		const { data, error } = await supabase
			.from('match_notifications')
			.select('*')
			.limit(1);

		if (error) {
			console.error('❌ Verification failed:', error.message);
		} else {
			console.log('✅ Table verification successful');
		}

	} catch (error) {
		console.error('❌ Setup failed:', error);
		console.log('\n📝 Manual setup required:');
		console.log('1. Go to your Supabase dashboard');
		console.log('2. Navigate to SQL Editor');
		console.log('3. Run the contents of scripts/setup-match-notifications.sql');
	}
}

setupNotifications()
	.then(() => {
		console.log('\n🎯 Next steps:');
		console.log('1. Run "npm run check-db" to verify setup');
		console.log('2. Test notifications in the app');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	}); 