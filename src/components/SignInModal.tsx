import { useState } from 'react';
import styled from 'styled-components';
import { signIn, signUp } from '../lib/auth';

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const ModalBox = styled.div`
  background: #fff;
  border-radius: 1.25rem;
  box-shadow: 0 4px 32px rgba(0,0,0,0.18);
  padding: 2.5rem 2rem 2rem 2rem;
  min-width: 340px;
  width: 400px;
  max-width: 95vw;
  position: relative;
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
const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
  &:hover { color: #111; }
`;

export default function SignInModal({ open, onClose, onSignIn }: { open: boolean, onClose: () => void, onSignIn?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  if (!open) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    if (isSignUp && !name.trim()) {
      setMessage('Name is required for sign up.');
      setLoading(false);
      return;
    }
    const result = isSignUp
      ? await signUp(email, password, name)
      : await signIn(email, password);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage(isSignUp ? 'Check your email to confirm sign up.' : 'Signed in!');
      if (onSignIn && !isSignUp) onSignIn();
    }
    setLoading(false);
  };

  const handleSwitchMode = () => {
    setIsSignUp(s => !s);
    setMessage('');
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <Overlay>
      <ModalBox>
        <CloseButton onClick={onClose} aria-label="Close">×</CloseButton>
        <Heading>{isSignUp ? 'Sign Up' : 'Sign In'}</Heading>
        <form onSubmit={handleAuth}>
          {isSignUp && (
            <StyledInput
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          )}
          <StyledInput
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <StyledInput
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <StyledButton type="submit" disabled={loading}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </StyledButton>
        </form>
        <SwitchButton type="button" onClick={handleSwitchMode}>
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </SwitchButton>
        {message && <Message error={!!message && message.toLowerCase().includes('error')}>{message}</Message>}
      </ModalBox>
    </Overlay>
  );
} 