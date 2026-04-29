( function ( $, wp ) {
	'use strict';

	if ( typeof wp === 'undefined' || ! wp.mce || ! wp.mce.views ) {
		return;
	}

	$( document ).on( 'tinymce-editor-setup', function ( event, editor ) {
		editor.on( 'PreInit', function () {
			if ( editor.schema ) {
				editor.schema.addCustomElements( 'smartframe-embed' );
				editor.schema.addValidElements( 'smartframe-embed[*]' );
			}
		} );
	} );

	wp.mce.views.register( 'smartframe_images_embed', {
		initialize() {
			const self = this;

			$.ajax( {
				url: smartframe_preview_vars.ajaxurl,
				type: 'POST',
				data: {
					action: 'smartframe_render_shortcode_preview',
					nonce: smartframe_preview_vars.nonce,
					shortcode: self.shortcode.string(),
				},
			} )
				.done( function ( response ) {
					let html = '';

					if (
						response &&
						typeof response === 'object' &&
						response.success
					) {
						html = response.data;
					} else if ( typeof response === 'string' ) {
						html = response;
					}

					if ( ! html || ! html.trim() ) {
						self.setError(
							'SmartFrame preview returned empty HTML.',
							'format-image'
						);
						return;
					}

					self.render( {
						head:
							'<script src="' +
							smartframe_preview_vars.embed_js_url +
							'"></script>',
						body: html,
					} );
				} )
				.fail( function () {
					self.setError( 'AJAX preview failed.', 'no' );
				} );
		},

		bindNode( editor, node ) {
			const $node = $( node );
			const attrs =
				this.shortcode &&
				this.shortcode.attrs &&
				this.shortcode.attrs.named
					? this.shortcode.attrs.named
					: {};
			const alignment = attrs.alignment || 'alignnone';
			const maxWidth = attrs[ 'max-width' ] || '';

			$node
				.removeClass( 'alignnone alignleft aligncenter alignright' )
				.addClass( alignment )
				.css( {
					position: 'relative',
					width: '',
					maxWidth: '',
				} );

			if ( maxWidth ) {
				$node.css( 'max-width', maxWidth + 'px' );
			}

			if ( alignment === 'aligncenter' ) {
				$node.css( {
					display: 'block',
					marginLeft: 'auto',
					marginRight: 'auto',
					float: 'none',
				} );
			} else if ( alignment === 'alignright' ) {
				$node.css( {
					float: 'right',
					marginLeft: '1em',
					marginRight: '0',
				} );
			} else if ( alignment === 'alignleft' ) {
				$node.css( {
					float: 'left',
					marginRight: '1em',
					marginLeft: '0',
				} );
			} else {
				$node.css( {
					float: 'none',
					marginLeft: '',
					marginRight: '',
				} );
			}

			$node
				.find(
					'iframe.wpview-sandbox, smartframe-embed, smartframe-embed *'
				)
				.css( {
					'pointer-events': 'none',
					'user-select': 'none',
				} );

			if ( ! $node.children( '.sf-drag-shield' ).length ) {
				$node.append(
					'<div class="sf-drag-shield" ' +
						'style="position:absolute;inset:0;z-index:20;background:transparent;cursor:move;"></div>'
				);
			}

			$node.off( '.sfview' );
			$node.on( 'dblclick.sfview', '.sf-drag-shield', function ( e ) {
				e.preventDefault();
				e.stopPropagation();
				wp.mce.views.edit( editor, node );
			} );
		},

		unbindNode( editor, node ) {
			$( node ).off( '.sfview' );
		},

		edit( text, update ) {
			const editor = window.tinymce.activeEditor;
			const options = wp.shortcode.next(
				'smartframe_images_embed',
				text
			);

			if ( ! options ) {
				return;
			}

			const attrs = options.shortcode.attrs.named || {};
			const currentAlign = attrs.alignment || 'alignnone';
			const currentWidth = attrs[ 'max-width' ] || '';

			editor.windowManager.open( {
				title: 'SmartFrame Image Settings',
				body: [
					{
						type: 'listbox',
						name: 'alignment',
						label: 'Alignment',
						values: [
							{ text: 'None', value: 'alignnone' },
							{ text: 'Left', value: 'alignleft' },
							{ text: 'Center', value: 'aligncenter' },
							{ text: 'Right', value: 'alignright' },
						],
						value: currentAlign,
					},
					{
						type: 'textbox',
						name: 'maxwidth',
						label: 'Max Width (px)',
						value: currentWidth,
					},
					{
						type: 'button',
						name: 'replace_btn',
						text: 'Open Library to Replace Image',
						onclick() {
							window.sfSmartFrameReplace = {
								update,
								attrs: $.extend( {}, attrs ),
								shortcodeType:
									options.shortcode.type || 'single',
							};

							this.parent().parent().close();

							const $mainButton = $(
								'#insert-sfimages-button button'
							);

							if ( $mainButton.length ) {
								$mainButton.trigger( 'click' );
							} else {
								delete window.sfSmartFrameReplace;
								editor.windowManager.alert(
									'Error: Could not find the SmartFrame library button.'
								);
							}
						},
					},
				],
				buttons: [
					{ text: 'Cancel', onclick: 'close' },
					{
						text: 'Update',
						classes: 'primary button',
						onclick() {
							const win = this.parent().parent();
							const data = win.toJSON();
							const newWidthValue = data.maxwidth.trim();

							if (
								newWidthValue !== '' &&
								! /^\d+$/.test( newWidthValue )
							) {
								editor.windowManager.alert(
									'Please enter only numbers for the width.'
								);
								return;
							}

							if ( data.alignment === 'alignnone' ) {
								delete attrs.alignment;
							} else {
								attrs.alignment = data.alignment;
							}

							if ( newWidthValue === '' ) {
								delete attrs[ 'max-width' ];
							} else {
								attrs[ 'max-width' ] = newWidthValue;
							}

							update(
								wp.shortcode.string( {
									tag: 'smartframe_images_embed',
									attrs,
									type: options.shortcode.type,
								} )
							);

							win.close();
						},
					},
				],
			} );
		},
	} );
} )( jQuery, wp );
