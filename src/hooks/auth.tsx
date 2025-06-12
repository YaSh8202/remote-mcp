import { authQueries } from "@/services/queries";
import { useQuery } from "@tanstack/react-query";

export const useUserSession = () => {
	const { data: userSession } = useQuery(authQueries.user());

	if (!userSession) {
		throw new Error("User is not authenticated!");
	}

	return userSession;
};
