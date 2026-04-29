import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import {
	useBlockProps,
	BlockControls,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	Button,
	Spinner,
	TextareaControl,
	ToolbarGroup,
	PanelBody,
	RangeControl,
} from '@wordpress/components';
import './editor.scss';
import { SmartframeLibrary } from './smartframe-modal';
import { SmartFrameComponent } from './smartframe-element';

export default function Edit( { attributes, setAttributes } ) {
	const { maxWidth } = attributes;
	const [ isApiConnected, setIsApiConnected ] = useState( false );
	const [ isCheckingApi, setIsCheckingApi ] = useState( true );
	const apiKey = window.smartframeBlockSettings?.apiKey || '';
	const blockStyles = { maxWidth: maxWidth ? `${ maxWidth }px` : undefined };
	const blockProps = useBlockProps( { style: blockStyles } );

	useEffect( () => {
		if ( ! apiKey || typeof apiKey !== 'string' || apiKey === '' ) {
			setIsCheckingApi( false );
			setIsApiConnected( false );
			return;
		}

		const testApiConnection = async () => {
			setIsCheckingApi( true );
			try {
				const response = await fetch(
					'https://api2.smartframe.io/search-api/search/collections',
					{
						method: 'GET',
						headers: {
							'X-API-KEY': apiKey,
						},
					}
				);

				if ( response.ok ) {
					setIsApiConnected( true );
				} else {
					setIsApiConnected( false );
				}
			} catch ( e ) {
				setIsApiConnected( false );
			} finally {
				setIsCheckingApi( false );
			}
		};

		testApiConnection();
	}, [ apiKey ] );

	const EmbedCodeVisibility = ( val ) => {
		if ( val ) {
			setAttributes( {
				embed: true,
				embedCode: '',
				imageId: null,
				customerId: '',
				imageWidth: null,
				imageHeight: null,
			} );
		} else if ( attributes.embed ) {
			setAttributes( {
				embed: false,
				embedCode: '',
				imageId: null,
				customerId: '',
				imageWidth: null,
				imageHeight: null,
			} );
		} else {
			setAttributes( { embed: false } );
		}
	};

	const { embedCode, imageId, customerId, imageWidth, imageHeight } =
		attributes;
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const openModal = () => setIsModalOpen( true );
	const closeModal = () => setIsModalOpen( false );

	const handleInsertImage = ( image ) => {
		setAttributes( {
			embedCode: image.embedCode || '',
			imageId: image.photoId,
			customerId: image.customerPublicId,
			imageWidth: image.width,
			imageHeight: image.height,
		} );
		closeModal();
	};

	const [ smartframePreviewButton, setSmartframePreviewButton ] =
		useState( false );
	const [ smartframeEmbedError, setSmartframeEmbedError ] = useState( false );
	const [ smartframePreview, setsmartframePreview ] = useState( true );

	useEffect( () => {
		if (
			attributes.embedCode.match(
				/<smartframe-embed.*<\/smartframe-embed>/
			)
		) {
			setSmartframePreviewButton( true );
		}
	}, [ attributes ] );

	const onManualEmbedChange = ( fullCode ) => {
		setsmartframePreview( false );
		setAttributes( { embedCode: fullCode } );

		// Regex to find customer-id, image-id, and aspect-ratio
		const customerIdRegex = /customer-id="([^"]+)"/;
		const imageIdRegex = /image-id="([^"]+)"/;
		const aspectRatioRegex =
			/aspect-ratio:\s*([\d.]+)(?:\s*\/\s*([\d.]+))?/;

		const customerIdMatch = fullCode.match( customerIdRegex );
		const imageIdMatch = fullCode.match( imageIdRegex );
		const aspectRatioMatch = fullCode.match( aspectRatioRegex );

		if ( customerIdMatch && imageIdMatch ) {
			setSmartframeEmbedError( false );

			let newWidth = null;
			let newHeight = null;

			if ( aspectRatioMatch ) {
				const ratioW = parseFloat( aspectRatioMatch[ 1 ] );
				const ratioH = aspectRatioMatch[ 2 ]
					? parseFloat( aspectRatioMatch[ 2 ] )
					: 1;
				newWidth = 1200;
				newHeight = Math.round( 1200 * ( ratioH / ratioW ) );
			}

			setAttributes( {
				customerId: customerIdMatch[ 1 ],
				imageId: imageIdMatch[ 1 ],
				imageWidth: newWidth,
				imageHeight: newHeight,
			} );
		} else {
			setSmartframeEmbedError( true );
			setAttributes( {
				customerId: '',
				imageId: '',
				imageWidth: null,
				imageHeight: null,
			} );
		}
	};

	const PreviewComponent = (
		<div className={ 'sfimages-library-preview' }>
			<SmartFrameComponent
				customerId={ customerId }
				imageId={ imageId }
				width={ imageWidth }
				height={ imageHeight }
			/>
		</div>
	);

	return (
		<div { ...blockProps }>
			{ imageId && (
				<>
					<BlockControls>
						<ToolbarGroup>
							<Button
								onClick={ () => {
									EmbedCodeVisibility( false );
									openModal();
								} }
								variant="primary"
								className={ 'sf-image-library' }
							>
								{ imageId ? (
									<span>Replace Image</span>
								) : (
									<span>Insert Image</span>
								) }
							</Button>
						</ToolbarGroup>
						<ToolbarGroup>
							<Button
								onClick={ () => {
									EmbedCodeVisibility( true );
									setSmartframePreviewButton( false );
									setsmartframePreview( false );
								} }
								className={ 'sf-embed-code' }
							>
								{ embedCode && attributes.embed ? (
									<span>Clear Embed Code</span>
								) : (
									<span>Enter Embed Code</span>
								) }
							</Button>
						</ToolbarGroup>
					</BlockControls>
					<InspectorControls>
						<PanelBody title="Dimension Settings">
							<RangeControl
								label="Max Width (px)"
								value={ maxWidth }
								onChange={ ( newMaxWidth ) =>
									setAttributes( { maxWidth: newMaxWidth } )
								}
								min={ 300 }
								max={ 2000 }
								step={ 5 }
								allowReset={ true }
								resetFallbackValue={ null }
							/>
						</PanelBody>
					</InspectorControls>
				</>
			) }

			{ ! imageId && (
				<>
					<p>Select a SmartFrame image to embed – it&apos;s free</p>
					{ isCheckingApi && <Spinner /> }
					{ ! isCheckingApi && isApiConnected && (
						<Button
							onClick={ () => {
								EmbedCodeVisibility( false );
								openModal();
							} }
							variant="primary"
						>
							<span>Insert SmartFrame image</span>
						</Button>
					) }
					{ ! isCheckingApi && ! isApiConnected && (
						<p className={ 'error-embed-code' }>
							API not connected or too many requests. Please check
							your settings or try again later.
						</p>
					) }
					<Button
						onClick={ () => {
							EmbedCodeVisibility( true );
							setSmartframePreviewButton( false );
							setsmartframePreview( false );
						} }
					>
						<span>Enter embed code</span>
					</Button>
				</>
			) }

			{ attributes.embed && ! smartframePreview && (
				<TextareaControl
					label={ __( 'Embed Code', 'smartframe-images' ) }
					hideLabelFromVision={ true }
					value={ embedCode }
					onChange={ onManualEmbedChange }
					rows={ 6 }
				/>
			) }

			{ attributes.embed &&
				! smartframeEmbedError &&
				smartframePreviewButton &&
				! smartframePreview && (
					<div className={ 'preview-button-container' }>
						<Button
							variant="primary"
							onClick={ () => {
								setsmartframePreview( true );
							} }
						>
							Preview
						</Button>
					</div>
				) }

			{ attributes.embed &&
				! smartframeEmbedError &&
				attributes.embedCode &&
				smartframePreview && (
					<div className={ 'sfimages-library-preview' }>
						<SmartFrameComponent
							customerId={ customerId }
							imageId={ imageId }
							width={ imageWidth }
							height={ imageHeight }
						/>
					</div>
				) }

			{ smartframeEmbedError && attributes.embed && (
				<p className={ 'error-embed-code' }>
					Please check the embed code, it isn&apos;t in the right
					format
				</p>
			) }

			{ isModalOpen && (
				<SmartframeLibrary
					onClose={ closeModal }
					onInsert={ handleInsertImage }
					apiKey={ apiKey }
				/>
			) }
			{ ! attributes.embed && imageId && PreviewComponent }
		</div>
	);
}
