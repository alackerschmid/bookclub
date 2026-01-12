import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../lib/auth";
import FormInput from "../components/FormInput";
import ErrorMessage from "../components/ErrorMessage";
import AuthButton from "../components/AuthButton";

export default function Login() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			await login(username, password);
			navigate("/bookclub");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-black flex items-center justify-center px-6">
			<div className="w-full max-w-md border-4 border-white p-8">
				{/* Orange geometric accent square */}
				<div className="w-4 h-4 bg-bookclub-orange mb-6" />
				
				<div className="space-y-8">
					{/* Header */}
					<div className="space-y-3">
						<h1 className="font-bold text-5xl tracking-tight text-white lowercase">
							Sign in
						</h1>
						<p className="text-neutral-300 font-light text-sm lowercase">
							Enter your credentials to continue
						</p>
					</div>

					{error && (
						<div className="border-2 border-bookclub-orange bg-bookclub-orange/10 p-4">
							<p className="text-sm text-bookclub-orange font-medium">{error}</p>
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
								className="w-full px-4 py-3 bg-transparent border-2 border-neutral-700 text-white focus:outline-none focus:border-bookclub-orange transition-colors"
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
								className="w-full px-4 py-3 bg-transparent border-2 border-neutral-700 text-white focus:outline-none focus:border-bookclub-orange transition-colors"
								required
							/>
						</div>

						{/* Submit Button */}
						<button
							type="submit"
							disabled={isLoading}
							className="w-full py-4 bg-bookclub-orange hover:bg-[#E55A00] disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-medium text-l tracking-widest lowercase transition-colors  "
						>
							{isLoading ? "Signing in..." : "Sign in"}
						</button>
					</form>

					{/* Footer Link */}
					<div className="pt-8 border-t-2 border-neutral-800">
						<p className="text-sm text-neutral-400 text-center lowercase">
							Don't have an account?{" "}
							<Link
								to="/register"
								className="text-bookclub-blue hover:text-bookclub-orange  font-bold transition-colors"
							>
								Register
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
