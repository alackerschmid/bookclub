import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { useNavigate, useRevalidator } from "react-router";

// Helper to format YYYY-MM to "Month YYYY"
function formatMonthYear(monthStr: string): string {
	if (monthStr === "TBD") return "TBD";
	const [year, month] = monthStr.split("-");
	const date = new Date(parseInt(year), parseInt(month) - 1);
	return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Helper to get number of days in a month
function getDaysInMonth(monthStr: string): number {
	if (monthStr === "TBD") return 28;
	const [year, month] = monthStr.split("-");
	return new Date(parseInt(year), parseInt(month), 0).getDate();
}

// Helper to get the first day of the month (0 = Sunday, 6 = Saturday)
function getFirstDayOfMonth(monthStr: string): number {
	if (monthStr === "TBD") return 0;
	const [year, month] = monthStr.split("-");
	return new Date(parseInt(year), parseInt(month) - 1, 1).getDay();
}

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
			className="relative overflow-hidden min-h-[400px] flex flex-col justify-between border-2 border-neutral-400 dark:border-neutral-800"
			style={{
				backgroundImage: `url(${coverUrl})`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
			}}
		>
			{/* Dark overlay gradient */}
			<div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
			
			{/* Content with semi-transparent background */}
			<div className="relative z-10 space-y-4 p-6">
				{/* Title bar */}
				<div className="bg-white p-4">
					<h3 className="font-bold text-2xl tracking-tight text-black">
						{title}
					</h3>
					<p className="mt-2 text-neutral-700 font-light text-base tracking-wide">
						{author}
					</p>
					{suggestedBy && (
						<p className="text-neutral-600 text-xs tracking-widest mt-3 pt-3 border-t border-neutral-300 lowercase">
							Suggested by {suggestedBy}
						</p>
					)}
				</div>

				{/* Description bar */}
				<div className="bg-black/80 p-4 border-2 border-white/30">
					<p className="text-neutral-300 text-sm leading-relaxed">
						{description && description.length > 300 
							? description.slice(0, 300) + '...' 
							: description}
					</p>
				</div>

				{/* Rating or Date bar */}
				<div className={`p-4 bg-black/80 border-2 border-white/30
				`}>
					{isPreviouslyRead ? (
						<>
							{!showVoting ? (
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<div className="flex items-top gap-2">
											<span className="text-sm font-medium tracking-wider lowercase text-white/80">
												Total rating
											</span>
											<span className="text-sm font-bold">
												{rating !== undefined ? (
													<>
														<span className="text-bookclub-orange">{rating}</span>
														<span className="text-white">/10</span>
													</>
												) : (
													<span className="text-white lowercase">No ratings yet</span>
												)}
											</span>
										</div>
										{hasUserRated && (
											<div className="flex items-top gap-2">
												<span className="text-sm font-medium tracking-wider lowercase text-white/80">
													Your rating
												</span>
											<span className="text-sm font-bold">
												{rating !== undefined ? (
													<>
														<span className="text-bookclub-yellow">{rating}</span>
														<span className="text-white">/10</span>
													</>
												) : (
													<span className="text-white lowercase">Not yet rated</span>
												)}
											</span>
											</div>
										)}
									</div>
									{rating !== undefined && (
										<div className="w-full h-2 bg-white">
											<div 
												className="h-full bg-bookclub-orange"
												style={{ width: `${(rating / 10) * 100}%` }}
											/>
										</div>
									)}
									<button
									onClick={handleVoteClick}
								disabled={!user}
								className="w-full py-2 bg-bookclub-yellow hover:bg-[#E5B800] disabled:bg-neutral-500 disabled:cursor-not-allowed text-black disabled:text-neutral-700 text-xs font-bold tracking-wider lowercase transition-colors"
								>
									{hasUserRated ? "Update your rating" : "Vote on rating"}
									</button>
								</div>
							) : (
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-xs font-medium tracking-wider lowercase text-white">
											Your rating
										</span>
										<span className="text-sm font-bold">
											<span className="text-bookclub-orange">{userRating}</span>
											<span className="text-white">/10</span>
										</span>
									</div>
									<input
										type="range"
										min="0"
										max="10"
										step="1"
										value={userRating}
										onChange={(e) => setUserRating(Number(e.target.value))}
										className="w-full h-3 bg-white appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-bookclub-orange [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-bookclub-orange [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
									/>
									<div className="flex gap-2">
										<button
											onClick={handleSubmitRating}
										disabled={isSubmitting}
								className="flex-1 py-2 bg-white hover:bg-[#E5B800] disabled:bg-neutral-400 disabled:cursor-not-allowed text-black text-xs font-bold tracking-wider lowercase transition-colors"
									>
										{isSubmitting ? "Submitting..." : "Submit"}
										</button>
										<button
											onClick={() => setShowVoting(false)}
											className="flex-1 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold tracking-wider lowercase transition-colors"
										>
											Cancel
										</button>
									</div>
								</div>
							)}
						</>
					) : date ? (
						<>
							{!showAvailability ? (
								<div className="space-y-3">
									<div className="flex items-center gap-3">
										<span className="text-sm tracking-wider lowercase text-white">
											Scheduled
										</span>
										<span className="text-sm font-bold text-bookclub-blue lowercase">
											{formatMonthYear(date)}
										</span>
									</div>
									{isNextUpcoming && (
										<button
											onClick={() => setShowAvailability(true)}
										disabled={!user}
								className="w-full py-2 bg-bookclub-yellow hover:bg-[#E5B800] disabled:bg-neutral-500 disabled:cursor-not-allowed text-black disabled:text-neutral-700 text-xs font-bold tracking-wider lowercase transition-colors"
										>
											Select Availability
										</button>
									)}
								</div>
							) : (
								<div className="space-y-3 bg-black/95 -m-4 p-4">
									<div className="text-xs font-medium tracking-wider lowercase text-white text-center mb-2">
										Select Your Available Days in {formatMonthYear(date)}
									</div>
									
									{/* Calendar Grid */}
									<div className="grid grid-cols-7 gap-1">
										{/* Day labels (Monday-Sunday) */}
										{['M', 'D', 'M', 'D', 'F', 'S', 'S'].map((day, i) => (
											<div key={i} className="text-center text-[10px] font-medium text-white pb-1">
												{day}
											</div>
										))}
										
										{/* Days with proper week alignment */}
										{(() => {
											const daysInMonth = getDaysInMonth(date);
											const firstDayOfWeek = getFirstDayOfMonth(date);
											// Convert Sunday-based (0-6) to Monday-based (0-6) where Monday = 0
											const firstDay = (firstDayOfWeek + 6) % 7;
											const cells = [];
											
											// Add empty cells for days before the first of the month
											for (let i = 0; i < firstDay; i++) {
												cells.push(
													<div key={`empty-${i}`} className="aspect-square" />
												);
											}
											
											// Add day buttons
											for (let day = 1; day <= daysInMonth; day++) {
												const { userSelected, totalCount } = getDayCount(day);
												const maxCount = getMaxVoteCount();
												const isMaxVoted = totalCount > 0 && totalCount === maxCount;
												const voters = availabilityUsers[day] || [];
												
												cells.push(
													<button
														key={day}
														onClick={() => toggleDay(day)}
														title={voters.length > 0 ? 'works for: ' + voters.join(', ') : ''}
														className={`aspect-square text-xs relative transition-colors ${
															userSelected
																? 'bg-bookclub-blue hover:bg-[#1D4ED8]'
																: 'bg-neutral-700 hover:bg-neutral-600'
														} ${
															isMaxVoted
																? 'font-bold text-white '
																: 'text-white'
														}`}
													>
														<span>{day}</span>
														{totalCount > 0 && (
															<span className={`absolute top-0 right-0 text-[8px] leading-none p-0.5 font-bold ${
																isMaxVoted
																	? 'text-black bg-bookclub-orange'
																	: 'text-white bg-black/50'
															}`}>
																{totalCount}
															</span>
														)}
													</button>
												);
											}
											
											return cells;
										})()}
									</div>

									<div className="flex gap-2 pt-2">
										<button
											onClick={handleSubmitAvailability}
											className="flex-1 py-2 bg-white hover:bg-[#E5B800] text-black text-xs font-bold tracking-wider lowercase transition-colors"
										>
											Submit
										</button>
										<button
											onClick={() => setShowAvailability(false)}
											className="flex-1 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold tracking-wider lowercase transition-colors"
										>
											Cancel
										</button>
									</div>
								</div>
							)}
						</>
					) : null}
				</div>
			</div>
		</div>
	);
}
