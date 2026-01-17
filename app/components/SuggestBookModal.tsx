import { useState, useEffect, useRef } from "react";
import { useDebounce } from "../lib/useDebounce";
import { useAuth } from "../lib/auth";

interface User {
	id: number;
	name: string;
	email: string;
}

interface SuggestBookModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

interface BookResult {
	title: string;
	author?: string;
	coverUrl: string | null;
	year?: number;
	description?: string;
	workKey: string;
}

interface OpenLibraryDoc {
	title: string;
	author_name?: string[];
	cover_i?: number;
	isbn?: string[];
	first_publish_year?: number;
	key?: string;
}

interface OpenLibraryResponse {
	docs: OpenLibraryDoc[];
}

interface OpenLibraryWorkData {
	description?: string | { value: string };
}

export function SuggestBookModal({ isOpen, onClose, onSuccess }: SuggestBookModalProps) {
	const { user } = useAuth();
	const isAdmin = user?.role === 'admin';
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebounce(query, 300);
	const [results, setResults] = useState<BookResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedBook, setSelectedBook] = useState<BookResult | null>(null);
	const [selectedMonth, setSelectedMonth] = useState("");
	const [selectedYear, setSelectedYear] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [users, setUsers] = useState<User[]>([]);
	const [selectedUserId, setSelectedUserId] = useState<string>("");
	const [loadingUsers, setLoadingUsers] = useState(false);
	const [isDuplicate, setIsDuplicate] = useState(false);
	const [duplicateType, setDuplicateType] = useState<'scheduled' | 'suggested' | null>(null);
	const [duplicateMessage, setDuplicateMessage] = useState<string>("");
	const [suggestedBy, setSuggestedBy] = useState<string | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	const months = [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];

	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: 3 }, (_, i) => currentYear + i);

	// Fetch users list on mount
	useEffect(() => {
		if (isOpen) {
			setLoadingUsers(true);
			fetch("/api/users")
				.then(res => {
					if (!res.ok) throw new Error("Failed to fetch users");
					return res.json() as Promise<{ users: User[] }>;
				})
				.then((data: { users: User[] }) => {
					setUsers(data.users);
				})
				.catch(err => console.error("Failed to fetch users:", err))
				.finally(() => setLoadingUsers(false));
		}
	}, [isOpen]);

	// Real-time search effect
	useEffect(() => {
		// Cancel previous request if exists
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		// Clear results if query is too short
		if (debouncedQuery.length < 3) {
			setResults([]);
			return;
		}

		// Start new search
		const controller = new AbortController();
		abortControllerRef.current = controller;

		const searchBooks = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`https://openlibrary.org/search.json?q=${encodeURIComponent(debouncedQuery)}&limit=3`,
					{ signal: controller.signal }
				);

				if (!response.ok) {
					throw new Error("Search failed");
				}

				const data: OpenLibraryResponse = await response.json();
				
			const mappedResults: BookResult[] = data.docs
				.filter((book) => book.key !== undefined)
				.map((book) => {
					return {
						title: book.title,
						author: book.author_name?.[0],
						coverUrl: book.cover_i 
							? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
							: null,
						year: book.first_publish_year,
						workKey: book.key!,
					};
				});

				setResults(mappedResults);
			} catch (error) {
				// Silently ignore AbortError (user is still typing)
				if (error instanceof Error && error.name === "AbortError") {
					return;
				}
				console.error("Search error:", error);
				setResults([]);
			} finally {
				setLoading(false);
			}
		};

		searchBooks();

		// Cleanup function
		return () => {
			controller.abort();
		};
	}, [debouncedQuery]);

	if (!isOpen) return null;

	const handleSelectBook = async (book: BookResult) => {
		// Fetch full book details including description from Open Library work details
		let enrichedBook = { ...book };
		
		if (book.workKey) {
			try {
				const workResponse = await fetch(`https://openlibrary.org${book.workKey}.json`);
				if (workResponse.ok) {
					const workData = await workResponse.json() as OpenLibraryWorkData;
					if (workData.description) {
						const description = typeof workData.description === 'string' 
							? workData.description 
							: workData.description.value;
						enrichedBook = { ...enrichedBook, description };
					}
				}
			} catch (error) {
				console.error('Failed to fetch book description:', error);
			}
		}
		
		// Check if work key already exists in database
		if (enrichedBook.workKey) {
			try {
				const checkResponse = await fetch(`/api/books/check-work?workKey=${encodeURIComponent(enrichedBook.workKey)}`);
				if (checkResponse.ok) {
					const data = await checkResponse.json() as { exists: boolean; type: 'scheduled' | 'suggested' | null; suggestedBy: string | null };
					setIsDuplicate(data.exists);
					setDuplicateType(data.type);
					setSuggestedBy(data.suggestedBy);
					if (data.exists) {
						if (data.type === 'scheduled') {
							setDuplicateMessage("This book has already been read or scheduled!");
						} else if (data.type === 'suggested') {
							setDuplicateMessage(`This book has already been suggested${data.suggestedBy ? ` by ${data.suggestedBy}` : ''}!`);
						}
					} else {
						setDuplicateMessage("");
					}
				}
			} catch (error) {
				console.error('Failed to check work key:', error);
				setIsDuplicate(false);
				setDuplicateType(null);
				setSuggestedBy(null);
				setDuplicateMessage("");
			}
		}
		
		setSelectedBook(enrichedBook);
		setResults([]);
		setQuery("");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedBook) return;

		setIsSubmitting(true);
		try {
			const payload: any = {
				title: selectedBook.title,
				author: selectedBook.author,
				coverUrl: selectedBook.coverUrl,
				workKey: selectedBook.workKey,
				year: selectedBook.year,
				description: selectedBook.description,
			};

			const response = await fetch("/api/book-suggestions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const data = await response.json() as { error?: string };
				throw new Error(data.error || "Failed to submit suggestion");
			}

			// Show success notification
			alert(`"${selectedBook.title}" has been submitted for approval!`);

			// Reset and close on success
			setQuery("");
			setSelectedBook(null);
			setSelectedMonth("");
			setSelectedYear("");
			setSelectedUserId("");
			setIsDuplicate(false);
			
			// Trigger refresh callback
			if (onSuccess) {
				onSuccess();
			}
			
			onClose();
		} catch (error) {
			console.error("Submit error:", error);
			alert(error instanceof Error ? error.message : "Failed to submit book suggestion");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleReset = () => {
		setSelectedBook(null);
		setQuery("");
		setResults([]);
		setSelectedMonth("");
		setSelectedYear("");
		setIsDuplicate(false);
		setDuplicateType(null);
		setSuggestedBy(null);
		setDuplicateMessage("");
	};

	return (
		<div 
			className="fixed inset-0 bg-black/80 flex items-center justify-center px-6 z-50"
			onClick={onClose}
		>
			<div 
				className="w-full max-w-2xl border-4 border-white p-8 bg-black max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Orange geometric accent square */}
				<div className="w-4 h-4 bg-bookclub-orange mb-6" />
				
				<div className="space-y-8">
					{/* Header */}
					<div className="space-y-3">
						<h2 className="font-bold text-5xl tracking-tight text-white lowercase">
							Suggest a Book
						</h2>
						<p className="text-neutral-300 font-light text-sm lowercase">
							Search for a book to suggest for the book club
						</p>
					</div>

					{!selectedBook ? (
						/* Search Interface */
						<div className="space-y-6">
							{/* Search Bar */}
							<div className="space-y-2">
								<label
									htmlFor="search"
									className="block text-xs font-medium tracking-widest text-white lowercase"
								>
									Search Books
								</label>
								<input
									type="text"
									id="search"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="w-full px-4 py-3 bg-transparent border-2 border-neutral-700 text-white focus:outline-none focus:border-bookclub-blue transition-colors"
									placeholder=""
									autoFocus
								/>
								{loading && (
									<p className="text-xs text-neutral-400">Searching...</p>
								)}
								{query.length > 0 && query.length < 3 && (
									<p className="text-xs text-neutral-400">Type at least 3 characters to search</p>
								)}
							</div>

							{/* Search Results */}
							{results.length > 0 && (
								<div className="space-y-2">
									<p className="text-xs font-medium tracking-widest text-white lowercase">
										Search Results ({results.length})
									</p>
									<div className="space-y-2 max-h-60 overflow-y-auto">
										{results.map((book, index) => (
											<button
												key={index}
												onClick={() => handleSelectBook(book)}
												className="w-full p-4 border-2 border-neutral-700 hover:border-bookclub-blue text-left transition-colors flex gap-3"
											>
												{book.coverUrl && (
													<img
														src={book.coverUrl}
														alt={book.title}
														className="w-12 h-16 object-cover shrink-0"
													/>
												)}
												<div className="flex-1 min-w-0">
													<p className="text-white font-medium truncate">{book.title}</p>
													{book.author && (
														<p className="text-neutral-400 text-sm truncate">{book.author}</p>
													)}
													{book.year && (
														<p className="text-neutral-500 text-xs">{book.year}</p>
													)}
												</div>
											</button>
										))}
									</div>
								</div>
							)}
						</div>
					) : (
						/* Selected Book Display */
						<form onSubmit={handleSubmit} className="space-y-8">
							{/* Book Info */}
							<div className="border-2 border-white/30 p-6 space-y-4">
								<div className="flex gap-4">
									{selectedBook.coverUrl && (
										<img
											src={selectedBook.coverUrl}
											alt={selectedBook.title}
											className="w-24 h-32 object-cover"
										/>
									)}
									<div className="flex-1 space-y-2">
										<h3 className="text-white font-bold text-xl">{selectedBook.title}</h3>
										{selectedBook.author && (
											<p className="text-neutral-400">{selectedBook.author}</p>
										)}
										{selectedBook.year && (
											<p className="text-neutral-500 text-sm">First published: {selectedBook.year}</p>
										)}
										{isDuplicate && (
											<div className={`p-1.5 text-black text-sm rounded lowercase ${
												duplicateType === 'scheduled' 
													? 'bg-bookclub-red' 
													: 'bg-bookclub-yellow'
											}`}>
												{duplicateMessage}
											</div>
										)}
									</div>
								</div>
								{selectedBook.description && (
									<div className="pt-4 border-t border-white/20">
										<p className="text-neutral-300 text-sm leading-relaxed">
											{selectedBook.description.length > 500 
												? selectedBook.description.slice(0, 500) + "..." 
												: selectedBook.description}
										</p>
									</div>
								)}
							</div>


						{/* Actions */}
						<div className="flex gap-4">
							<button
								type="submit"
								disabled={isSubmitting || isDuplicate}
								className="flex-1 py-4 bg-bookclub-blue hover:bg-[#006090] disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-medium text-sm tracking-widest lowercase transition-colors"
							>
									{isSubmitting ? "Submitting..." : "Submit Suggestion"}
								</button>
								<button
									type="button"
									onClick={handleReset}
									className="flex-1 py-4 border-2 border-white hover:bg-white hover:text-black text-white font-medium text-sm tracking-widest lowercase transition-colors"
								>
									Change Book
								</button>
							</div>
						</form>
					)}

					{/* Close Button */}
					<button
						onClick={onClose}
						className="w-full py-4 border-2 border-neutral-700 hover:border-white text-neutral-400 hover:text-white font-medium text-sm tracking-widest lowercase transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}
