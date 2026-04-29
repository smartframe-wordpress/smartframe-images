export function SmartFrameComponent( { customerId, imageId, width, height } ) {
	const style = {
		width: '100%',
		display: 'inline-flex',
		'--sf-image-size': 'cover',
		height: '100%',
	};

	if ( width && height ) {
		style.maxWidth = `${ width }px`;
		style.aspectRatio = `${ width } / ${ height }`;
	}

	return (
		<>
			<smartframe-embed
				customer-id={ customerId }
				image-id={ imageId }
				thumbnail-mode
				preview-mode
				style={ style }
			></smartframe-embed>
		</>
	);
}
