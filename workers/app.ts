import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { cors } from "hono/cors";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

type Bindings = {
	bookclub_db: D1Database;
};

interface User {
	id: number;
	username: string;
	role: string;
}

interface Session {
	id: number;
	user_id: number;
	session_token: string;
	expires_at: string;
}

// Helper function to generate secure random token
function generateToken(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Password hashing using Web Crypto API (available in Cloudflare Workers)
async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const passwordData = encoder.encode(password);
	
	// Use PBKDF2 with 100,000 iterations (OWASP recommendation)
	const key = await crypto.subtle.importKey(
		'raw',
		passwordData,
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);
	
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: salt,
			iterations: 100000,
			hash: 'SHA-256'
		},
		key,
		256
	);
	
	const hashArray = new Uint8Array(derivedBits);
	const saltHex = Array.from(salt, byte => byte.toString(16).padStart(2, '0')).join('');
	const hashHex = Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
	
	// Store as salt:hash
	return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
	const [saltHex, hashHex] = hashedPassword.split(':');
	
	if (!saltHex || !hashHex) {
		return false;
	}
	
	const encoder = new TextEncoder();
	const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
	const passwordData = encoder.encode(password);
	
	const key = await crypto.subtle.importKey(
		'raw',
		passwordData,
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);
	
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: salt,
			iterations: 100000,
			hash: 'SHA-256'
		},
		key,
		256
	);
	
	const hashArray = new Uint8Array(derivedBits);
	const computedHashHex = Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
	
	return computedHashHex === hashHex;
}

// Helper function to create session and set cookie
async function createSession(c: any, userId: number): Promise<string> {
	const sessionToken = generateToken();
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

	await c.env.bookclub_db
		.prepare("INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)")
		.bind(userId, sessionToken, expiresAt.toISOString())
		.run();

	setCookie(c, "session_token", sessionToken, {
		httpOnly: true,
		secure: true,
		sameSite: "Strict",
		maxAge: 30 * 24 * 60 * 60, // 30 days
		path: "/",
	});

	return sessionToken;
}

// Helper function to get user from session token
async function getUserFromSession(db: D1Database, sessionToken: string): Promise<User | null> {
	const session = await db
		.prepare(`
			SELECT s.user_id, u.id, u.username, u.role
			FROM sessions s
			JOIN users u ON s.user_id = u.id
			WHERE s.session_token = ? AND s.expires_at > datetime('now')
		`)
		.bind(sessionToken)
		.first();

	if (!session) return null;

	return {
		id: session.id as number,
		username: session.username as string,
		role: session.role as string,
	};
}

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for API routes
app.use("/api/*", cors());

// Auth API Routes
app.post("/api/auth/register", async (c) => {
	try {
		const { username, password } = await c.req.json();

		// Validation
		if (!username || !password) {
			return c.json({ error: "Username and password are required" }, 400);
		}

		if (password.length < 8) {
			return c.json({ error: "Password must be at least 8 characters" }, 400);
		}

		// Check if username already exists
		const existingUser = await c.env.bookclub_db
			.prepare("SELECT id FROM users WHERE username = ?")
			.bind(username)
			.first();

		if (existingUser) {
			return c.json({ error: "Username already exists" }, 400);
		}

		// Hash password
		const passwordHash = await hashPassword(password);

		// Insert user
		const result = await c.env.bookclub_db
			.prepare(
				"INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'member')"
			)
			.bind(username, passwordHash)
			.run();

		const userId = result.meta.last_row_id;

		// Create session
		await createSession(c, userId);

		const user = {
			id: userId,
			username,
			role: "member",
		};

		return c.json({ user });
	} catch (error) {
		console.error("Register error:", error);
		return c.json({ error: "Registration failed" }, 500);
	}
});

app.post("/api/auth/login", async (c) => {
	try {
		const { username, password } = await c.req.json();

		if (!username || !password) {
			return c.json({ error: "Invalid credentials" }, 400);
		}

		// Query user by username
		const user = await c.env.bookclub_db
			.prepare("SELECT id, username, role, password_hash FROM users WHERE username = ?")
			.bind(username)
			.first();

		if (!user) {
			return c.json({ error: "Invalid credentials" }, 401);
		}

		// Verify password
		const validPassword = await verifyPassword(password, user.password_hash as string);

		if (!validPassword) {
			return c.json({ error: "Invalid credentials" }, 401);
		}

		// Create session
		await createSession(c, user.id as number);

		return c.json({
			user: {
				id: user.id,
				username: user.username,
				role: user.role,
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		return c.json({ error: "Login failed" }, 500);
	}
});

app.post("/api/auth/logout", async (c) => {
	try {
		const sessionToken = getCookie(c, "session_token");

		if (sessionToken) {
			// Delete session from database
			await c.env.bookclub_db
				.prepare("DELETE FROM sessions WHERE session_token = ?")
				.bind(sessionToken)
				.run();
		}

		// Delete cookie
		deleteCookie(c, "session_token", { path: "/" });

		return c.json({ success: true });
	} catch (error) {
		console.error("Logout error:", error);
		return c.json({ error: "Logout failed" }, 500);
	}
});

app.get("/api/auth/me", async (c) => {
	try {
		const sessionToken = getCookie(c, "session_token");

		if (!sessionToken) {
			return c.json({ user: null });
		}

		const user = await getUserFromSession(c.env.bookclub_db, sessionToken);

		if (!user) {
			// Invalid or expired session
			deleteCookie(c, "session_token", { path: "/" });
			return c.json({ user: null });
		}

		return c.json({ user });
	} catch (error) {
		console.error("Auth check error:", error);
		return c.json({ user: null });
	}
});

// Users API Routes
app.get("/api/users", async (c) => {
	try {
		const usersResult = await c.env.bookclub_db
			.prepare("SELECT id, username FROM users ORDER BY username ASC")
			.all();

		const users = (usersResult.results || []) as Array<{ id: number; username: string }>;
		const mappedUsers = users.map(u => ({ id: u.id, name: u.username, email: u.username }));

		return c.json({ users: mappedUsers });
	} catch (error) {
		console.error("Fetch users error:", error);
		return c.json({ error: "Failed to fetch users" }, 500);
	}
});

// Check if book work key already exists
app.get("/api/books/check-work", async (c) => {
	try {
		const workKey = c.req.query("workKey");
		
		if (!workKey) {
			return c.json({ exists: false, type: null, suggestedBy: null });
		}

		// Check if book exists in books table (already read/scheduled)
		const bookResult = await c.env.bookclub_db
			.prepare("SELECT id, status FROM books WHERE work_key = ? LIMIT 1")
			.bind(workKey)
			.first();

		if (bookResult) {
			return c.json({ exists: true, type: 'scheduled', suggestedBy: null });
		}

		// Check if book exists in book_suggestions table (pending)
		const suggestionResult = await c.env.bookclub_db
			.prepare(`
				SELECT bs.id, bs.status, u.username 
				FROM book_suggestions bs
				JOIN users u ON bs.user_id = u.id
				WHERE bs.work_key = ? AND bs.status = 'pending'
				LIMIT 1
			`)
			.bind(workKey)
			.first<{ id: number; status: string; username: string }>();

		if (suggestionResult) {
			return c.json({ 
				exists: true, 
				type: 'suggested', 
				suggestedBy: suggestionResult.username 
			});
		}

		return c.json({ exists: false, type: null, suggestedBy: null });
	} catch (error) {
		console.error("Check work key error:", error);
		return c.json({ exists: false, type: null, suggestedBy: null });
	}
});

// Books API Routes
app.get("/api/books", async (c) => {
	try {
		// Get all books
		const booksResult = await c.env.bookclub_db
			.prepare("SELECT id, title, author, description, cover_url, status, read_on, suggested_by FROM books ORDER BY read_on asc")
			.all();
		const books = booksResult.results || [];

		// Get pending book suggestions
		const suggestionsResult = await c.env.bookclub_db
			.prepare("SELECT id, title, author, description, cover_url, work_key, year, user_id, suggested_month, created_at FROM book_suggestions WHERE status = 'pending' ORDER BY created_at DESC")
			.all();
		const suggestions = suggestionsResult.results || [];

		// Get average ratings for each book
		const ratingsResult = await c.env.bookclub_db
			.prepare("SELECT book_id, AVG(rating) as avg_rating FROM ratings GROUP BY book_id")
			.all();
		const ratings = ratingsResult.results || [];

		// Create a map of book_id -> avg_rating
		const ratingMap = new Map<number, number>();
		(ratings as Array<{ book_id: number; avg_rating: number }>).forEach((r) => {
			ratingMap.set(r.book_id, Math.round(r.avg_rating * 10) / 10); // Round to 1 decimal
		});

		// Get suggester names
		const usersResult = await c.env.bookclub_db
			.prepare("SELECT id, username FROM users")
			.all();
		const users = usersResult.results || [];

		const userMap = new Map<number, string>();
		(users as Array<{ id: number; username: string }>).forEach((u) => {
			userMap.set(u.id, u.username);
		});

		// Add ratings and suggester names to books
		const booksWithRatings = (books as Array<any>).map((book) => ({
			...book,
			rating: ratingMap.get(book.id) || undefined,
			suggestedBy: book.suggested_by ? userMap.get(book.suggested_by) : undefined
		}));

		// Add suggester names to pending suggestions
		const suggestionsWithUsers = (suggestions as Array<any>).map((suggestion) => ({
			...suggestion,
			suggestedBy: userMap.get(suggestion.user_id) || undefined
		}));

		return c.json({ books: booksWithRatings, pendingSuggestions: suggestionsWithUsers });
	} catch (error) {
		console.error("Fetch books error:", error);
		return c.json({ error: "Failed to fetch books" }, 500);
	}
});

// Ratings API Routes
app.get("/api/ratings/:userId/:bookId", async (c) => {
	try {
		const userId = c.req.param("userId");
		const bookId = c.req.param("bookId");

		const rating = await c.env.bookclub_db
			.prepare("SELECT rating FROM ratings WHERE user_id = ? AND book_id = ?")
			.bind(userId, bookId)
			.first();

		return c.json({ rating: rating ? rating.rating : null });
	} catch (error) {
		console.error("Fetch rating error:", error);
		return c.json({ error: "Failed to fetch rating" }, 500);
	}
});

app.post("/api/ratings", async (c) => {
	try {
		const body = await c.req.json() as {
			userId?: number;
			bookId?: number;
			rating?: number;
		};

		const { userId, bookId, rating } = body;

		if (!userId || !bookId || rating === undefined) {
			return c.json({ error: "Missing required fields" }, 400);
		}

		if (rating < 0 || rating > 10) {
			return c.json({ error: "Rating must be between 0 and 10" }, 400);
		}

		// Insert or update rating
		await c.env.bookclub_db
			.prepare("INSERT INTO ratings (user_id, book_id, rating) VALUES (?, ?, ?) ON CONFLICT(user_id, book_id) DO UPDATE SET rating = ?, updated_at = CURRENT_TIMESTAMP")
			.bind(userId, bookId, rating, rating)
			.run();

		return c.json({ success: true });
	} catch (error) {
		console.error("Submit rating error:", error);
		return c.json({ error: "Failed to submit rating" }, 500);
	}
});

// Availability API Routes
app.get("/api/availability/:bookId", async (c) => {
	try {
		const bookId = c.req.param("bookId");

		// Get all meeting dates for this book with vote counts
		const { results } = await c.env.bookclub_db
			.prepare(`
				SELECT 
					md.id,
					md.proposed_date,
					COUNT(mv.id) as vote_count
				FROM meeting_dates md
				LEFT JOIN meeting_votes mv ON md.id = mv.meeting_date_id
				WHERE md.book_id = ?
				GROUP BY md.id, md.proposed_date
				ORDER BY md.proposed_date
			`)
			.bind(bookId)
			.all();

		return c.json({ dates: results });
	} catch (error) {
		console.error("Fetch availability error:", error);
		return c.json({ error: "Failed to fetch availability" }, 500);
	}
});

app.get("/api/availability/:bookId/details", async (c) => {
	try {
		const bookId = c.req.param("bookId");

		// Get all meeting dates for this book with users who voted
		const { results } = await c.env.bookclub_db
			.prepare(`
				SELECT 
					md.proposed_date,
					u.id as user_id,
					u.username
				FROM meeting_dates md
				LEFT JOIN meeting_votes mv ON md.id = mv.meeting_date_id
				LEFT JOIN users u ON mv.user_id = u.id
				WHERE md.book_id = ?
				ORDER BY md.proposed_date, u.username
			`)
			.bind(bookId)
			.all();

		// Group users by date
		const dateMap = new Map<string, Array<{ id: number; username: string }>>();
		
		for (const row of results as any[]) {
			if (!dateMap.has(row.proposed_date)) {
				dateMap.set(row.proposed_date, []);
			}
			// Only add user if they exist (not null from LEFT JOIN)
			if (row.user_id && row.username) {
				dateMap.get(row.proposed_date)!.push({
					id: row.user_id,
					username: row.username
				});
			}
		}

		// Convert map to array format
		const dates = Array.from(dateMap.entries()).map(([proposed_date, users]) => ({
			proposed_date,
			users
		}));

		return c.json({ dates });
	} catch (error) {
		console.error("Fetch availability details error:", error);
		return c.json({ error: "Failed to fetch availability details" }, 500);
	}
});

app.get("/api/availability/:bookId/user/:userId", async (c) => {
	try {
		const bookId = c.req.param("bookId");
		const userId = c.req.param("userId");

		// Get user's votes for this book
		const { results } = await c.env.bookclub_db
			.prepare(`
				SELECT md.proposed_date
				FROM meeting_votes mv
				JOIN meeting_dates md ON mv.meeting_date_id = md.id
				WHERE md.book_id = ? AND mv.user_id = ?
			`)
			.bind(bookId, userId)
			.all();

		return c.json({ dates: results.map((r: any) => r.proposed_date) });
	} catch (error) {
		console.error("Fetch user availability error:", error);
		return c.json({ error: "Failed to fetch user availability" }, 500);
	}
});

app.post("/api/availability", async (c) => {
	try {
		const body = await c.req.json() as {
			userId?: number;
			bookId?: number;
			dates?: string[];
		};

		const { userId, bookId, dates } = body;

		if (!userId || !bookId || !Array.isArray(dates)) {
			return c.json({ error: "Missing required fields" }, 400);
		}

		// First, delete existing votes for this user and book
		await c.env.bookclub_db
			.prepare(`
				DELETE FROM meeting_votes 
				WHERE user_id = ? AND meeting_date_id IN (
					SELECT id FROM meeting_dates WHERE book_id = ?
				)
			`)
			.bind(userId, bookId)
			.run();

		// Then insert new votes
		for (const date of dates) {
			// Get or create meeting date
			let meetingDate = await c.env.bookclub_db
				.prepare("SELECT id FROM meeting_dates WHERE book_id = ? AND proposed_date = ?")
				.bind(bookId, date)
				.first();

			if (!meetingDate) {
				const result = await c.env.bookclub_db
					.prepare("INSERT INTO meeting_dates (book_id, proposed_date, status) VALUES (?, ?, 'proposed')")
					.bind(bookId, date)
					.run();
				meetingDate = { id: result.meta.last_row_id };
			}

			// Insert vote
			await c.env.bookclub_db
				.prepare("INSERT INTO meeting_votes (meeting_date_id, user_id, vote) VALUES (?, ?, 'yes')")
				.bind(meetingDate.id, userId)
				.run();
		}

		return c.json({ success: true });
	} catch (error) {
		console.error("Submit availability error:", error);
		return c.json({ error: "Failed to submit availability" }, 500);
	}
});

// Update book schedule endpoint (admin only)
// Delete book endpoint (admin only)
app.delete("/api/books/:bookId", async (c) => {
	try {
		const sessionToken = getCookie(c, "session_token");
		if (!sessionToken) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		// Verify session and check admin role
		const session = await c.env.bookclub_db
			.prepare(`
				SELECT u.id, u.role 
				FROM sessions s
				JOIN users u ON s.user_id = u.id
				WHERE s.session_token = ? AND s.expires_at > datetime('now')
			`)
			.bind(sessionToken)
			.first<{ id: number; role: string }>();

		if (!session) {
			return c.json({ error: "Invalid or expired session" }, 401);
		}

		if (session.role !== 'admin') {
			return c.json({ error: "Admin access required" }, 403);
		}

		const bookId = c.req.param("bookId");

		// Delete the book
		await c.env.bookclub_db
			.prepare("DELETE FROM books WHERE id = ?")
			.bind(bookId)
			.run();

		return c.json({ success: true });
	} catch (error) {
		console.error("Delete book error:", error);
		return c.json({ error: "Failed to delete book" }, 500);
	}
});

// Mark book as read (admin only)
app.put("/api/books/:bookId/mark-read", async (c) => {
	try {
		const sessionToken = getCookie(c, "session_token");
		if (!sessionToken) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		// Verify session and check admin role
		const session = await c.env.bookclub_db
			.prepare(`
				SELECT u.id, u.role 
				FROM sessions s
				JOIN users u ON s.user_id = u.id
				WHERE s.session_token = ? AND s.expires_at > datetime('now')
			`)
			.bind(sessionToken)
			.first<{ id: number; role: string }>();

		if (!session) {
			return c.json({ error: "Invalid or expired session" }, 401);
		}

		if (session.role !== 'admin') {
			return c.json({ error: "Admin access required" }, 403);
		}

		const bookId = c.req.param("bookId");

		// Update book status to 'read'
		await c.env.bookclub_db
			.prepare("UPDATE books SET status = 'read' WHERE id = ?")
			.bind(bookId)
			.run();

		return c.json({ success: true });
	} catch (error) {
		console.error("Mark book as read error:", error);
		return c.json({ error: "Failed to mark book as read" }, 500);
	}
});

app.put("/api/books/:bookId/schedule", async (c) => {
	try {
		const sessionToken = getCookie(c, "session_token");
		if (!sessionToken) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		// Verify session and check admin role
		const session = await c.env.bookclub_db
			.prepare(`
				SELECT u.id, u.role 
				FROM sessions s
				JOIN users u ON s.user_id = u.id
				WHERE s.session_token = ? AND s.expires_at > datetime('now')
			`)
			.bind(sessionToken)
			.first<{ id: number; role: string }>();

		if (!session) {
			return c.json({ error: "Invalid or expired session" }, 401);
		}

		if (session.role !== 'admin') {
			return c.json({ error: "Admin access required" }, 403);
		}

		const bookId = c.req.param("bookId");
		const body = await c.req.json() as { scheduledDate?: string };
		const { scheduledDate } = body;

		if (!scheduledDate) {
			return c.json({ error: "Scheduled date is required" }, 400);
		}

		// Validate date format (YYYY-MM or YYYY-MM-DD)
		if (!/^\d{4}-\d{2}(-\d{2})?$/.test(scheduledDate)) {
			return c.json({ error: "Invalid date format. Use YYYY-MM or YYYY-MM-DD" }, 400);
		}

		// Update the book's read_on field
		await c.env.bookclub_db
			.prepare("UPDATE books SET read_on = ? WHERE id = ?")
			.bind(scheduledDate, bookId)
			.run();

		return c.json({ success: true });
	} catch (error) {
		console.error("Update book schedule error:", error);
		return c.json({ error: "Failed to update book schedule" }, 500);
	}
});

// Book suggestion endpoint
// Delete book suggestion (admin only)
app.delete("/api/book-suggestions/:suggestionId", async (c) => {
	try {
		const sessionToken = getCookie(c, "session_token");
		if (!sessionToken) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		// Verify session and check admin role
		const session = await c.env.bookclub_db
			.prepare(`
				SELECT u.id, u.role 
				FROM sessions s
				JOIN users u ON s.user_id = u.id
				WHERE s.session_token = ? AND s.expires_at > datetime('now')
			`)
			.bind(sessionToken)
			.first<{ id: number; role: string }>();

		if (!session) {
			return c.json({ error: "Invalid or expired session" }, 401);
		}

		if (session.role !== 'admin') {
			return c.json({ error: "Admin access required" }, 403);
		}

		const suggestionId = c.req.param("suggestionId");

		// Delete the suggestion
		await c.env.bookclub_db
			.prepare("DELETE FROM book_suggestions WHERE id = ?")
			.bind(suggestionId)
			.run();

		return c.json({ success: true });
	} catch (error) {
		console.error("Delete book suggestion error:", error);
		return c.json({ error: "Failed to delete book suggestion" }, 500);
	}
});

// Approve book suggestion and schedule it (admin only)
app.post("/api/book-suggestions/:suggestionId/approve", async (c) => {
	try {
		const sessionToken = getCookie(c, "session_token");
		if (!sessionToken) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		// Verify session and check admin role
		const session = await c.env.bookclub_db
			.prepare(`
				SELECT u.id, u.role 
				FROM sessions s
				JOIN users u ON s.user_id = u.id
				WHERE s.session_token = ? AND s.expires_at > datetime('now')
			`)
			.bind(sessionToken)
			.first<{ id: number; role: string }>();

		if (!session) {
			return c.json({ error: "Invalid or expired session" }, 401);
		}

		if (session.role !== 'admin') {
			return c.json({ error: "Admin access required" }, 403);
		}

		const suggestionId = c.req.param("suggestionId");
		const body = await c.req.json() as { scheduledDate?: string };
		const { scheduledDate } = body;

		if (!scheduledDate) {
			return c.json({ error: "Scheduled date is required" }, 400);
		}

		// Validate date format (YYYY-MM or YYYY-MM-DD)
		if (!/^\d{4}-\d{2}(-\d{2})?$/.test(scheduledDate)) {
			return c.json({ error: "Invalid date format. Use YYYY-MM or YYYY-MM-DD" }, 400);
		}

		// Get suggestion details
		const suggestion = await c.env.bookclub_db
			.prepare("SELECT * FROM book_suggestions WHERE id = ?")
			.bind(suggestionId)
			.first<{
				id: number;
				user_id: number;
				title: string;
				author?: string;
				description?: string;
				cover_url?: string;
				work_key?: string;
				year?: number;
				status: string;
			}>();

		if (!suggestion) {
			return c.json({ error: "Suggestion not found" }, 404);
		}

		if (suggestion.status !== 'pending') {
			return c.json({ error: "Suggestion is not pending" }, 400);
		}

		// Add book to books table
		const bookResult = await c.env.bookclub_db
			.prepare(
				`INSERT INTO books 
				(title, author, cover_url, work_key, description, status, read_on, suggested_by) 
				VALUES (?, ?, ?, ?, ?, 'unread', ?, ?)`
			)
			.bind(
				suggestion.title,
				suggestion.author || null,
				suggestion.cover_url || null,
				suggestion.work_key || null,
				suggestion.description || null,
				scheduledDate,
				suggestion.user_id
			)
			.run();

		// Update suggestion status to approved
		await c.env.bookclub_db
			.prepare("UPDATE book_suggestions SET status = 'approved' WHERE id = ?")
			.bind(suggestionId)
			.run();

		return c.json({ 
			success: true, 
			bookId: bookResult.meta.last_row_id 
		});
	} catch (error) {
		console.error("Approve book suggestion error:", error);
		return c.json({ error: "Failed to approve book suggestion" }, 500);
	}
});

app.post("/api/book-suggestions", async (c) => {
	try {
		const sessionToken = getCookie(c, "session_token");
		if (!sessionToken) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		// Verify session
		const session = await c.env.bookclub_db
			.prepare("SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > datetime('now')")
			.bind(sessionToken)
			.first<{ user_id: number }>();

		if (!session) {
			return c.json({ error: "Invalid or expired session" }, 401);
		}

		const body = await c.req.json() as {
			title?: string;
			author?: string;
			coverUrl?: string;
			workKey?: string;
			year?: number;
			description?: string;
			suggestedMonth?: string;
			suggestedByUserId?: number;
		};

		const { title, author, coverUrl, workKey, year, description, suggestedMonth, suggestedByUserId } = body;

		// Validation - title is required, scheduling is optional
		if (!title) {
			return c.json({ error: "Title is required" }, 400);
		}

		// If scheduling info provided, validate it
		if (suggestedMonth) {
			// Validate month format (YYYY-MM)
			if (!/^\d{4}-\d{2}$/.test(suggestedMonth)) {
				return c.json({ error: "Invalid month format. Use YYYY-MM" }, 400);
			}
			if (!suggestedByUserId) {
				return c.json({ error: "Suggested user is required when month is provided" }, 400);
			}
		}

		// Use current user as suggester if not provided (for non-admins)
		const finalSuggestedBy = suggestedByUserId || session.user_id;
		const finalSuggestedMonth = suggestedMonth || 'TBD';

		// Insert book suggestion as pending (requires approval)
		const suggestionResult = await c.env.bookclub_db
			.prepare(
				`INSERT INTO book_suggestions 
				(user_id, title, author, cover_url, work_key, description, year, suggested_month, status) 
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
			)
			.bind(finalSuggestedBy, title, author || null, coverUrl || null, workKey || null, description || null, year || null, finalSuggestedMonth)
			.run();

		// Note: Book will be added to books table only after admin approval
		// Approval UI and logic will be implemented later

		return c.json({ 
			success: true, 
			suggestionId: suggestionResult.meta.last_row_id
		});
	} catch (error) {
		console.error("Submit book suggestion error:", error);
		return c.json({ error: "Failed to submit book suggestion" }, 500);
	}
});

// Add more routes here

app.get("*", (c) => {
	const requestHandler = createRequestHandler(
		() => import("virtual:react-router/server-build"),
		import.meta.env.MODE,
	);

	return requestHandler(c.req.raw, {
		cloudflare: { env: c.env, ctx: c.executionCtx },
	});
});

export default app;
