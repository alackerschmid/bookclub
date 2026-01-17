interface RatingModalProps {
	isOpen: boolean;
	rating: number;
	isSubmitting: boolean;
	onRatingChange: (rating: number) => void;
	onSubmit: () => void;
	onCancel: () => void;
}

export function RatingModal({
	isOpen,
	rating,
	isSubmitting,
	onRatingChange,
	onSubmit,
	onCancel,
}: RatingModalProps) {
	if (!isOpen) return null;

	return (
		<div className="space-y-3 bg-black/95 -m-4 p-4">
			<div className="text-xs font-medium tracking-wider lowercase text-white text-center">
				Rate this book (0-10)
			</div>
			
			{/* Star Rating Selector */}
			<div className="flex justify-center gap-1">
				{[...Array(11)].map((_, i) => (
					<button
						key={i}
						onClick={() => onRatingChange(i)}
						className={`w-8 h-8 flex items-center justify-center text-xs font-bold transition-colors ${
							i <= rating
								? 'bg-bookclub-orange text-black'
								: 'bg-white/20 text-white hover:bg-white/30'
						}`}
					>
						{i}
					</button>
				))}
			</div>
			
			<div className="flex gap-2 pt-2">
				<button
					onClick={onSubmit}
					disabled={isSubmitting}
					className="flex-1 py-2 bg-white hover:bg-bookclub-orange disabled:bg-neutral-400 disabled:cursor-not-allowed text-black text-xs font-bold tracking-wider lowercase transition-colors"
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
