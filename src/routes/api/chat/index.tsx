import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/chat/")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session?.user) {
					return json({ error: "Unauthorized" }, { status: 401 });
				}

				return json({}, { status: 200 });
			},
		},
	},
});
