import React, { createContext, useContext, useState, type ReactNode } from "react";

export interface BreadcrumbItem {
	label: string;
	href?: string;
}

export interface HeaderAction {
	id: string;
	label: string;
	icon?: ReactNode;
	onClick: () => void;
	variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
	disabled?: boolean;
}

interface HeaderContextValue {
	breadcrumbs: BreadcrumbItem[];
	setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
	actions: HeaderAction[];
	setActions: (actions: HeaderAction[]) => void;
	title?: string;
	setTitle: (title?: string) => void;
}

const HeaderContext = createContext<HeaderContextValue | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
	const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
	const [actions, setActions] = useState<HeaderAction[]>([]);
	const [title, setTitle] = useState<string | undefined>();

	return (
		<HeaderContext.Provider
			value={{
				breadcrumbs,
				setBreadcrumbs,
				actions,
				setActions,
				title,
				setTitle,
			}}
		>
			{children}
		</HeaderContext.Provider>
	);
}

export function useHeader() {
	const context = useContext(HeaderContext);
	if (context === undefined) {
		throw new Error("useHeader must be used within a HeaderProvider");
	}
	return context;
}

// Hook to set header configuration for a route
export function usePageHeader(config: {
	breadcrumbs?: BreadcrumbItem[];
	actions?: HeaderAction[];
	title?: string;
}) {
	const { setBreadcrumbs, setActions, setTitle } = useHeader();

	// Set header configuration when component mounts or config changes
	React.useEffect(() => {
		if (config.breadcrumbs) {
			setBreadcrumbs(config.breadcrumbs);
		}
		if (config.actions) {
			setActions(config.actions);
		}
		if (config.title !== undefined) {
			setTitle(config.title);
		}

		// Clean up when component unmounts
		return () => {
			setBreadcrumbs([]);
			setActions([]);
			setTitle(undefined);
		};
	}, [config.breadcrumbs, config.actions, config.title, setBreadcrumbs, setActions, setTitle]);
}
