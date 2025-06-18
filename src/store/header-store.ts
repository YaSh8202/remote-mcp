import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { create } from 'zustand';

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

interface HeaderState {
	breadcrumbs: BreadcrumbItem[];
	actions: HeaderAction[];
	title?: string;
}

interface HeaderActions {
	setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
	setActions: (actions: HeaderAction[]) => void;
	setTitle: (title?: string) => void;
	setHeader: (config: { breadcrumbs?: BreadcrumbItem[]; actions?: HeaderAction[]; title?: string }) => void;
	clearHeader: () => void;
}

export type HeaderStore = HeaderState & HeaderActions;

export const useHeaderStore = create<HeaderStore>((set) => ({
	// Initial state
	breadcrumbs: [],
	actions: [],
	title: undefined,

	// Actions
	setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
	setActions: (actions) => set({ actions }),
	setTitle: (title) => set({ title }),
	
	setHeader: (config) => set(() => ({
		breadcrumbs: config.breadcrumbs || [],
		actions: config.actions || [],
		title: config.title,
	})),
	
	clearHeader: () => set({
		breadcrumbs: [],
		actions: [],
		title: undefined,
	}),
}));

// Create a simpler API that avoids the infinite re-render issue
let currentPageId = 0;

export function usePageHeader(config: {
	breadcrumbs?: BreadcrumbItem[];
	actions?: HeaderAction[];
	title?: string;
}) {
	// Serialize the config to create stable dependency values
	const serializedBreadcrumbs = JSON.stringify(config.breadcrumbs || []);
	const serializedActions = JSON.stringify(config.actions?.map(action => ({
		...action,
		onClick: undefined, // Remove function reference for comparison
		icon: undefined // Remove React element for comparison
	})) || []);
	const title = config.title;

	// biome-ignore lint/correctness/useExhaustiveDependencies: We want to run this effect only when the config changes and onClick functions references are recreated on every render.
	useEffect(() => {
		const pageId = ++currentPageId;
		
		// Set the header immediately
		useHeaderStore.getState().setHeader({
			breadcrumbs: config.breadcrumbs || [],
			actions: config.actions || [],
			title
		});

		// Clean up when component unmounts or when a new page takes over
		return () => {
			// Only clear if this is still the current page
			if (currentPageId === pageId) {
				useHeaderStore.getState().clearHeader();
			}
		};
	}, [serializedBreadcrumbs, serializedActions, title]);
}
