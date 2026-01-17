import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("bookclub", "routes/bookclub.tsx"),
	route("login", "routes/login.tsx"),
	route("register", "routes/register.tsx"),
	// route("impressum", "routes/impressum.tsx"),
	route("privacy", "routes/privacy.tsx"),
] satisfies RouteConfig;
