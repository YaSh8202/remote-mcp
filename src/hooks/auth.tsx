import { useQuery } from "@tanstack/react-query";
import { authQueries } from "@/services/queries";

export const useUserSession = () => {
	const { data: userSession } = useQuery(authQueries.user());

	if (!userSession) {
		throw new Error("User is not authenticated!");
	}

	return userSession;
};
