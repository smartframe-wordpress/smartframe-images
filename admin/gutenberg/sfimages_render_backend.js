waitForElmInserted( '#smartframe_embed_textarea_container' ).then( () => {
	const publishButton = document.querySelector(
		'.components-button.editor-post-publish-button.is-primary'
	);
	const smartframeEmbedSearch = [
		'<script async src="https://embed',
		'<script src="https://embed',
		'gallery.js" data-customer-id="',
		'smart-frame-embed customer-',
		'smartframe-embed customer-',
	];
	const smartframeErrorMessage = document.getElementById(
		'smartframe_error_message'
	);
	const smartframeErrorMessageInput = document.getElementById(
		'smartframe_error_message_container'
	);
	const wpFeaturedImage = document.querySelector(
		'.editor-post-featured-image'
	);
	let smartframeCheckbox = document.getElementById(
		'smartframe_embed_checkbox'
	);
	let smartframeEmbedTextarea = document.getElementById(
		'smartframe_embed_textarea'
	);
	const smartframeEmbedTextareaPreview = document.getElementById(
		'smartframe_preview_mode'
	);
	const smartframePreviewButton = document.getElementById(
		'smartframe_embed_preview'
	);

	smartframeErrorMessageInput.classList.add( 'hidden' );
	if ( smartframeEmbedTextarea.value ) {
		setInnerScriptHTML(
			smartframeEmbedTextareaPreview,
			smartframeEmbedTextarea.value
		);
	}

	if ( smartframeCheckbox.checked ) {
		wpFeaturedImage.classList.add( 'hidden' );
		if ( ! smartframeEmbedTextarea.value && publishButton ) {
			disablePublishButton( publishButton, smartframeErrorMessage );
		}
	} else {
		wpFeaturedImage.classList.remove( 'hidden' );
		if ( publishButton ) {
			enablePublishButton( publishButton, smartframeErrorMessage );
		}
	}

	smartframeCheckbox.addEventListener( 'change', ( e ) => {
		if ( e.target.checked === true ) {
			wpFeaturedImage.classList.add( 'hidden' );
		} else {
			wpFeaturedImage.classList.remove( 'hidden' );
		}
	} );

	smartframePreviewButton.addEventListener( 'click', function () {
		smartframeEmbedTextarea = document.getElementById(
			'smartframe_embed_textarea'
		);
		setInnerScriptHTML(
			smartframeEmbedTextareaPreview,
			smartframeEmbedTextarea.value
		);
		return false;
	} );

	smartframeCheckbox.addEventListener( 'change', () => {
		smartframeCheckbox = document.getElementById(
			'smartframe_embed_checkbox'
		);
		if ( smartframeCheckbox.checked ) {
			if ( smartframeEmbedTextarea.value ) {
				if (
					smartframeEmbedSearch.some( ( keyword ) =>
						smartframeEmbedTextarea.value.includes( keyword )
					)
				) {
					enablePublishButton(
						publishButton,
						smartframeErrorMessage
					);
				} else if ( publishButton ) {
					disablePublishButton(
						publishButton,
						smartframeErrorMessage
					);
				}
			} else if ( publishButton ) {
				disablePublishButton( publishButton, smartframeErrorMessage );
			}
		} else if ( publishButton ) {
			enablePublishButton( publishButton, smartframeErrorMessage );
		}
	} );

	smartframeEmbedTextarea.addEventListener( 'keyup', () => {
		smartframeEmbedTextarea = document.getElementById(
			'smartframe_embed_textarea'
		);
		if ( smartframeEmbedTextarea.value ) {
			if (
				smartframeEmbedSearch.some( ( keyword ) =>
					smartframeEmbedTextarea.value.includes( keyword )
				) &&
				publishButton
			) {
				enablePublishButton( publishButton, smartframeErrorMessage );
			} else if ( publishButton ) {
				disablePublishButton( publishButton, smartframeErrorMessage );
			}
		} else if ( publishButton ) {
			disablePublishButton( publishButton, smartframeErrorMessage );
		}
		smartframePreviewButton.click();
	} );
} );

function waitForElmInserted( selector ) {
	return new Promise( ( resolve ) => {
		if ( document.querySelector( selector ) ) {
			return resolve( document.querySelector( selector ) );
		}

		const observer = new MutationObserver( () => {
			if ( document.querySelector( selector ) ) {
				observer.disconnect();
				resolve( document.querySelector( selector ) );
			}
		} );
		observer.observe( document.body, {
			childList: true,
			subtree: true,
		} );
	} );
}
function setInnerScriptHTML( elm, html ) {
	elm.innerHTML = html;

	Array.from( elm.querySelectorAll( 'script' ) ).forEach( ( oldScriptEl ) => {
		const newScriptEl = document.createElement( 'script' );
		Array.from( oldScriptEl.attributes ).forEach( ( attr ) => {
			newScriptEl.setAttribute( attr.name, attr.value );
		} );

		const scriptText = document.createTextNode( oldScriptEl.innerHTML );
		newScriptEl.appendChild( scriptText );
		oldScriptEl.parentNode.replaceChild( newScriptEl, oldScriptEl );
	} );
}

function disablePublishButton( elm, error ) {
	elm.setAttribute( 'aria-disabled', 'true' );
	elm.style.pointerEvents = 'none';
	error.classList.remove( 'hidden' );
	error.style.color = 'red';
}

function enablePublishButton( elm, error ) {
	elm.setAttribute( 'aria-disabled', 'false' );
	elm.style.pointerEvents = 'all';
	error.classList.add( 'hidden' );
}
