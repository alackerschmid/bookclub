import { Link } from "react-router";
import type { Route } from "./+types/privacy";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Privacy Policy - book club" },
		{ name: "description", content: "Data protection and privacy information" },
	];
}

export default function Privacy() {
	return (
		<div className="min-h-screen bg-white dark:bg-black">
			<div className="max-w-3xl mx-auto px-6 py-12">
				<Link 
					to="/bookclub" 
					className="inline-block mb-8 text-bookclub-blue hover:text-bookclub-orange transition-colors text-sm lowercase"
				>
					← back to book club
				</Link>

				<h1 className="text-4xl font-bold mb-8 text-black dark:text-white lowercase">
					Privacy Policy (Datenschutzerklärung)
				</h1>

				<div className="prose prose-neutral dark:prose-invert max-w-none">
					<section className="mb-8">
						<h2 className="text-2xl font-bold mb-4 text-black dark:text-white lowercase">
							1. Data Protection at a Glance
						</h2>
						<h3 className="text-xl font-semibold mb-2 text-black dark:text-white lowercase">
							General Information
						</h3>
						<p className="text-neutral-700 dark:text-neutral-300 mb-4">
							The following information provides a simple overview of what happens to your personal data when you visit 
							this website. Personal data is any data that can be used to identify you personally.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-bold mb-4 text-black dark:text-white lowercase">
							2. Data Collection on This Website
						</h2>
						
						<h3 className="text-xl font-semibold mb-2 text-black dark:text-white lowercase mt-6">
							Who is responsible for data collection on this website?
						</h3>
						<p className="text-neutral-700 dark:text-neutral-300 mb-4">
							Data processing on this website is carried out by the website operator. You can find their contact 
							details in the Impressum of this website.
						</p>

						<h3 className="text-xl font-semibold mb-2 text-black dark:text-white lowercase mt-6">
							What data do we collect?
						</h3>
						<p className="text-neutral-700 dark:text-neutral-300 mb-4">
							We collect the following personal data when you use our service:
						</p>
						<ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 mb-4 space-y-2">
							<li><strong>Account Data:</strong> Username, email address, password (encrypted)</li>
							<li><strong>Book Data:</strong> Books you suggest, ratings you submit, availability selections</li>
							<li><strong>Technical Data:</strong> IP address, browser type, access times (stored in server logs)</li>
						</ul>

						<h3 className="text-xl font-semibold mb-2 text-black dark:text-white lowercase mt-6">
							What do we use your data for?
						</h3>
						<p className="text-neutral-700 dark:text-neutral-300 mb-4">
							Your data is used to:
						</p>
						<ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 mb-4 space-y-2">
							<li>Provide and maintain the book club service</li>
							<li>Manage user accounts and authentication</li>
							<li>Display book suggestions, ratings, and scheduling</li>
							<li>Ensure technical functionality and security</li>
						</ul>

						<h3 className="text-xl font-semibold mb-2 text-black dark:text-white lowercase mt-6">
							Legal basis for processing
						</h3>
						<p className="text-neutral-700 dark:text-neutral-300 mb-4">
							We process your data based on:
						</p>
						<ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 mb-4 space-y-2">
							<li><strong>Art. 6 (1) b GDPR:</strong> Performance of a contract (providing the service you signed up for)</li>
							<li><strong>Art. 6 (1) f GDPR:</strong> Legitimate interests (technical operation and security)</li>
						</ul>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-bold mb-4 text-black dark:text-white lowercase">
							3. Your Rights
						</h2>
						<p className="text-neutral-700 dark:text-neutral-300 mb-4">
							You have the following rights regarding your personal data:
						</p>
						<ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 mb-4 space-y-2">
							<li><strong>Right of Access (Art. 15 GDPR):</strong> You can request information about your stored data</li>
							<li><strong>Right to Rectification (Art. 16 GDPR):</strong> You can request correction of incorrect data</li>
							<li><strong>Right to Erasure (Art. 17 GDPR):</strong> You can request deletion of your data</li>
							<li><strong>Right to Data Portability (Art. 20 GDPR):</strong> You can request your data in a structured format</li>
							<li><strong>Right to Object (Art. 21 GDPR):</strong> You can object to data processing</li>
						</ul>
						<p className="text-neutral-700 dark:text-neutral-300 mb-4">
							To exercise these rights, please contact: [your@email.com]
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-bold mb-4 text-black dark:text-white lowercase">
							4. Cookies and Analytics
						</h2>
						<p className="text-neutral-700 dark:text-neutral-300 mb-4">
							<strong>Session Cookies:</strong> This website uses session cookies for authentication purposes. 
							These are technically necessary for the website to function and are stored based on Art. 6 (1) b GDPR.
						</p>
						<p className="text-neutral-700 dark:text-neutral-300 mb-4">
							<strong>Analytics:</strong> We do not use analytics tools."
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-bold mb-4 text-black dark:text-white lowercase">
							5. Third-Party Services
						</h2>
						<p className="text-neutral-700 dark:text-neutral-300 mb-4">
							This website uses the following third-party services:
						</p>
						<ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 mb-4 space-y-2">
							<li><strong>Cloudflare:</strong> Hosting and CDN services. See Cloudflare's privacy policy at cloudflare.com/privacypolicy</li>
							<li><strong>Open Library API:</strong> Book cover images and metadata</li>
						</ul>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-bold mb-4 text-black dark:text-white lowercase">
							6. Data Storage and Retention
						</h2>
						<p className="text-neutral-700 dark:text-neutral-300 mb-4">
							Your personal data is stored as long as necessary to provide the service or as required by law. 
							You can request deletion of your account and associated data at any time.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-bold mb-4 text-black dark:text-white lowercase">
							7. Data Security
						</h2>
						<p className="text-neutral-700 dark:text-neutral-300 mb-4">
							We use technical and organizational security measures to protect your data from unauthorized access, 
							loss, or manipulation. All data transmission is encrypted using SSL/TLS. Passwords are stored using 
							secure hashing algorithms.
						</p>
					</section>

					<section className="mb-8">
						<p className="text-neutral-600 dark:text-neutral-400 text-sm italic">
							Last updated: 17.01.2026
						</p>
					</section>
				</div>
			</div>
		</div>
	);
}
