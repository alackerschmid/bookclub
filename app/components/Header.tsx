import { Link } from "react-router";
import { useTheme } from "../lib/theme";
import { useAuth } from "../lib/auth";

export function Header() {
	const { theme, toggleTheme } = useTheme();
	const { user, logout } = useAuth();

	return (
		<header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-6 py-4">
				<div className="flex items-center justify-between">
					{/* Logo/Title */}
					<Link 
						to="/" 
						className="font-bold text-2xl tracking-tight text-neutral-900 dark:text-neutral-100 hover:text-bookclub-orange dark:hover:text-bookclub-orange transition-colors"
					>
						alackerschmid
					</Link>

					{/* Navigation */}
					<nav className="flex items-center gap-6">
						<Link
							to="/bookclub"
							className="text-sm font-medium tracking-wide text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors lowercase"
						>
							Books
						</Link>

						{/* User Info / Login */}
						{user ? (
							<>
								<span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-none">
									{user.username}
								</span>
								<button
									onClick={() => logout()}
									className="text-sm font-medium tracking-wide lowercase text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors leading-none"
								>
									Logout
								</button>
							</>
						) : (
							<Link
								to="/login"
								className="text-sm font-medium tracking-wide text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors lowercase leading-none"
							>
								Login
							</Link>
						)}

						{/* Theme Toggle */}
						<button
							onClick={toggleTheme}
							className="w-10 h-10 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex-shrink-0"
							aria-label="Toggle theme"
						>
							{theme === "light" ? (
								// Moon icon for dark mode
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="square"
									strokeLinejoin="miter"
									className="text-neutral-900"
								>
									<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
								</svg>
							) : (
								// Sun icon for light mode
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="square"
									strokeLinejoin="miter"
									className="text-neutral-100"
								>
									<circle cx="12" cy="12" r="4" />
									<path d="M12 2v2" />
									<path d="M12 20v2" />
									<path d="m4.93 4.93 1.41 1.41" />
									<path d="m17.66 17.66 1.41 1.41" />
									<path d="M2 12h2" />
									<path d="M20 12h2" />
									<path d="m6.34 17.66-1.41 1.41" />
									<path d="m19.07 4.93-1.41 1.41" />
								</svg>
							)}
						</button>
					</nav>
				</div>
			</div>
		</header>
	);
}
