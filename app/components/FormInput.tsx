interface FormInputProps {
	id: string;
	label: string;
	type: "text" | "password" | "email";
	value: string;
	onChange: (value: string) => void;
	required?: boolean;
	autoFocus?: boolean;
	minLength?: number;
	helpText?: string;
}

export default function FormInput({
	id,
	label,
	type,
	value,
	onChange,
	required = false,
	autoFocus = false,
	minLength,
	helpText,
}: FormInputProps) {
	return (
		<div>
			<label
				htmlFor={id}
				className="block text-sm font-medium tracking-wide text-neutral-900 dark:text-neutral-100 mb-2 lowercase"
			>
				{label}
			</label>
			<input
				type={type}
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#FF6600] transition-colors"
				required={required}
				autoFocus={autoFocus}
				minLength={minLength}
			/>
			{helpText && (
				<p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 font-light">
					{helpText}
				</p>
			)}
		</div>
	);
}
