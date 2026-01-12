// API utilities for consistent error handling and request formatting

interface ApiOptions extends RequestInit {
	body?: any;
}

async function apiRequest<T>(url: string, options: ApiOptions = {}): Promise<T> {
	const { body, ...restOptions } = options;
	
	const config: RequestInit = {
		...restOptions,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
		credentials: "include",
	};

	if (body) {
		config.body = JSON.stringify(body);
	}

	const response = await fetch(url, config);

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: "Request failed" })) as { error?: string };
		throw new Error(error.error || `HTTP ${response.status}`);
	}

	return response.json();
}

export const api = {
	get: <T>(url: string) => apiRequest<T>(url, { method: "GET" }),
	post: <T>(url: string, body?: any) => apiRequest<T>(url, { method: "POST", body }),
	put: <T>(url: string, body?: any) => apiRequest<T>(url, { method: "PUT", body }),
	delete: <T>(url: string) => apiRequest<T>(url, { method: "DELETE" }),
};
