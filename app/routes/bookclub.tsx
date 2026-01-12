import { useLoaderData, useRevalidator, useNavigate } from "react-router";
import { useState } from "react";
import { BookCard } from "../components/BookCard";
import { SuggestBookModal } from "../components/SuggestBookModal";
import { useAuth } from "../lib/auth";
import type { Book } from "../lib/types";

interface LoaderData {
	readBooks: Book[];
	futureBooks: Book[];
}

export async function clientLoader() {
	const response = await fetch("/api/books");
	const data = await response.json() as { books?: Book[] };
	const books = data.books || [];
	
	const readBooks = books.filter((b: Book) => b.status === "read");
	const futureBooks = books.filter((b: Book) => b.status === "unread");
	
	return { readBooks, futureBooks };
}

export default function BookClub() {
	const { readBooks, futureBooks } = useLoaderData<LoaderData>();
	const revalidator = useRevalidator();
	const navigate = useNavigate();
	const { user } = useAuth();
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleBookSuggested = () => {
		// Revalidate to refresh the book list
		revalidator.revalidate();
	};

	const handleSuggestClick = () => {
		if (!user) {
			navigate("/login");
		} else {
			setIsModalOpen(true);
		}
	};

	return (
		<div className="min-h-screen bg-neutral-50 dark:bg-black">
			<main className="max-w-5xl mx-auto px-6 py-16">
				{/* Intro Section */}
				<div className="mb-16 text-center max-w-2xl mx-auto space-y-6">
					<h1 className="font-bold text-5xl tracking-tight text-neutral-900 dark:text-neutral-100 lowercase">
						Book Club
					</h1>
					<p className="mt-4 text-neutral-600 dark:text-neutral-400 font-light text-lg tracking-wide lowercase">
						What we read in our spare time.
					</p>
					<button
						onClick={handleSuggestClick}
						className="px-6 py-2 bg-bookclub-blue hover:bg-[#006090] text-white font-medium text-sm tracking-widest transition-colors lowercase"
					>
						Suggest Book
					</button>
				</div>

				{/* Timeline Container */}
				<div className="relative">
					{/* Previously Read Books Section */}
					<div className="relative">
						{/* Continuous Orange Timeline */}
						<div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-bookclub-orange transform md:-translate-x-1/2" />

						<div className="space-y-12">
						{readBooks.map((book, index) => {
							const isLeft = index % 2 === 0;
							const monthYear = book.read_on ? (() => {
								const [year, month] = book.read_on.split("-");
								const date = new Date(parseInt(year), parseInt(month) - 1);
								return date.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toLowerCase();
							})() : "";
							
							return (
								<div key={book.id} className="relative">
									{/* Badge on opposite side of card, centered vertically */}
								<div className={`hidden md:block absolute top-1/2 -translate-y-1/2 z-10 ${
									isLeft ? 'left-[calc(50%+2.5rem)]' : 'right-[calc(50%+2.5rem)]'
								}`}>

									<span className="relative block px-4 py-1 text-black text-xs font-bold tracking-wider lowercase bg-bookclub-orange whitespace-nowrap">
											READ {monthYear}
										</span>
									</div>
									
									{/* Mobile badge (above card) */}
									<div className="md:hidden mb-4 ml-8">
										<span className="inline-block px-4 py-1 text-black text-xs font-bold tracking-wider lowercase bg-bookclub-orange">
											READ {monthYear}
										</span>
									</div>

									<div className={`ml-8 md:ml-0 ${isLeft ? 'md:pr-[calc(50%+2rem)]' : 'md:pl-[calc(50%+2rem)]'}`}>
										<BookCard
											title={book.title}
											author={book.author}
											description={book.description}
											coverUrl={book.cover_url}
											rating={book.rating}
											isPreviouslyRead={true}
											bookId={book.id}										suggestedBy={book.suggestedBy}										/>
									</div>
								</div>
							);
						})}
						</div>
					</div>

					{/* Future Books Section */}
					<div className="relative mt-12">
						{/* Continuous Blue Timeline */}
						<div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-bookclub-blue transform md:-translate-x-1/2" />

						<div className="space-y-12">
						{futureBooks.map((book, index) => {
							const isLeft = index % 2 === 0;
							const isNextUpcoming = index === 0; // Only first future book is "next"
							const monthYear = book.read_on ? (() => {
								const [year, month] = book.read_on.split("-");
								const date = new Date(parseInt(year), parseInt(month) - 1);
								return date.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toLowerCase();
							})() : "";
							
							return (
								<div key={book.id} className="relative">
									{/* Badge on opposite side of card, centered vertically */}
								<div className={`hidden md:block absolute top-1/2 -translate-y-1/2 z-10 ${
									isLeft ? 'left-[calc(50%+2rem)]' : 'right-[calc(50%+2rem)]'
								}`}>
		
									<span className={`relative block px-4 py-1 text-xs font-bold tracking-wider lowercase whitespace-nowrap ${
										isNextUpcoming ? 'text-white bg-bookclub-blue' : 'text-neutral-500 bg-neutral-300 dark:text-neutral-400 dark:bg-neutral-700'
									}`}>
											UPCOMING {monthYear}
										</span>
									</div>
									
									{/* Mobile badge (above card) */}
									<div className="md:hidden mb-4 ml-8">
										<span className={`inline-block px-4 py-1 text-xs font-bold tracking-wider lowercase ${
											isNextUpcoming ? 'text-white bg-bookclub-blue' : 'text-neutral-500 bg-neutral-300 dark:text-neutral-400 dark:bg-neutral-700'
										}`}>
											UPCOMING {monthYear}
										</span>
									</div>

									<div className={`ml-8 md:ml-0 ${isLeft ? 'md:pr-[calc(50%+2rem)]' : 'md:pl-[calc(50%+2rem)]'}`}>
										<BookCard
											title={book.title}
											author={book.author}
											description={book.description}
											coverUrl={book.cover_url}
											date={book.read_on || "TBD"}
											isPreviouslyRead={false}
											isNextUpcoming={isNextUpcoming}
											bookId={book.id}										suggestedBy={book.suggestedBy}										/>
									</div>
								</div>
							);
						})}
						</div>
					</div>
				</div>
			</main>

			<SuggestBookModal 
				isOpen={isModalOpen} 
				onClose={() => setIsModalOpen(false)}
				onSuccess={handleBookSuggested}
			/>
		</div>
	);
}
