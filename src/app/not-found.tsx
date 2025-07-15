export default function NotFound() {
	return (
		<html lang="en">
			<body style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', fontFamily: 'sans-serif', background: '#f9fafb' }}>
				<h1 style={{ fontSize: '2.5rem', color: '#dc2626', marginBottom: '1rem' }}>404 - Not Found</h1>
				<p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
					Sorry, the page you are looking for does not exist.
				</p>
				<a href="/" style={{ color: '#2563eb', fontWeight: 600, fontSize: '1.1rem', textDecoration: 'underline' }}>Go back home</a>
			</body>
		</html>
	);
} 