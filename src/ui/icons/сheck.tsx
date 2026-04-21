import { cn } from '@/utils'

export const CheckIcon = ({ state = 'hidden' }: { state?: 'hidden' | 'visible' | 'fading' }) =>
	<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' className={cn('check-icon', state !== 'hidden' && state)}>
		<circle className='circle' cx='12' cy='12' r='11'/>
		<path className='tick' d='M7 12L10.6667 16L18 8'/>
		<circle className='wave' cx='12' cy='12' r='15'/>
	</svg>

void `css
.check-icon {
	position: absolute;
	inset: 0;
	overflow: visible;
	opacity: 0;
	stroke: var(--text-success);
	transition: opacity 0.3s ease;
	.circle {
		stroke-dasharray: 69.12;
		stroke-dashoffset: 69.12;
		transform-origin: center;
		rotate: 90deg;
		scale: -1 1;
	}
	.tick {
		opacity: 0;
		transform-origin: center;
	}
	.wave {
		r: 0;
	}
	&.visible {
		opacity: 1;
	}
	&.visible, &.fading {
		.circle {
			animation: fillCircle 2s linear forwards;
		}
		.tick {
			animation: tickBounce 3s cubic-bezier(0.34, 1.56, 0.64, 1);
			animation-delay: 1.9s;
		}
		.wave {
			animation: rippleWave 0.8s ease-out forwards;
			animation-delay: 1.9s;
		}
	}
}
@keyframes fillCircle {
	0% {
		opacity: 0.2;
		stroke-dashoffset: 69.12;
	}
	75% {
		stroke-dashoffset: 0;
		opacity: 1;
	}
	100% {
		stroke-dashoffset: 0;
		opacity: 0;
	}
}
@keyframes tickBounce {
	0% {
		opacity: 0;
		scale: 0;
	}
	25% {
		opacity: 1;
		scale: 1;
	}
	50% {
		opacity: 1;
	}
	100% {
		opacity: 0;
	}
}
@keyframes rippleWave {
	0% {
		r: 0;
		opacity: 1;
	}
	100% {
		r: 15;
		opacity: 0;
	}
}
`