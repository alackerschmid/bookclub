import { useLoaderData, useRevalidator, useNavigate } from "react-router";
import { useState } from "react";
import { BookCard } from "../components/BookCard";
import { SuggestBookModal } from "../components/SuggestBookModal";
import { TimelineCard } from "../components/TimelineCard";
import { ApproveBookModal } from "../components/ApproveBookModal";
import { useAuth } from "../lib/auth";
import type { Book } from "../lib/types";
import type { Route } from "./+types/bookclub";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "book club" },
        { name: "description", content: "what we do in our spare time" },
    ];
}
interface PendingSuggestion {
	id: number;
	title: string;
	author?: string;
	description?: string;
	cover_url: string;
	work_key?: string;
	year?: number;
	user_id: number;
	suggested_month: string;
	created_at: string;
	suggestedBy?: string;
}

interface LoaderData {
	readBooks: Book[];
	futureBooks: Book[];
	pendingSuggestions: PendingSuggestion[];
}

export async function clientLoader() {
	const response = await fetch("/api/books");
	const data = await response.json() as { books?: Book[]; pendingSuggestions?: PendingSuggestion[] };
	const books = data.books || [];
	const pendingSuggestions = data.pendingSuggestions || [];
	
	const readBooks = books.filter((b: Book) => b.status === "read");
	const futureBooks = books.filter((b: Book) => b.status === "unread");
	
	return { readBooks, futureBooks, pendingSuggestions };
}

export default function BookClub() {
	const { readBooks, futureBooks, pendingSuggestions } = useLoaderData<LoaderData>();
	const revalidator = useRevalidator();
	const navigate = useNavigate();
	const { user } = useAuth();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [approveModalOpen, setApproveModalOpen] = useState(false);
	const [selectedSuggestion, setSelectedSuggestion] = useState<PendingSuggestion | null>(null);
	const [scheduleDate, setScheduleDate] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isAdmin = user?.role === 'admin';

	const handleBookSuggested = () => {
		// Revalidate to refresh the book list
		revalidator.revalidate();
	};

	const handleSuggestClick = () => {
		if (!user) {
			navigate("/login");
		} else {
			setIsModalOpen(true);
		}
	};

	const handleDeleteSuggestion = async (suggestionId: number) => {
		if (!confirm("Are you sure you want to delete this suggestion?")) {
			return;
		}

		try {
			const response = await fetch(`/api/book-suggestions/${suggestionId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				revalidator.revalidate();
			} else {
				const data = await response.json() as { error?: string };
				alert(data.error || "Failed to delete suggestion");
			}
		} catch (error) {
			console.error("Delete suggestion error:", error);
			alert("Failed to delete suggestion");
		}
	};

	const handleOpenApproveModal = (suggestion: PendingSuggestion) => {
		setSelectedSuggestion(suggestion);
		// Set default date to current date
		const today = new Date();
		const defaultDate = today.toISOString().split('T')[0];
		setScheduleDate(defaultDate);
		setApproveModalOpen(true);
	};

	const handleApprove = async () => {
		if (!selectedSuggestion || !scheduleDate) return;

		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/book-suggestions/${selectedSuggestion.id}/approve`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ scheduledDate: scheduleDate }),
			});

			if (response.ok) {
				setApproveModalOpen(false);
				setSelectedSuggestion(null);
				revalidator.revalidate();
			} else {
				const data = await response.json() as { error?: string };
				alert(data.error || "Failed to approve suggestion");
			}
		} catch (error) {
			console.error("Approve suggestion error:", error);
			alert("Failed to approve suggestion");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-neutral-50 dark:bg-black">
			<main className="max-w-5xl mx-auto px-6 py-16">
				{/* Intro Section */}
				<div className="mb-16 text-center max-w-2xl mx-auto space-y-6">
					<h1 className="font-bold text-5xl tracking-tight text-neutral-900 dark:text-neutral-100 lowercase">
						Book Club
					</h1>
					<p className="mt-4 text-neutral-600 dark:text-neutral-400 font-light text-lg tracking-wide lowercase">
						What we do in our spare time.
					</p>
					<button
						onClick={handleSuggestClick}
						className="px-6 py-2 bg-bookclub-blue hover:bg-[#006090] text-white font-medium text-sm tracking-widest transition-colors lowercase"
					>
						Suggest Book
					</button>
				</div>

				{/* Timeline Container */}
				<div className="relative">
					{/* Previously Read Books Section */}
					<div className="relative">
						{/* Continuous Orange Timeline */}
						<div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-bookclub-orange transform md:-translate-x-1/2" />

						<div className="space-y-12">
						{readBooks.map((book, index) => {
							const monthYear = book.read_on ? (() => {
								const [year, month] = book.read_on.split("-");
								const date = new Date(parseInt(year), parseInt(month) - 1);
								return date.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toLowerCase();
							})() : "";
							
							return (
								<TimelineCard
									key={book.id}
									index={index}
									badge={
										<span className="relative block px-4 py-1 text-black text-xs font-bold tracking-wider lowercase bg-bookclub-orange whitespace-nowrap">
											READ {monthYear}
										</span>
									}
								>
									<BookCard
										title={book.title}
										author={book.author}
										description={book.description}
										coverUrl={book.cover_url}
										rating={book.rating}
										isPreviouslyRead={true}
										bookId={book.id}
										suggestedBy={book.suggestedBy}
									/>
								</TimelineCard>
							);
						})}
						</div>
					</div>

					{/* Future Books Section */}
					<div className="relative mt-12">
						{/* Continuous Blue Timeline */}
						<div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-bookclub-blue transform md:-translate-x-1/2" />

						<div className="space-y-12">
						{futureBooks.map((book, index) => {
							const isNextUpcoming = index === 0; // Only first future book is "next"
							const monthYear = book.read_on ? (() => {
								const [year, month] = book.read_on.split("-");
								const date = new Date(parseInt(year), parseInt(month) - 1);
								return date.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toLowerCase();
							})() : "";
							
							return (
								<TimelineCard
									key={book.id}
									index={index}
									badge={
										<span className={`relative block px-4 py-1 text-xs font-bold tracking-wider lowercase whitespace-nowrap ${
											isNextUpcoming ? 'text-white bg-bookclub-blue' : 'text-neutral-500 bg-neutral-300 dark:text-neutral-400 dark:bg-neutral-700'
										}`}>
											UPCOMING {monthYear}
										</span>
									}
								>
									<BookCard
										title={book.title}
										author={book.author}
										description={book.description}
										coverUrl={book.cover_url}
										date={book.read_on || "TBD"}
										isPreviouslyRead={false}
										isNextUpcoming={isNextUpcoming}
										bookId={book.id}
										suggestedBy={book.suggestedBy}
									/>
								</TimelineCard>
							);
						})}
						</div>
					</div>

					{/* Pending Suggestions Section */}
					{pendingSuggestions.length > 0 && (
						<div className="relative mt-12">
							{/* Continuous Gray Timeline */}
							<div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-neutral-400 dark:bg-neutral-700 transform md:-translate-x-1/2" />

							<div className="space-y-12">
								{pendingSuggestions.map((suggestion, index) => {
									const suggestedDate = new Date(suggestion.created_at);
									const dateLabel = suggestedDate.toLocaleDateString("en-US", { 
										month: "short", 
										day: "numeric", 
										year: "numeric" 
									}).toLowerCase();
									
									return (
										<TimelineCard
											key={suggestion.id}
											index={index}
											badge={
												<span className="relative block px-4 py-1 text-xs font-bold tracking-wider lowercase whitespace-nowrap text-white bg-neutral-500 dark:bg-neutral-600">
													SUGGESTED {dateLabel}
												</span>
											}
										>
											<div 
												className="relative overflow-hidden min-h-[300px] flex flex-col justify-between border-2 border-neutral-400 dark:border-neutral-700 opacity-75"
												style={{
													backgroundImage: `url(${suggestion.cover_url})`,
													backgroundSize: 'cover',
													backgroundPosition: 'center',
												}}
											>
													{/* Dark overlay gradient */}
													<div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
													
													{/* Content */}
													<div className="relative z-10 space-y-4 p-6">
														{/* Title bar */}
														<div className="bg-white p-4">
															<h3 className="font-bold text-2xl tracking-tight text-black">
																{suggestion.title}
															</h3>
															{suggestion.author && (
																<p className="mt-2 text-neutral-700 font-light text-base tracking-wide">
																	{suggestion.author}
																</p>
															)}
															{suggestion.suggestedBy && (
																<p className="text-neutral-600 text-xs tracking-widest mt-3 pt-3 border-t border-neutral-300 lowercase">
																	Suggested by {suggestion.suggestedBy}
																</p>
															)}
														</div>

														{/* Description bar */}
														{suggestion.description && (
															<div className="bg-black/80 p-4 border-2 border-white/30">
																<p className="text-neutral-300 text-sm leading-relaxed">
																	{suggestion.description && suggestion.description.length > 300 
																		? suggestion.description.slice(0, 300) + '...' 
																		: suggestion.description}
																</p>
															</div>
														)}

														{/* Status bar */}
														<div className="bg-black/80 p-4 border-2 border-white/30">
														<div className="flex items-center justify-between mb-3">
															<span className="text-sm tracking-wider lowercase text-white">
																Status
															</span>
															<span className="text-sm font-bold text-bookclub-yellow lowercase">
																Pending Approval
															</span>
														</div>
														{isAdmin && (
															<div className="flex gap-2">
																<button
																	onClick={() => handleOpenApproveModal(suggestion)}
																	className="flex-1 py-2 bg-bookclub-blue hover:bg-[#0066CC] text-white text-xs font-bold tracking-wider lowercase transition-colors"
																>
																	Approve
																</button>
																<button
																	onClick={() => handleDeleteSuggestion(suggestion.id)}
																	className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold tracking-wider lowercase transition-colors"
																>
																	Delete
																</button>
															</div>
														)}
													</div>
												</div>
											</div>
										</TimelineCard>
									);
									})}
							</div>
						</div>
					)}
				</div>
			</main>

			<SuggestBookModal 
				isOpen={isModalOpen} 
				onClose={() => setIsModalOpen(false)}
				onSuccess={handleBookSuggested}
			/>

			<ApproveBookModal
				isOpen={approveModalOpen && selectedSuggestion !== null}
				bookTitle={selectedSuggestion?.title || ""}
				scheduleDate={scheduleDate}
				isSubmitting={isSubmitting}
				onScheduleDateChange={setScheduleDate}
				onApprove={handleApprove}
				onCancel={() => {
					setApproveModalOpen(false);
					setSelectedSuggestion(null);
				}}
			/>
		</div>
	);
}
