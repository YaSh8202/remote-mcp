import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function isNil<T>(
	value: T | null | undefined,
): value is null | undefined {
	return value === null || value === undefined;
}
