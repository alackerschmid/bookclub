import type { ReactNode } from "react";

interface TimelineCardProps {
	index: number;
	badge: ReactNode;
	children: ReactNode;
}

export function TimelineCard({ index, badge, children }: TimelineCardProps) {
	const isLeft = index % 2 === 0;

	return (
		<div className="relative">
			{/* Badge on opposite side of card, centered vertically */}
			<div className={`hidden md:block absolute top-1/2 -translate-y-1/2 z-10 ${
				isLeft ? 'left-[calc(50%+2.5rem)]' : 'right-[calc(50%+2.5rem)]'
			}`}>
				{badge}
			</div>
			
			{/* Mobile badge (above card) */}
			<div className="md:hidden mb-4 ml-8">
				{badge}
			</div>

			<div className={`ml-8 md:ml-0 ${
				isLeft ? 'md:pr-[calc(50%+2rem)]' : 'md:pl-[calc(50%+2rem)]'
			}`}>
				{children}
			</div>
		</div>
	);
}
