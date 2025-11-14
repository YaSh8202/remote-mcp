// Temporary placeholder - will be replaced with proper ai-elements integration
import type { ReactNode } from "react";

export function ChatProvider({
	children,
}: {
	chatId: string;
	initialMessages?: unknown[];
	children: ReactNode;
}) {
	return <>{children}</>;
}
