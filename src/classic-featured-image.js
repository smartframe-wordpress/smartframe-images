import { render, useState, useEffect } from '@wordpress/element';
import {
	Button,
	CheckboxControl,
	TextareaControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { SmartframeLibrary } from './smartframe-images-block/smartframe-modal';
import { SmartFrameComponent } from './smartframe-images-block/smartframe-element';

const parseEmbedCode = ( embedCode ) => {
	if (
		typeof embedCode !== 'string' ||
		! embedCode.includes( 'smartframe-embed' )
	) {
		return null;
	}
	const customerIdMatch = embedCode.match( /customer-id="([^"]+)"/ );
	const imageIdMatch = embedCode.match( /image-id="([^"]+)"/ );
	if ( ! customerIdMatch || ! imageIdMatch ) {
		return null;
	}
	const styleMatch = embedCode.match( /style="([^"]+)"/ );
	let width = 1024,
		height = 768;
	if ( styleMatch ) {
		const aspectRatioMatch = styleMatch[ 1 ].match(
			/aspect-ratio:\s*([0-9\.]+)\s*\/\s*([0-9\.]+)/
		);
		if ( aspectRatioMatch ) {
			width = parseFloat( aspectRatioMatch[ 1 ] );
			height = parseFloat( aspectRatioMatch[ 2 ] );
		}
	}
	return {
		customerPublicId: customerIdMatch[ 1 ],
		photoId: imageIdMatch[ 1 ],
		width,
		height,
	};
};

const App = () => {
	const { isEnabled, embedCode, apiKey } = window.smartframeClassicData;
	const [ isChecked, setIsChecked ] = useState( isEnabled );
	const [ currentEmbed, setCurrentEmbed ] = useState( embedCode );
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const previewData = parseEmbedCode( currentEmbed );
	useEffect( () => {
		const defaultLink = document.getElementById( 'set-post-thumbnail' );
		const defaultImage = document.querySelector(
			'#postimagediv .inside img'
		);
		const editOrUpdateLink = document.getElementById(
			'set-post-thumbnail-desc'
		);
		const removeLink = document.getElementById( 'remove-post-thumbnail' );
		const displayStyle = isChecked ? 'none' : '';

		if ( defaultLink ) {
			defaultLink.style.display = displayStyle;
		}

		if ( defaultImage ) {
			defaultImage.style.display = displayStyle;
		}

		if ( editOrUpdateLink ) {
			editOrUpdateLink.style.display = displayStyle;
		}

		if ( removeLink ) {
			removeLink.style.display = displayStyle;
		}
	}, [ isChecked ] );

	const cleanSmartFrameEmbed = ( html ) => {
		if ( typeof html !== 'string' ) {
			return '';
		}
		return html.replace( /<script\b[^>]*>([\s\S]*?)<\/script>/gim, '' );
	};

	const handleCheckboxChange = ( checked ) => {
		setIsChecked( checked );
	};

	const handleEmbedChange = ( newEmbed ) => {
		setCurrentEmbed( cleanSmartFrameEmbed( newEmbed ) );
	};

	const handleInsertFromLibrary = ( image ) => {
		if ( image && image.embedCode ) {
			setCurrentEmbed( cleanSmartFrameEmbed( image.embedCode ) );
		}
		setIsModalOpen( false );
	};

	const handleRemove = () => {
		setCurrentEmbed( '' );
	};

	return (
		<div style={ { marginTop: '10px' } }>
			{ /* These hidden inputs are what actually get saved by WordPress */ }
			<input
				type="hidden"
				name="smartframe_featured_image_meta"
				value={ isChecked ? '1' : '0' }
			/>
			<textarea
				name="smartframe_embed_code"
				value={ currentEmbed }
				readOnly
				style={ { display: 'none' } }
			></textarea>

			<CheckboxControl
				label={ __( 'Use a SmartFrame image', 'smartframe-images' ) }
				checked={ isChecked }
				onChange={ handleCheckboxChange }
			/>

			{ isChecked && (
				<div id="sf-classic-controls">
					<div>
						<Button
							className={
								'sfimages-featured-library button button-primary '
							}
							onClick={ () => setIsModalOpen( true ) }
						>
							{ __( 'Select from Library', 'smartframe-images' ) }
						</Button>
					</div>
					<div>
						<TextareaControl
							label={ __(
								'Or enter embed code',
								'smartframe-images'
							) }
							value={ currentEmbed }
							onChange={ handleEmbedChange }
						/>
					</div>
					{ previewData && (
						<div
							className="smartframe-image-preview"
							style={ { marginTop: '15px', display: 'grid' } }
						>
							<SmartFrameComponent
								customerId={ previewData.customerPublicId }
								imageId={ previewData.photoId }
								width={ previewData.width }
								height={ previewData.height }
							/>
							<div
								style={ {
									marginTop: '8px',
									display: 'flex',
									justifyContent: 'flex-end',
								} }
							>
								<Button
									isLink
									isDestructive
									onClick={ handleRemove }
								>
									{ __(
										'Remove Image',
										'smartframe-images'
									) }
								</Button>
							</div>
						</div>
					) }
				</div>
			) }

			{ isModalOpen && (
				<SmartframeLibrary
					apiKey={ apiKey }
					onClose={ () => setIsModalOpen( false ) }
					onInsert={ handleInsertFromLibrary }
				/>
			) }
		</div>
	);
};

const ROOT_ID = 'sf-classic-featured-image-root';

/**
 * Creates the root div if it doesn't exist and renders the React app.
 */
function mountReactApp() {
	const metaBoxContent = document.querySelector( '#postimagediv .inside' );
	if ( ! metaBoxContent ) {
		return;
	}

	let rootElement = document.getElementById( ROOT_ID );
	if ( ! rootElement ) {
		rootElement = document.createElement( 'div' );
		rootElement.id = ROOT_ID;
		metaBoxContent.appendChild( rootElement );
	}

	render( <App />, rootElement );
}

function initializePersistence() {
	mountReactApp();
	jQuery( '#postimagediv' ).on(
		'click',
		'#remove-post-thumbnail',
		function () {
			jQuery( document ).one(
				'ajaxComplete',
				function ( event, xhr, settings ) {
					if (
						settings.data &&
						settings.data.includes(
							'action=get-post-thumbnail-html'
						)
					) {
						window.smartframeClassicData.isEnabled = false;
						setTimeout( mountReactApp, 50 );
					}
				}
			);
		}
	);
}

jQuery( document ).ready( initializePersistence );
