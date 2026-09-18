import { handlers } from "@/auth";
import { getAuthRuntimeConfig } from "@/lib/auth/runtime-config";
import type { NextRequest } from "next/server";

function configurationError() {
	return Response.json(
		{ error: "Authentication is temporarily unavailable." },
		{ status: 503 },
	);
}

export async function GET(request: NextRequest) {
	try {
		getAuthRuntimeConfig();
		return handlers.GET(request);
	} catch {
		return configurationError();
	}
}

export async function POST(request: NextRequest) {
	try {
		getAuthRuntimeConfig();
		return handlers.POST(request);
	} catch {
		return configurationError();
	}
}
