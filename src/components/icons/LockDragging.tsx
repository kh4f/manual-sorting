import { IconBase } from "./IconBase";

export const LockDragging = () => {
	return (
		<IconBase className="lock-dragging">
			<circle cx="3" cy="4" r="1" fill="currentColor" />
			<circle cx="3" cy="11" r="1" fill="currentColor" />
			<circle cx="3" cy="18" r="1" fill="currentColor" />
			<path d="M6 4H13" />
			<path d="M6 11H8" />
			<path d="M6 18H7" />
			<rect x="12" y="13" width="10" height="7" rx="1" />
			<path
				d="M14 13V11C14 9.34315 15.3431 8 17 8V8C18.6569 8 20 9.34315 20 11V13"
			/>
		</IconBase>
	);
};
