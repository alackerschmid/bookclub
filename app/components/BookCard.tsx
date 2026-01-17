import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { useNavigate, useRevalidator } from "react-router";
import { formatMonthYear, getDaysInMonth } from "../lib/dateUtils";
import { RatingModal } from "./RatingModal";
import { AvailabilityCalendar } from "./AvailabilityCalendar";

interface BookCardProps {
	title: string;
	author: string;
	description: string;
	coverUrl: string;
	rating?: number; // For previously read books (0-10)
	date?: string; // For future books
	isPreviouslyRead: boolean;
	isNextUpcoming?: boolean; // True only for the next upcoming book
	bookId: number;
	suggestedBy?: string; // Name of user who suggested the book
}

export function BookCard({
	title,
	author,
	description,
	coverUrl,
	rating,
	date,
	isPreviouslyRead,
	isNextUpcoming = false,
	bookId,
	suggestedBy,
}: BookCardProps) {
	const { user } = useAuth();
	const navigate = useNavigate();
	const revalidator = useRevalidator();
	const [showVoting, setShowVoting] = useState(false);
	const [userRating, setUserRating] = useState(5);
	const [hasUserRated, setHasUserRated] = useState(false);
	const [showAvailability, setShowAvailability] = useState(false);
	const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
	const [initialSelectedDays, setInitialSelectedDays] = useState<Set<number>>(new Set());
	const [availabilityCounts, setAvailabilityCounts] = useState<{ [day: number]: number }>({});
	const [availabilityUsers, setAvailabilityUsers] = useState<{ [day: number]: string[] }>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isEditingSchedule, setIsEditingSchedule] = useState(false);
	const [editDate, setEditDate] = useState("");

	const isAdmin = user?.role === 'admin';

	// Parse current date for editing
	const currentMonth = date && date !== "TBD" ? date.split("-")[1] : "";
	const currentYear = date && date !== "TBD" ? date.split("-")[0] : "";

	// Fetch user's existing rating on mount
	useEffect(() => {
		if (user && isPreviouslyRead) {
			fetch(`/api/ratings/${user.id}/${bookId}`)
				.then(res => {
					if (!res.ok) throw new Error("Failed to fetch rating");
					return res.json() as Promise<{ rating: number | null }>;
				})
				.then((data: { rating: number | null }) => {
					if (data.rating !== null) {
						setHasUserRated(true);
						setUserRating(data.rating);
					}
				})
				.catch(err => console.error("Failed to fetch user rating:", err));
		}
	}, [user, isPreviouslyRead, bookId]);

	// Fetch availability data for future books
	useEffect(() => {
		if (!isPreviouslyRead && date && date !== "TBD") {
			const [year, month] = date.split("-");

			// Fetch all votes for this book with user details
			fetch(`/api/availability/${bookId}/details`)
				.then(res => {
					if (!res.ok) throw new Error("Failed to fetch availability");
					return res.json() as Promise<{ dates: Array<{ proposed_date: string; users: Array<{ id: number; username: string }> }> }>;
				})
				.then((data: { dates: Array<{ proposed_date: string; users: Array<{ id: number; username: string }> }> }) => {
					const counts: { [day: number]: number } = {};
					const users: { [day: number]: string[] } = {};
					data.dates.forEach((d: any) => {
						const dateObj = new Date(d.proposed_date);
						// Extract day of month from the date
						if (dateObj.getFullYear() === parseInt(year) && dateObj.getMonth() === parseInt(month) - 1) {
							const dayOfMonth = dateObj.getDate();
							counts[dayOfMonth] = d.users.length;
							users[dayOfMonth] = d.users.map((u: any) => u.username);
						}
					});
					setAvailabilityCounts(counts);
					setAvailabilityUsers(users);
				})
				.catch(err => console.error("Failed to fetch availability:", err));

			// Fetch user's selected dates if logged in
			if (user) {
				fetch(`/api/availability/${bookId}/user/${user.id}`)
					.then(res => {
						if (!res.ok) throw new Error("Failed to fetch user availability");
						return res.json() as Promise<{ dates: string[] }>;
					})
					.then((data: { dates: string[] }) => {
						const selected = new Set<number>();
						data.dates.forEach((dateStr: string) => {
							const dateObj = new Date(dateStr);
							// Extract day of month from the date
							if (dateObj.getFullYear() === parseInt(year) && dateObj.getMonth() === parseInt(month) - 1) {
								const dayOfMonth = dateObj.getDate();
								selected.add(dayOfMonth);
							}
						});
						setSelectedDays(selected);					setInitialSelectedDays(new Set(selected));					})
					.catch(err => console.error("Failed to fetch user availability:", err));
			}
		}
	}, [isPreviouslyRead, date, bookId, user]);

	const handleVoteClick = () => {
		if (!user) {
			navigate("/login");
			return;
		}
		setShowVoting(true);
	};

	const handleSubmitRating = async () => {
		if (!user) return;
		
		setIsSubmitting(true);
		try {
			const response = await fetch("/api/ratings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: user.id,
					bookId: bookId,
					rating: userRating,
				}),
			});

			if (response.ok) {
				setHasUserRated(true);
				setShowVoting(false);
				revalidator.revalidate(); // Refresh data to show updated rating
			} else {
				const data = await response.json() as { error?: string };
				console.error("Failed to submit rating:", data.error);
				alert("Failed to submit rating. Please try again.");
			}
		} catch (error) {
			console.error("Submit rating error:", error);
			alert("Failed to submit rating. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const toggleDay = (day: number) => {
		const newSelected = new Set(selectedDays);
		if (newSelected.has(day)) {
			newSelected.delete(day);
		} else {
			newSelected.add(day);
		}
		setSelectedDays(newSelected);
	};

	const handleMarkAsRead = async () => {
		if (!isAdmin) return;
		if (!confirm("Mark this book as read? This will move it to the 'Previously Read' section.")) {
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/books/${bookId}/mark-read`, {
				method: "PUT",
			});

			if (response.ok) {
				revalidator.revalidate();
			} else {
				const data = await response.json() as { error?: string };
				console.error("Failed to mark as read:", data.error);
				alert("Failed to mark book as read. Please try again.");
			}
		} catch (error) {
			console.error("Mark as read error:", error);
			alert("Failed to mark book as read. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteBook = async () => {
		if (!isAdmin) return;
		if (!confirm("Are you sure you want to delete this book? This action cannot be undone.")) {
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/books/${bookId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				revalidator.revalidate();
			} else {
				const data = await response.json() as { error?: string };
				console.error("Failed to delete book:", data.error);
				alert("Failed to delete book. Please try again.");
			}
		} catch (error) {
			console.error("Delete book error:", error);
			alert("Failed to delete book. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleUpdateSchedule = async () => {
		if (!isAdmin || !editDate) return;

		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/books/${bookId}/schedule`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ scheduledDate: editDate }),
			});

			if (response.ok) {
				setIsEditingSchedule(false);
				revalidator.revalidate(); // Refresh the timeline
			} else {
				const data = await response.json() as { error?: string };
				console.error("Failed to update schedule:", data.error);
				alert("Failed to update schedule. Please try again.");
			}
		} catch (error) {
			console.error("Update schedule error:", error);
			alert("Failed to update schedule. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSubmitAvailability = async () => {
		if (!user || !date || date === "TBD") return;

		setIsSubmitting(true);
		try {
			const [year, month] = date.split("-");
			const selectedDates = Array.from(selectedDays).map(day => {
				// Create date string in YYYY-MM-DD format without timezone conversion
				const paddedMonth = month.padStart(2, '0');
				const paddedDay = String(day).padStart(2, '0');
				return `${year}-${paddedMonth}-${paddedDay}`;
			});

			const response = await fetch("/api/availability", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: user.id,
					bookId: bookId,
					dates: selectedDates,
				}),
			});

			if (response.ok) {
				setShowAvailability(false);
				// Refresh availability data
				revalidator.revalidate();
			} else {
				const data = await response.json() as { error?: string };
				console.error("Failed to submit availability:", data.error);
				alert("Failed to submit availability. Please try again.");
			}
		} catch (error) {
			console.error("Submit availability error:", error);
			alert("Failed to submit availability. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const getDayCount = (day: number) => {
		const userSelected = selectedDays.has(day);
		const wasInitiallySelected = initialSelectedDays.has(day);
		const dbCount = availabilityCounts[day] || 0;
		
		// Adjust count based on user's vote changes
		// DB count already includes user's vote if they voted
		let totalCount = dbCount;
		if (!wasInitiallySelected && userSelected) {
			// User is adding a new vote
			totalCount = dbCount + 1;
		} else if (wasInitiallySelected && !userSelected) {
			// User is removing their vote
			totalCount = Math.max(0, dbCount - 1);
		}
		// If wasInitiallySelected && userSelected: no change, use dbCount as-is
		
		return { userSelected, othersCount: dbCount, totalCount };
	};

	// Find the max vote count for highlighting
	const getMaxVoteCount = () => {
		const daysInMonth = date ? getDaysInMonth(date) : 28;
		let max = 0;
		for (let day = 1; day <= daysInMonth; day++) {
			const { totalCount } = getDayCount(day);
			if (totalCount > max) {
				max = totalCount;
			}
		}
		return max;
	};

	return (
		<div 
			className="relative overflow-hidden min-h-[400px] flex flex-col justify-between border-4 border-black dark:border-white"
			style={{
				backgroundImage: `url(${coverUrl})`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
			}}
		>
			{/* Dark overlay gradient */}
		<div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 dark:from-black/80 dark:via-black/60 to-transparent" />
			{/* Content with semi-transparent background */}
			<div className="relative z-10 space-y-4 p-6">
				{/* Title bar */}
				<div className="dark:bg-white bg-black p-4">
					<h3 className="font-bold text-2xl tracking-tight dark:text-black text-white">
						{title}
					</h3>
					<p className="mt-2 dark:text-neutral-700 text-neutral-100 font-light text-base tracking-wide">
						{author}
					</p>
					{suggestedBy && (
						<p className="dark:text-neutral-600 text-white text-xs tracking-widest mt-3 pt-3 border-t dark:border-neutral-300 border-white lowercase">
							Suggested by {suggestedBy}
						</p>
					)}
				</div>

				{/* Description bar */}
			<div className="bg-white dark:bg-black/80 p-4 border-2 dark:border-white/30 border-white">
				<p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed">
						{description && description.length > 300 
							? description.slice(0, 300) + '...' 
							: description}
					</p>
				</div>

				{/* Rating or Date bar */}
			<div className={`p-4 bg-white dark:bg-black/80 border-2 dark:border-white/30 border-white
				`}>
					{isPreviouslyRead ? (
						<>
							{!showVoting ? (
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<div className="flex items-top gap-2">
											<span className="text-sm font-medium tracking-wider lowercase dark:text-white/80 text-black">
												Total rating
											</span>
											<span className="text-sm font-bold">
												{rating !== undefined ? (
													<>
														<span className="text-bookclub-orange">{rating}</span>
														<span className="dark:text-white text-black">/10</span>
													</>
												) : (
													<span className="dark:text-white text-black lowercase">No ratings yet</span>
												)}
											</span>
										</div>
										{hasUserRated && (
											<div className="flex items-top gap-2">
											<span className="text-sm font-medium tracking-wider lowercase text-black/80 dark:text-white/80">
												Your rating
											</span>
										<span className="text-sm font-bold">
											{rating !== undefined ? (
												<>
													<span className="text-bookclub-yellow">{rating}</span>
													<span className="text-black dark:text-white">/10</span>
												</>
											) : (
												<span className="text-black dark:text-white lowercase">Not yet rated</span>
												)}
											</span>
											</div>
										)}
									</div>
									{rating !== undefined && (
									<div className="w-full h-2 bg-black dark:bg-white">
											<div 
												className="h-full bg-bookclub-orange"
												style={{ width: `${(rating / 10) * 100}%` }}
											/>
										</div>
									)}
									<button
									onClick={handleVoteClick}
								disabled={!user}
								className="w-full py-2 bg-black dark:bg-white hover:bg-bookclub-yellow disabled:bg-neutral-500 disabled:cursor-not-allowed text-white dark:text-black disabled:text-neutral-700 text-xs font-bold tracking-wider lowercase transition-colors"
								>
									{hasUserRated ? "Update your rating" : "Vote on rating"}
									</button>
								</div>
							) : (
								<RatingModal
									isOpen={showVoting}
									rating={userRating}
									isSubmitting={isSubmitting}
									onRatingChange={setUserRating}
									onSubmit={handleSubmitRating}
									onCancel={() => setShowVoting(false)}
								/>
							)}
						</>
					) : date ? (
						<>
							{!showAvailability ? (
								<div className="space-y-3">
									{!isEditingSchedule ? (
										<>
											<div className="flex items-center gap-3">
											<span className="text-sm tracking-wider lowercase text-black dark:text-white">
													Scheduled
												</span>
												<span className="text-sm font-bold text-bookclub-blue lowercase">
													{formatMonthYear(date)}
												</span>
											</div>
											<div className="flex gap-2">
												{isNextUpcoming && (
													<button
														onClick={() => setShowAvailability(true)}
														disabled={!user}
														className="flex-1 py-2 dark:bg-white bg-black hover:bg-bookclub-yellow disabled:bg-neutral-500 disabled:cursor-not-allowed dark:text-black text-white disabled:text-neutral-700 text-xs font-bold tracking-wider lowercase transition-colors"
													>
														Select Availability
													</button>
												)}
												{isAdmin && (
													<>
														<button
															onClick={() => {
																// Set date to first day of current month or today
																const initialDate = date !== "TBD" ? `${currentYear}-${currentMonth}-01` : new Date().toISOString().split('T')[0];
																setEditDate(initialDate);
																setIsEditingSchedule(true);
															}}
															className="flex-1 py-2 dark:bg-white bg-black hover:bg-neutral-200 dark:hover:bg-neutral-200 dark:text-black text-white text-xs font-bold tracking-wider lowercase transition-colors"
														>
															Change Schedule
														</button>

													</>
												)}
											</div>
										</>
									) : (
									<div className="space-y-3 bg-white/95 dark:bg-black/95 -m-4 p-4">
										<div className="text-xs font-medium tracking-wider lowercase text-black dark:text-white text-center mb-2">
											Change Scheduled Date
										</div>
										<input
											type="date"
											value={editDate}
											onChange={(e) => setEditDate(e.target.value)}
											className="w-full px-3 py-2 bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white text-sm focus:outline-none focus:border-bookclub-blue"
											/>
											<div className="flex gap-2">
												<button
													onClick={handleUpdateSchedule}
													disabled={isSubmitting || !editDate}
												className="flex-1 py-2 bg-black dark:bg-white hover:bg-bookclub-blue hover:text-white disabled:bg-neutral-400 disabled:cursor-not-allowed text-white dark:text-black text-xs font-bold tracking-wider lowercase transition-colors"
											>
												{isSubmitting ? "Saving..." : "Save"}
											</button>
											<button
												onClick={() => setIsEditingSchedule(false)}
												disabled={isSubmitting}
												className="flex-1 py-2 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-bold tracking-wider lowercase transition-colors"
												>
													Cancel
												</button>
											</div>
										</div>
									)}
								</div>
							) : (
								<AvailabilityCalendar
									date={date}
									selectedDays={selectedDays}
									initialSelectedDays={initialSelectedDays}
									availabilityCounts={availabilityCounts}
									availabilityUsers={availabilityUsers}
									isSubmitting={isSubmitting}
									onDayToggle={toggleDay}
									onSubmit={handleSubmitAvailability}
									onCancel={() => setShowAvailability(false)}
								/>
							)}
						</>
					) : null}
				</div>

				{/* Admin Actions Section */}
				{isAdmin && (
				<div className="bg-white dark:bg-neutral-900/90 p-4 border-2  dark:border-white/20 border-white">
					<div className="text-sm font-medium tracking-wider lowercase text-black dark:text-white/60 mb-3 text-left">
							Admin Actions
						</div>
						<div className="flex gap-2">
							{!isPreviouslyRead && (
								<button
									onClick={handleMarkAsRead}
									disabled={isSubmitting}
								className="flex-1 py-2 bg-black dark:bg-white hover:bg-bookclub-orange disabled:bg-neutral-400 disabled:cursor-not-allowed text-white dark:text-black text-xs font-bold tracking-wider lowercase transition-colors"
							>
								{isSubmitting ? "Marking..." : "Mark as Read"}
							</button>
						)}
						<button
							onClick={handleDeleteBook}
							disabled={isSubmitting}
							className="flex-1 py-2 bg-black dark:bg-white hover:bg-bookclub-red disabled:bg-neutral-400 disabled:cursor-not-allowed text-white dark:text-black text-xs font-bold tracking-wider lowercase transition-colors"
							>
								{isSubmitting ? "Deleting..." : "Delete Book"}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
