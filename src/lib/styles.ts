import styled from 'styled-components'

// Common styled components
export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'outline' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  border: none;
  outline: none;

  ${({ variant = 'primary' }) => {
		switch (variant) {
			case 'primary':
				return `
          background-color: var(--primary);
          color: white;
          &:hover {
            background-color: var(--primary-hover);
          }
        `
			case 'secondary':
				return `
          background-color: var(--secondary);
          color: white;
          &:hover {
            opacity: 0.9;
          }
        `
			case 'outline':
				return `
          background-color: transparent;
          color: var(--primary);
          border: 1px solid var(--primary);
          &:hover {
            background-color: var(--primary);
            color: white;
          }
        `
		}
	}}
`

export const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background-color: var(--input);
  color: var(--foreground);
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: border-color 0.2s ease-in-out;

  &:focus {
    outline: none;
    border-color: var(--ring);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: var(--secondary);
  }
`

export const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background-color: var(--input);
  color: var(--foreground);
  font-size: 0.875rem;
  line-height: 1.25rem;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s ease-in-out;

  &:focus {
    outline: none;
    border-color: var(--ring);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: var(--secondary);
  }
`

export const Card = styled.div`
  background-color: white;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
`

export const Grid = styled.div<{ cols?: number; gap?: string }>`
  display: grid;
  grid-template-columns: repeat(${({ cols = 1 }) => cols}, 1fr);
  gap: ${({ gap = '1rem' }) => gap};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

export const Flex = styled.div<{
	direction?: 'row' | 'column';
	align?: string;
	justify?: string;
	gap?: string;
	wrap?: boolean;
}>`
  display: flex;
  flex-direction: ${({ direction = 'row' }) => direction};
  align-items: ${({ align = 'stretch' }) => align};
  justify-content: ${({ justify = 'flex-start' }) => justify};
  gap: ${({ gap = '0' }) => gap};
  flex-wrap: ${({ wrap = false }) => wrap ? 'wrap' : 'nowrap'};
`

export const Heading = styled.h1<{ size?: 'h1' | 'h2' | 'h3' | 'h4' }>`
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 1rem;

  ${({ size = 'h1' }) => {
		switch (size) {
			case 'h1':
				return 'font-size: 2.25rem; line-height: 2.5rem;'
			case 'h2':
				return 'font-size: 1.875rem; line-height: 2.25rem;'
			case 'h3':
				return 'font-size: 1.5rem; line-height: 2rem;'
			case 'h4':
				return 'font-size: 1.25rem; line-height: 1.75rem;'
		}
	}}
`

export const Text = styled.p<{ size?: 'sm' | 'base' | 'lg'; color?: string }>`
  color: ${({ color = 'var(--foreground)' }) => color};
  margin-bottom: 0.5rem;

  ${({ size = 'base' }) => {
		switch (size) {
			case 'sm':
				return 'font-size: 0.875rem; line-height: 1.25rem;'
			case 'base':
				return 'font-size: 1rem; line-height: 1.5rem;'
			case 'lg':
				return 'font-size: 1.125rem; line-height: 1.75rem;'
		}
	}}
` 