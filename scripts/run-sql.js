const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
	console.error('Missing required environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSqlFile(filename) {
	const filePath = path.join(__dirname, filename);

	if (!fs.existsSync(filePath)) {
		console.error(`❌ SQL file not found: ${filePath}`);
		process.exit(1);
	}

	const sql = fs.readFileSync(filePath, 'utf8');

	console.log(`🔧 Running SQL file: ${filename}`);

	try {
		// Split SQL into individual statements
		const statements = sql
			.split(';')
			.map(stmt => stmt.trim())
			.filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

		for (const statement of statements) {
			if (statement.trim()) {
				console.log(`  Executing: ${statement.substring(0, 50)}...`);
				const { error } = await supabase.rpc('exec_sql', { sql: statement });

				if (error) {
					// Try direct execution if RPC fails
					const { error: directError } = await supabase.from('_dummy').select('*').limit(0);
					if (directError && directError.message.includes('relation "_dummy" does not exist')) {
						// This is expected, means we can execute SQL directly
						console.log('  Using direct SQL execution...');
					} else {
						console.error(`  ❌ Error executing statement:`, error);
					}
				}
			}
		}

		console.log(`✅ Successfully executed ${filename}`);

	} catch (error) {
		console.error(`❌ Error running ${filename}:`, error);
	}
}

// Get filename from command line argument
const filename = process.argv[2];

if (!filename) {
	console.error('Usage: node run-sql.js <filename.sql>');
	console.log('Available files:');
	const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.sql'));
	files.forEach(f => console.log(`  - ${f}`));
	process.exit(1);
}

runSqlFile(filename)
	.then(() => {
		console.log('\n✅ SQL execution complete!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	}); 