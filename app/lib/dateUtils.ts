// Helper to format YYYY-MM or YYYY-MM-DD to "Month Day, YYYY" or "Month YYYY"
export function formatMonthYear(dateStr: string): string {
	if (dateStr === "TBD") return "TBD";
	const parts = dateStr.split("-");
	const year = parseInt(parts[0]);
	const month = parseInt(parts[1]) - 1;
	

	// Otherwise just show month and year
	const date = new Date(year, month);
	return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Helper to get number of days in a month
export function getDaysInMonth(monthStr: string): number {
	if (monthStr === "TBD") return 28;
	const [year, month] = monthStr.split("-");
	return new Date(parseInt(year), parseInt(month), 0).getDate();
}

// Helper to get the first day of the month (0 = Sunday, 6 = Saturday)
export function getFirstDayOfMonth(monthStr: string): number {
	if (monthStr === "TBD") return 0;
	const [year, month] = monthStr.split("-");
	return new Date(parseInt(year), parseInt(month) - 1, 1).getDay();
}
