// Shared types between frontend and backend

export interface User {
	id: number;
	username: string;
	role: string;
}

export interface Book {
	id: number;
	title: string;
	author: string;
	description: string;
	cover_url: string;
	status: "read" | "unread";
	read_on: string | null;
	rating?: number;
}

export interface Session {
	id: number;
	user_id: number;
	session_token: string;
	expires_at: string;
}

export interface MeetingDate {
	id: number;
	book_id: number;
	proposed_date: string;
	vote_count: number;
}

export interface Rating {
	id: number;
	user_id: number;
	book_id: number;
	rating: number;
}
