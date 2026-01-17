interface AvailabilityCalendarProps {
	date: string; // YYYY-MM format
	selectedDays: Set<number>;
	initialSelectedDays: Set<number>;
	availabilityCounts: { [day: number]: number };
	availabilityUsers: { [day: number]: string[] };
	isSubmitting: boolean;
	onDayToggle: (day: number) => void;
	onSubmit: () => void;
	onCancel: () => void;
}

export function AvailabilityCalendar({
	date,
	selectedDays,
	initialSelectedDays,
	availabilityCounts,
	availabilityUsers,
	isSubmitting,
	onDayToggle,
	onSubmit,
	onCancel,
}: AvailabilityCalendarProps) {
	const getDayCount = (day: number, isInOriginalMonth: boolean) => {
		const userSelected = selectedDays.has(day);
		const wasInitiallySelected = initialSelectedDays.has(day);
		const dbCount = isInOriginalMonth ? (availabilityCounts[day] || 0) : 0;
		
		// Adjust count based on user's vote changes
		let totalCount = dbCount;
		if (!wasInitiallySelected && userSelected && isInOriginalMonth) {
			totalCount = dbCount + 1;
		} else if (wasInitiallySelected && !userSelected && isInOriginalMonth) {
			totalCount = Math.max(0, dbCount - 1);
		}
		
		return { userSelected, othersCount: dbCount, totalCount };
	};

	const getMaxVoteCount = () => {
		const [year, month] = date.split("-");
		const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
		let max = 0;
		
		for (let offset = 0; offset < 28; offset++) {
			const currentDate = new Date(startDate);
			currentDate.setDate(startDate.getDate() + offset);
			const day = currentDate.getDate();
			const currentMonth = currentDate.getMonth() + 1;
			const currentYear = currentDate.getFullYear();
			const isInOriginalMonth = currentMonth === parseInt(month) && currentYear === parseInt(year);
			
			const { totalCount } = getDayCount(day, isInOriginalMonth);
			if (totalCount > max) {
				max = totalCount;
			}
		}
		return max;
	};

	const maxVotes = getMaxVoteCount();
	const [year, month] = date.split("-");
	const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
	const firstDayOfWeek = startDate.getDay();
	const firstDay = (firstDayOfWeek + 6) % 7; // Convert to Monday-based

	return (
		<div className="space-y-3 bg-black/95 -m-4 p-4">
			<div className="text-xs font-medium tracking-wider lowercase text-white text-center mb-2">
				Select Your Available Days (Next 4 Weeks)
			</div>
			
			{/* Calendar Grid */}
			<div className="grid grid-cols-7 gap-1">
				{/* Day labels (Monday-Sunday) */}
				{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
					<div key={i} className="text-center text-[10px] font-medium text-white pb-1">
						{day}
					</div>
				))}
				
				{/* Days with proper week alignment */}
				{/* Empty cells before first day */}
				{Array.from({ length: firstDay }).map((_, i) => (
					<div key={`empty-${i}`} className="aspect-square" />
				))}
				
				{/* Day buttons for 28 days (4 weeks) */}
				{Array.from({ length: 28 }).map((_, offset) => {
					const currentDate = new Date(startDate);
					currentDate.setDate(startDate.getDate() + offset);
					const day = currentDate.getDate();
					const currentMonth = currentDate.getMonth() + 1;
					const currentYear = currentDate.getFullYear();
					const isInOriginalMonth = currentMonth === parseInt(month) && currentYear === parseInt(year);
					
					const { userSelected, totalCount } = getDayCount(day, isInOriginalMonth);
					const isMaxVoted = totalCount > 0 && totalCount === maxVotes;
					const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()];
					
					let displayText = String(day);
					if (!isInOriginalMonth) {
						displayText = `${dayOfWeek} ${day}`;
					}
					
					const users = isInOriginalMonth ? (availabilityUsers[day] || []) : [];
					const tooltipText = users.length > 0 ? users.join(', ') : '';

					return (
						<button
							key={`day-${offset}`}
							onClick={() => onDayToggle(day)}
							title={tooltipText}
							className={`relative aspect-square flex items-center justify-center text-xs transition-colors ${
								userSelected
									? 'bg-bookclub-yellow text-black font-bold'
									: 'bg-white/10 hover:bg-white/20'
							} ${
								isMaxVoted
									? 'font-bold text-white '
									: 'text-white'
							} ${
								!isInOriginalMonth
									? 'opacity-60'
									: ''
							}`}
						>
							<span className={!isInOriginalMonth ? 'text-[9px]' : ''}>
								{displayText}
							</span>
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
				})}
			</div>

			<div className="flex gap-2 pt-2">
				<button
					onClick={onSubmit}
					disabled={isSubmitting}
					className="flex-1 py-2 bg-white hover:bg-[#E5B800] disabled:bg-neutral-400 disabled:cursor-not-allowed text-black text-xs font-bold tracking-wider lowercase transition-colors"
				>
					{isSubmitting ? "Submitting..." : "Submit"}
				</button>
				<button
					onClick={onCancel}
					disabled={isSubmitting}
					className="flex-1 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold tracking-wider lowercase transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>
	);
}
