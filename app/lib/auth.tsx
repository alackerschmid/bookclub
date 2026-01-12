import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "./types";
import { api } from "./api";

interface AuthContextType {
	user: User | null;
	login: (username: string, password: string) => Promise<void>;
	register: (username: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const { user: userData } = await api.get<{ user: User | null }>("/api/auth/me");
				if (userData) {
					setUser(userData);
				}
			} catch (error) {
				console.error("Auth check error:", error);
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
	}, []);

	const register = async (username: string, password: string) => {
		const { user: userData } = await api.post<{ user: User }>("/api/auth/register", {
			username,
			password,
		});
		setUser(userData);
	};

	const login = async (username: string, password: string) => {
		const { user: userData } = await api.post<{ user: User }>("/api/auth/login", {
			username,
			password,
		});
		setUser(userData);
	};

	const logout = async () => {
		await api.post("/api/auth/logout");
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
