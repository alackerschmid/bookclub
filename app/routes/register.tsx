import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useNavigate, Link } from "react-router";

export default function Register() {
	const { register } = useAuth();
	const navigate = useNavigate();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			await register(username, password);
			navigate("/bookclub");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Registration failed");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-black flex items-center justify-center px-6">
			<div className="w-full max-w-md border-4 border-white p-8">
				{/* Orange geometric accent square */}
				<div className="w-4 h-4 bg-bookclub-blue mb-6" />
				
				<div className="space-y-8">
					{/* Header */}
					<div className="space-y-3">
						<h1 className="font-bold text-5xl tracking-tight text-white lowercase">
							Register
						</h1>
						<p className="text-neutral-300 font-light text-sm lowercase">
							Also pretty straight forward
						</p>
					</div>

					{error && (
						<div className="border-2 border-bookclub-blue bg-bookclub-blue/10 p-4">
							<p className="text-sm text-bookclub-blue font-medium">{error}</p>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-8">
						{/* Username Field */}
						<div className="space-y-2">
							<label
								htmlFor="username"
								className="block text-xs font-medium tracking-widest text-white lowercase"
							>
								Username
							</label>
							<input
								type="text"
								id="username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="w-full px-4 py-3 bg-transparent border-2 border-neutral-700 text-white focus:outline-none focus:border-bookclub-blue transition-colors"
								required
								autoFocus
							/>
						</div>

						{/* Password Field */}
						<div className="space-y-2">
							<label
								htmlFor="password"
								className="block text-xs font-medium tracking-widest text-white lowercase"
							>
								Password
							</label>
							<input
								type="password"
								id="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full px-4 py-3 bg-transparent border-2 border-neutral-700 text-white focus:outline-none focus:border-bookclub-blue transition-colors"
								required
								minLength={8}
							/>
							<p className="text-xs text-neutral-400 font-light lowercase">
								Must be at least 8 characters
							</p>
						</div>

						{/* Submit Button */}
						<button
							type="submit"
							disabled={isLoading}
							className="w-full py-4 bg-bookclub-blue hover:bg-[#006090] disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-medium text-sm tracking-widest lowercase transition-colors"
						>
							{isLoading ? "Creating Account..." : "Register"}
						</button>
					</form>

					{/* Footer Link */}
					<div className="pt-8 border-t-2 border-neutral-800">
						<p className="text-sm text-neutral-400 text-center lowercase">
							Already have an account?{" "}
							<Link
								to="/login"
								className="text-bookclub-orange hover:text-bookclub-blue font-medium transition-colors"
							>
								Sign in
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
