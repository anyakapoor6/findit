'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, signUp } from '../../lib/auth';
import styled from 'styled-components';

const AuthContainer = styled.div`
  max-width: 28rem;
  margin: 3rem auto 0 auto;
  background: #fff;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;
const Heading = styled.h2`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  text-align: center;
  color: #111;
`;
const StyledInput = styled.input`
  width: 100%;
  border: 1px solid #bbb;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 1.1rem;
  color: #111;
  background: #fff;
  margin-bottom: 1rem;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px #bfdbfe;
  }
  &::placeholder {
    color: #666;
  }
`;
const StyledButton = styled.button`
  width: 100%;
  background: #2563eb;
  color: #fff;
  padding: 0.75rem 0;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1.1rem;
  border: none;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  transition: background 0.2s;
  &:hover {
    background: #1d4ed8;
  }
  &:disabled {
    opacity: 0.5;
  }
`;
const SwitchButton = styled.button`
  margin-top: 1rem;
  color: #2563eb;
  text-decoration: underline;
  width: 100%;
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
`;
const Message = styled.p<{ error?: boolean }>`
  margin-top: 1rem;
  text-align: center;
  color: ${({ error }) => (error ? '#dc2626' : '#2563eb')};
  font-size: 1.1rem;
`;

function AuthForm() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [isSignUp, setIsSignUp] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirect = searchParams.get('redirect');

	const handleAuth = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setMessage('');

		const result = isSignUp
			? await signUp(email, password)
			: await signIn(email, password);

		if (result.error) {
			setMessage(result.error);
		} else if (redirect && !isSignUp) {
			router.push(redirect);
			return;
		} else {
			setMessage(isSignUp ? 'Check your email to confirm sign up.' : 'Signed in!');
		}
		setLoading(false);
	};

	return (
		<AuthContainer>
			<Heading>{isSignUp ? 'Sign Up' : 'Sign In'}</Heading>
			<form onSubmit={handleAuth} autoComplete="off">
				<StyledInput
					type="email"
					placeholder="Enter your email address"
					value={email}
					onChange={e => setEmail(e.target.value)}
					required
					autoComplete="email"
				/>
				<StyledInput
					type="password"
					placeholder="Enter your password"
					value={password}
					onChange={e => setPassword(e.target.value)}
					required
					autoComplete="current-password"
				/>
				<StyledButton type="submit" disabled={loading}>
					{loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
				</StyledButton>
			</form>
			<SwitchButton type="button" onClick={() => setIsSignUp(s => !s)}>
				{isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
			</SwitchButton>
			{message && <Message error={!!message && message.toLowerCase().includes('error')}>{message}</Message>}
		</AuthContainer>
	);
}

export default function AuthPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<AuthForm />
		</Suspense>
	);
} 