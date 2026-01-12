interface AuthButtonProps {
	isLoading: boolean;
	loadingText: string;
	text: string;
}

export default function AuthButton({
	isLoading,
	loadingText,
	text,
}: AuthButtonProps) {
	return (
		<button
			type="submit"
			disabled={isLoading}
			className="w-full py-3 bg-[#FF6600] hover:bg-[#E55A00] disabled:bg-neutral-400 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wider lowercase transition-colors"
		>
			{isLoading ? loadingText : text}
		</button>
	);
}
