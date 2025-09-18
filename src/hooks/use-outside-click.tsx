import { useEffect } from "react";

export const useOutsideClick = (
	ref: React.RefObject<HTMLDivElement>,
	callback: (event: Event) => void,
) => {
	useEffect(() => {
		const listener = (event: Event) => {
			// DO NOTHING if the element being clicked is the target element or their children
			if (!ref.current || ref.current.contains(event.target as Node)) {
				return;
			}
			callback(event);
		};

		document.addEventListener("mousedown", listener);
		document.addEventListener("touchstart", listener);

		return () => {
			document.removeEventListener("mousedown", listener);
			document.removeEventListener("touchstart", listener);
		};
	}, [ref, callback]);
};
