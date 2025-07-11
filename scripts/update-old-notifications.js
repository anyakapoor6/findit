const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	console.error('Missing Supabase environment variables. Please check your .env.local file.');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateOldNotifications() {
	console.log('🔍 Checking for old notifications that need type field updates...\n');

	try {
		// First, let's see what notifications exist and their current structure
		const { data: notifications, error: fetchError } = await supabase
			.from('notifications')
			.select('*')
			.order('created_at', { ascending: false });

		if (fetchError) {
			console.error('❌ Error fetching notifications:', fetchError);
			return;
		}

		console.log(`📊 Found ${notifications.length} total notifications`);

		// Group notifications by their current state
		const notificationsWithoutType = notifications.filter(n => !n.type);
		const notificationsWithOldType = notifications.filter(n => n.type && !['claim_on_listing', 'claim_update', 'claim_submitted', 'claim_accepted', 'claim_rejected'].includes(n.type));
		const notificationsWithCorrectType = notifications.filter(n => n.type && ['claim_on_listing', 'claim_update', 'claim_submitted', 'claim_accepted', 'claim_rejected'].includes(n.type));

		console.log(`📝 Notifications without type field: ${notificationsWithoutType.length}`);
		console.log(`⚠️  Notifications with unrecognized type: ${notificationsWithOldType.length}`);
		console.log(`✅ Notifications with correct type: ${notificationsWithCorrectType.length}\n`);

		let updatedCount = 0;

		// Update notifications without type field
		if (notificationsWithoutType.length > 0) {
			console.log('🔄 Updating notifications without type field...');

			for (const notification of notificationsWithoutType) {
				let newType = 'claim_on_listing'; // default

				// Try to determine the correct type based on message content
				if (notification.message) {
					const message = notification.message.toLowerCase();
					if (message.includes('accepted')) {
						newType = 'claim_accepted';
					} else if (message.includes('rejected')) {
						newType = 'claim_rejected';
					} else if (message.includes('submitted') || message.includes('new claim')) {
						newType = 'claim_submitted';
					} else if (message.includes('update') || message.includes('status')) {
						newType = 'claim_update';
					}
				}

				const { error: updateError } = await supabase
					.from('notifications')
					.update({ type: newType })
					.eq('id', notification.id);

				if (updateError) {
					console.error(`❌ Failed to update notification ${notification.id}:`, updateError);
				} else {
					console.log(`✅ Updated notification ${notification.id} with type: ${newType}`);
					updatedCount++;
				}
			}
		}

		// Update notifications with unrecognized type
		if (notificationsWithOldType.length > 0) {
			console.log('\n🔄 Updating notifications with unrecognized type...');

			for (const notification of notificationsWithOldType) {
				let newType = 'claim_on_listing'; // default

				// Try to determine the correct type based on message content
				if (notification.message) {
					const message = notification.message.toLowerCase();
					if (message.includes('accepted')) {
						newType = 'claim_accepted';
					} else if (message.includes('rejected')) {
						newType = 'claim_rejected';
					} else if (message.includes('submitted') || message.includes('new claim')) {
						newType = 'claim_submitted';
					} else if (message.includes('update') || message.includes('status')) {
						newType = 'claim_update';
					}
				}

				const { error: updateError } = await supabase
					.from('notifications')
					.update({ type: newType })
					.eq('id', notification.id);

				if (updateError) {
					console.error(`❌ Failed to update notification ${notification.id}:`, updateError);
				} else {
					console.log(`✅ Updated notification ${notification.id} from "${notification.type}" to "${newType}"`);
					updatedCount++;
				}
			}
		}

		console.log(`\n🎉 Update complete! Updated ${updatedCount} notifications.`);

		// Show final summary
		const { data: finalNotifications } = await supabase
			.from('notifications')
			.select('type')
			.order('created_at', { ascending: false });

		if (finalNotifications) {
			const typeCounts = finalNotifications.reduce((acc, n) => {
				acc[n.type] = (acc[n.type] || 0) + 1;
				return acc;
			}, {});

			console.log('\n📊 Final notification type distribution:');
			Object.entries(typeCounts).forEach(([type, count]) => {
				console.log(`  ${type}: ${count}`);
			});
		}

	} catch (error) {
		console.error('❌ Unexpected error:', error);
	}
}

// Run the update
updateOldNotifications()
	.then(() => {
		console.log('\n✨ Script completed successfully!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Script failed:', error);
		process.exit(1);
	}); 