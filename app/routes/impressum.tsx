// import { Link } from "react-router";
// import type { Route } from "./+types/impressum";

// export function meta({}: Route.MetaArgs) {
// 	return [
// 		{ title: "Impressum - book club" },
// 		{ name: "description", content: "Legal notice and contact information" },
// 	];
// }

// export default function Impressum() {
// 	return (
// 		<div className="min-h-screen bg-white dark:bg-black">
// 			<div className="max-w-3xl mx-auto px-6 py-12">
// 				<Link 
// 					to="/bookclub" 
// 					className="inline-block mb-8 text-bookclub-blue hover:text-bookclub-orange transition-colors text-sm lowercase"
// 				>
// 					← back to book club
// 				</Link>

// 				<h1 className="text-4xl font-bold mb-8 text-black dark:text-white lowercase">
// 					Impressum
// 				</h1>

// 				<div className="prose prose-neutral dark:prose-invert max-w-none">
// 					<section className="mb-8">
// 						<h2 className="text-2xl font-bold mb-4 text-black dark:text-white lowercase">
// 							Information according to § 5 TMG
// 						</h2>
// 						<div className="text-neutral-700 dark:text-neutral-300 space-y-2">
// 							<p>
// 								<strong>Name:</strong> Alexander Lackerschmid<br />
// 								<strong>Address:</strong><br />
// 								[Street and Number]<br />
// 								[Postal Code] [City]<br />
// 								[Country]
// 							</p>
// 						</div>
// 					</section>

// 					<section className="mb-8">
// 						<h2 className="text-2xl font-bold mb-4 text-black dark:text-white lowercase">
// 							Contact
// 						</h2>
// 						<div className="text-neutral-700 dark:text-neutral-300 space-y-2">
// 							<p>
// 								<strong>Email:</strong> [your@email.com]<br />
// 								<strong>Phone:</strong> [Your Phone Number]
// 							</p>
// 						</div>
// 					</section>

// 					<section className="mb-8">
// 						<h2 className="text-2xl font-bold mb-4 text-black dark:text-white lowercase">
// 							Responsible for content according to § 55 Abs. 2 RStV
// 						</h2>
// 						<div className="text-neutral-700 dark:text-neutral-300">
// 							<p>
// 								[Your Full Name]<br />
// 								[Street and Number]<br />
// 								[Postal Code] [City]
// 							</p>
// 						</div>
// 					</section>

// 					<section className="mb-8">
// 						<h2 className="text-2xl font-bold mb-4 text-black dark:text-white lowercase">
// 							Disclaimer
// 						</h2>
						
// 						<h3 className="text-xl font-semibold mb-2 text-black dark:text-white lowercase mt-6">
// 							Liability for content
// 						</h3>
// 						<p className="text-neutral-700 dark:text-neutral-300 mb-4">
// 							As a service provider, we are responsible for our own content on these pages in accordance with § 7 paragraph 1 TMG. 
// 							However, according to §§ 8 to 10 TMG, we are not obligated to monitor transmitted or stored third-party information 
// 							or to investigate circumstances that indicate illegal activity.
// 						</p>

// 						<h3 className="text-xl font-semibold mb-2 text-black dark:text-white lowercase mt-6">
// 							Liability for links
// 						</h3>
// 						<p className="text-neutral-700 dark:text-neutral-300 mb-4">
// 							Our website contains links to external third-party websites over whose content we have no influence. 
// 							Therefore, we cannot accept any liability for this external content. The respective provider or operator 
// 							of the pages is always responsible for the content of the linked pages.
// 						</p>

// 						<h3 className="text-xl font-semibold mb-2 text-black dark:text-white lowercase mt-6">
// 							Copyright
// 						</h3>
// 						<p className="text-neutral-700 dark:text-neutral-300">
// 							The content and works created by the site operators on these pages are subject to German copyright law. 
// 							Duplication, processing, distribution, and any form of commercialization of such material beyond the 
// 							scope of copyright law shall require the prior written consent of its respective author or creator.
// 						</p>
// 					</section>
// 				</div>
// 			</div>
// 		</div>
// 	);
// }
