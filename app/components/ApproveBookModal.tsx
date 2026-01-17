interface ApproveBookModalProps {
	isOpen: boolean;
	bookTitle: string;
	scheduleDate: string;
	isSubmitting: boolean;
	onScheduleDateChange: (date: string) => void;
	onApprove: () => void;
	onCancel: () => void;
}

export function ApproveBookModal({
	isOpen,
	bookTitle,
	scheduleDate,
	isSubmitting,
	onScheduleDateChange,
	onApprove,
	onCancel,
}: ApproveBookModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-neutral-900 max-w-md w-full p-6 space-y-4">
				<h2 className="text-2xl font-bold text-black dark:text-white lowercase">
					Schedule Book
				</h2>
				<p className="text-neutral-700 dark:text-neutral-300">
					approving: <strong>{bookTitle}</strong>
				</p>
				<div>
					<label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 lowercase">
						Schedule on
					</label>
					<input
						type="date"
						value={scheduleDate}
						onChange={(e) => onScheduleDateChange(e.target.value)}
						className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white"
					/>
				</div>
				<div className="flex gap-2 pt-2">
					<button
						onClick={onApprove}
						disabled={isSubmitting || !scheduleDate}
						className="flex-1 py-2 bg-bookclub-blue hover:bg-[#0066CC] disabled:bg-neutral-500 disabled:cursor-not-allowed text-white text-sm font-bold tracking-wider lowercase transition-colors"
					>
						{isSubmitting ? 'Approving...' : 'Approve'}
					</button>
					<button
						onClick={onCancel}
						disabled={isSubmitting}
						className="flex-1 py-2 bg-neutral-500 hover:bg-neutral-600 disabled:cursor-not-allowed text-white text-sm font-bold tracking-wider lowercase transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}
