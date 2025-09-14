import { auth } from "@/lib/auth";
import { json } from "@tanstack/react-start";
import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/chat/").methods({
	POST: async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) {
			return json({ error: "Unauthorized" }, { status: 401 });
		}

		return json({}, { status: 200 });
	},
});
