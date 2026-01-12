export function Footer() {
	return (
		<footer className="bg-white dark:bg-black">
			<div className="max-w-5xl mx-auto px-6 py-8">
				<div className="flex flex-col md:flex-row justify-between items-center gap-4">
					<p className="text-neutral-500 dark:text-neutral-500 text-sm font-light lowercase">
						© {new Date().getFullYear()} Alex Lackerschmid. All rights reserved.
					</p>
					<div className="flex gap-6">
						<a 
							href="https://github.com/alackerschmid" 
							target="_blank" 
							rel="noopener noreferrer"
							className="text-neutral-500 dark:text-neutral-500 hover:text-bookclub-blue dark:hover:text-bookclub-blue transition-colors text-sm lowercase"
						>
							GitHub
						</a>
						<a 
							href="https://www.linkedin.com/in/alexander-lackerschmid/" 
							target="_blank" 
							rel="noopener noreferrer"
							className="text-neutral-500 dark:text-neutral-500 hover:text-bookclub-blue dark:hover:text-bookclub-blue transition-colors text-sm lowercase"
						>
							LinkedIn
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
