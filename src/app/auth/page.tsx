'use client';
import { useState } from 'react';
import { signIn, signUp } from '../../lib/auth';

export default function AuthPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [isSignUp, setIsSignUp] = useState(false);

	const handleAuth = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setMessage('');

		const result = isSignUp
			? await signUp(email, password)
			: await signIn(email, password);

		if (result.error) {
			setMessage(result.error);
		} else {
			setMessage(isSignUp ? 'Check your email to confirm sign up.' : 'Signed in!');
		}
		setLoading(false);
	};

	return (
		<div className="max-w-md mx-auto bg-white p-8 rounded shadow mt-12">
			<h2 className="text-2xl font-bold mb-6 text-center">{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
			<form onSubmit={handleAuth} className="space-y-4">
				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={e => setEmail(e.target.value)}
					required
					className="w-full border rounded px-3 py-2"
				/>
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={e => setPassword(e.target.value)}
					required
					className="w-full border rounded px-3 py-2"
				/>
				<button
					type="submit"
					className="w-full bg-blue-600 text-white py-2 rounded font-semibold disabled:opacity-50"
					disabled={loading}
				>
					{loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
				</button>
			</form>
			<button
				className="mt-4 text-blue-600 underline w-full"
				onClick={() => setIsSignUp(s => !s)}
			>
				{isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
			</button>
			{message && <p className="mt-4 text-center text-red-500">{message}</p>}
		</div>
	);
} 