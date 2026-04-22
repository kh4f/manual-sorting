export const FileNameIcon = ({ direction }: { direction: 'asc' | 'desc' }) =>
	<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' className='file-name-icon'>
		<g className={`arrow ${direction}`}>
			<path d='M18 20L21 17L18 17L15 17L18 20Z'/>
			<path d='M18 3L18 19'/>
		</g>
		<path d='M9 7.66667H4M4 10V5.91667C4 5.14312 4.26339 4.40125 4.73223 3.85427C5.20107 3.30729 5.83696 3 6.5 3C7.16304 3 7.79893 3.30729 8.26777 3.85427C8.73661 4.40125 9 5.14312 9 5.91667V10'/>
		<path d='M3.99951 14H8.99951L3.99951 20H8.99951'/>
	</svg>

void `css
.ms-file-controls .file-name-icon .arrow {
	transform-origin: center;
	transition: transform 0.3s ease;

	&.desc {
		transform: scaleY(-1);
	}
}
`