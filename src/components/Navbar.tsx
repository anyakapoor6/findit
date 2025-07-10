'use client'

import Link from 'next/link';
import styled from 'styled-components';

const Nav = styled.nav`
  position: sticky;
  top: 0;
  z-index: 30;
  background: linear-gradient(to right, #eff6ff, #ffffff, #dbeafe);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #dbeafe;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 640px) {
    padding: 1rem;
  }
`

const Logo = styled.a`
  font-size: 2.25rem;
  font-weight: 800;
  color: #1d4ed8;
  letter-spacing: -0.025em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  cursor: pointer;
  @media (min-width: 640px) {
    font-size: 2.5rem;
  }
`

const NavLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  @media (min-width: 640px) {
    gap: 1rem;
  }
`;
const Spacer = styled.div`
  flex: 1;
`;

const NavA = styled.a<{ $variant?: 'default' | 'primary' }>`
  padding: 0.75rem 1.1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 1.15rem;
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  color: #111;
  cursor: pointer;
  ${({ $variant = 'default' }) => {
		switch ($variant) {
			case 'default':
				return `
          background: none;
          &:hover {
            background-color: rgba(59, 130, 246, 0.1);
          }
        `
			case 'primary':
				return `
          background-color: #2563eb;
          color: white;
          font-weight: 600;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          &:hover {
            background-color: #1d4ed8;
          }
        `
		}
	}}
`

export default function Navbar() {
	return (
		<Nav>
			<NavContainer>
				<Link href="/">
					<Logo>FindIt</Logo>
				</Link>
				<NavLinks>
					<Link href="/">
						<NavA>Home</NavA>
					</Link>
					<Link href="/create-listing">
						<NavA $variant="primary">Create Listing</NavA>
					</Link>
					<Spacer />
					<Link href="/profile">
						<NavA>Profile</NavA>
					</Link>
				</NavLinks>
			</NavContainer>
		</Nav>
	);
} 