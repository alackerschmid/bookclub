import { useState, useEffect } from "react";

const QUOTES = [
	{ text: "Books are a uniquely portable magic.", author: "Stephen King" },
	{ text: "So many books, so little time.", author: "Frank Zappa" },
	{ text: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
	{ text: "Five exclamation marks, the sure sign of an insane mind.", author: "Sir Terry Pratchett" },
	{ text: "I do things like get in a taxi and say, \"The library, and step on it.\"", author: "David Foster Wallace" },
	{ text: "′Classic′ - a book which people praise and don't read.", author: "Mark Twain" },
	{ text: "Finally, from so little sleeping and so much reading, his brain dried up and he went completely out of his mind.", author: "Miguel de Cervantes" },
	{ text: "I have always imagined that paradise will be a kind of library.", author: "Jorge Luis Borges" },
];

export function BookQuote() {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isVisible, setIsVisible] = useState(true);

	useEffect(() => {
		const interval = setInterval(() => {
			// Fade out
			setIsVisible(false);
			
			// Wait for fade out, then change quote and fade in
			setTimeout(() => {
				setCurrentIndex((prev) => (prev + 1) % QUOTES.length);
				setIsVisible(true);
			}, 500); // Half of the transition time
		}, 5000); // Change every 5 seconds

		return () => clearInterval(interval);
	}, []);

	const currentQuote = QUOTES[currentIndex];

	return (
		<blockquote 
			className={`mt-4 h-24 max-w-3xl mx-auto flex flex-col justify-center transition-opacity duration-500 ${
				isVisible ? 'opacity-100' : 'opacity-0'
			}`}
		>
			<p className="text-neutral-600 dark:text-neutral-300 font-light text-lg tracking-wide lowercase italic">
				{currentQuote.text}
			</p>
			<footer className="mt-2 text-neutral-500 dark:text-neutral-400 text-sm lowercase">
				{currentQuote.author ? `— ${currentQuote.author}` : '\u00A0'}
			</footer>
		</blockquote>
	);
}
