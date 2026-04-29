import { __ } from '@wordpress/i18n';
import {
	Button,
	CheckboxControl,
	TextareaControl,
	ButtonGroup,
	Spinner,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { Fragment, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
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

	let width = 1024;
	let height = 768;

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
		embedCode,
	};
};

const SmartFramePreview = ( { attributes, onRemove } ) => {
	return (
		<div
			className="smartframe-image-preview"
			style={ { marginTop: '15px', display: 'grid' } }
		>
			<SmartFrameComponent
				customerId={ attributes.customerPublicId }
				imageId={ attributes.photoId }
				width={ attributes.width }
				height={ attributes.height }
			/>
			<div
				className="smartframe-image-controls"
				style={ {
					marginTop: '8px',
					display: 'flex',
					justifyContent: 'flex-end',
				} }
			>
				<Button isLink isDestructive onClick={ onRemove }>
					{ __( 'Remove Image', 'smartframe-images' ) }
				</Button>
			</div>
		</div>
	);
};

const SmartFrameFeaturedImageExtension = () => {
	const [ isModalOpen, setModalOpen ] = useState( false );

	const smartframeApiKey = window.smartframeBlockSettings?.apiKey || '';

	const meta = useSelect( ( select ) => {
		return select( 'core/editor' ).getEditedPostAttribute( 'meta' );
	} );

	const { editPost } = useDispatch( 'core/editor' );
	const setPostMeta = ( newMeta ) => {
		editPost( { meta: newMeta } );
	};

	if ( meta === undefined ) {
		return <Spinner />;
	}

	const isChecked = meta?.smartframe_featured_image_meta || false;
	const embedCode = meta?.smartframe_embed_code || '';

	const previewData = parseEmbedCode( embedCode );
	const textareaDisplayValue = embedCode;

	const cleanSmartFrameEmbed = ( html ) => {
		if ( typeof html !== 'string' ) {
			return '';
		}
		return html.replace( /<script\b[^>]*>([\s\S]*?)<\/script>/gim, '' );
	};

	const handleEmbedCodeChange = ( value ) => {
		setPostMeta( { smartframe_embed_code: cleanSmartFrameEmbed( value ) } );
	};

	const openModal = () => setModalOpen( true );
	const closeModal = () => setModalOpen( false );

	const handleInsertFromLibrary = ( image ) => {
		const cleanCode = image.embedCode
			? cleanSmartFrameEmbed( image.embedCode )
			: '';
		setPostMeta( { smartframe_embed_code: cleanCode } );
		closeModal();
	};

	const handleRemove = () => {
		setPostMeta( { smartframe_embed_code: null } );
	};

	return (
		<div style={ { marginTop: '16px' } }>
			<CheckboxControl
				label={ __( 'Use a SmartFrame image', 'smartframe-images' ) }
				checked={ isChecked }
				onChange={ ( value ) =>
					setPostMeta( { smartframe_featured_image_meta: value } )
				}
			/>
			{ isChecked && (
				<div
					className="smartframe-featured-image-controls"
					style={ { marginTop: '10px' } }
				>
					<ButtonGroup style={ { width: '100%' } }>
						<Button
							isPrimary
							onClick={ openModal }
							style={ { flexGrow: 1 } }
						>
							{ __( 'Select from Library', 'smartframe-images' ) }
						</Button>
					</ButtonGroup>

					<div style={ { marginTop: '10px' } }>
						<TextareaControl
							label={ __(
								'Or enter embed code',
								'smartframe-images'
							) }
							value={ textareaDisplayValue }
							onChange={ handleEmbedCodeChange }
							help={ __(
								'Paste a valid SmartFrame embed code to see a preview.',
								'smartframe-images'
							) }
						/>
					</div>

					{ previewData && (
						<SmartFramePreview
							attributes={ previewData }
							onRemove={ handleRemove }
						/>
					) }

					{ isModalOpen && (
						<SmartframeLibrary
							apiKey={ smartframeApiKey }
							onClose={ closeModal }
							onInsert={ handleInsertFromLibrary }
						/>
					) }
				</div>
			) }
		</div>
	);
};

const addSmartFrameUI = ( OriginalComponent ) => {
	return ( props ) => {
		const isSmartFrameEnabled = useSelect( ( select ) => {
			return select( 'core/editor' ).getEditedPostAttribute( 'meta' )
				?.smartframe_featured_image_meta;
		} );

		if ( isSmartFrameEnabled === undefined ) {
			return <Spinner />;
		}

		return (
			<Fragment>
				{ ! isSmartFrameEnabled && <OriginalComponent { ...props } /> }
				<SmartFrameFeaturedImageExtension />
			</Fragment>
		);
	};
};

addFilter(
	'editor.PostFeaturedImage',
	'smartframe-images/add-smartframe-controls',
	addSmartFrameUI
);
