interface IconBaseProps extends React.SVGProps<SVGSVGElement> {
	children: React.ReactNode;
	className?: string;
}

export const IconBase: React.FC<IconBaseProps> = ({ children, className, ...props }) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={`manual-sorting-icon ${className}`}
			{...props}
		>
			{children}
		</svg>
	);
};
