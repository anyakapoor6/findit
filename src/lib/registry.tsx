import { ReactNode } from 'react';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';

export default function StyledComponentsRegistry({ children }: { children: ReactNode }) {
	if (typeof window !== 'undefined') {
		// On the client, just render children
		return <>{children}</>;
	}

	// On the server, collect styles
	const sheet = new ServerStyleSheet();
	let html: React.ReactNode;
	try {
		html = <StyleSheetManager sheet={sheet.instance}>{children}</StyleSheetManager>;
		// sheet.getStyleElement() will be injected by Next.js automatically
		return html;
	} finally {
		sheet.seal();
	}
} 