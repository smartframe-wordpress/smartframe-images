<?php
/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */
if ( ! defined('ABSPATH')) {
	exit;
}

$smartframe_style = '';
if ( ! empty( $attributes['maxWidth'] ) ) {
	$smartframe_style = sprintf( 'max-width: %dpx;', $attributes['maxWidth'] );
}

$smartframe_wrapper_attributes = get_block_wrapper_attributes( [ 'style' => $smartframe_style ] );

$smartframe_library = new Smartframe_Featured_Image_Replacement();

if ( $smartframe_library->smartframe_is_aggregator_or_bot() ) {
	$smartframe_embed_code = isset($attributes['embedCode']) ? $attributes['embedCode'] : '';

	preg_match('/customer-id=["\']([^"\']+)["\']/i', $smartframe_embed_code, $customer_matches);
	preg_match('/image-id=["\']([^"\']+)["\']/i', $smartframe_embed_code, $image_matches);

	$smartframe_customer_id = !empty($customer_matches[1]) ? $customer_matches[1] : '';
	$smartframe_image_id = !empty($image_matches[1]) ? $image_matches[1] : '';

	if ($smartframe_customer_id && $smartframe_image_id) {
		$smartframe_bot_url = "https://thumbs.smartframe.io/{$smartframe_customer_id}/{$smartframe_image_id}.webp?force-scraper=rss&t=rss";
		echo '<img src="' . esc_url($smartframe_bot_url) . '" alt="SmartFrame Image" />';
		return;
	}
}
?>
<div <?php echo wp_kses_data( $smartframe_wrapper_attributes ); ?>>
	<?php
	if ( ! empty( $attributes['embedCode'] ) ) {
		$smartframe_allowed_html = str_replace(
			'<smartframe-embed',
			'<smartframe-embed class="smartframe_wp_element"',
			$attributes['embedCode']
		);

		echo wp_kses( $smartframe_allowed_html, [
			'smartframe-embed' => [
				'class'           => true,
				'customer-id'     => true,
				'image-id'        => true,
				'v'               => true,
				'disable-caption' => true,
				'style'           => true
			],
		] );
	}
	?>
</div>