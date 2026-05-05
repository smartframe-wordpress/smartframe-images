<?php
if ( ! defined('ABSPATH') ) {
	exit;
}

class Smartframe_Featured_Image_Replacement {
	public function __construct() {
		add_filter('post_thumbnail_html', [$this, 'smartframe_single_post_replacement'], 10, 2);
		add_action('init', [$this, 'smartframe_plugin_block_init'], 1);
		add_action('enqueue_block_editor_assets', [$this, 'smartframe_pass_settings_to_editor']);
		add_action('wp_enqueue_scripts', [$this, 'smartframe_enqueue_main_embed']);
		add_action('enqueue_block_assets', [$this, 'smartframe_enqueue_main_embed']);
		add_action('admin_enqueue_scripts', [$this, 'smartframe_enqueue_admin_scripts']);
		add_filter('wp_kses_allowed_html', [$this, 'smartframe_add_smartframe_to_allowed_html'], 10, 2);
		add_filter('tiny_mce_before_init', [$this, 'smartframe_add_smartframe_to_tinymce'], 99);
		add_shortcode('smartframe_images_embed', [$this, 'smartframe_embed_shortcode_mode']);
		add_shortcode('smartframe_featured_image', [$this, 'smartframe_featured_shortcode_mode']);
	}

	public function smartframe_pass_settings_to_editor() {
		$api_key = get_option('smartframe_api_settings');
		$data    = [
			'apiKey' => $api_key,
		];
		wp_add_inline_script(
			'wp-blocks',
			'window.smartframeBlockSettings = ' . wp_json_encode($data) . ';',
			'before'
		);
	}

	public function smartframe_enqueue_admin_scripts($hook) {
		if ('post.php' !== $hook && 'post-new.php' !== $hook) {
			return;
		}

		$current_screen = get_current_screen();
		if ($current_screen && $current_screen->is_block_editor()) {
			return;
		}

		$asset_file_path = plugin_dir_url(__DIR__) . 'build/classic_editor.asset.php';

		if ( ! file_exists($asset_file_path)) {
			return;
		}

		$asset_file = include $asset_file_path;

		wp_enqueue_script(
			'smartframe_classic_modal_script',
			plugin_dir_url(__DIR__) . 'build/classic_editor.js',
			$asset_file['dependencies'],
			SMARTFRAME_VERSION,
			true
		);

		wp_enqueue_style(
			'smartframe_classic_modal_style',
			plugin_dir_url(__DIR__) . 'admin/assets/css/sfimages_modal_classic_editor.css',
			[],
			SMARTFRAME_VERSION
		);
	}

	public function smartframe_plugin_block_init() {
		if (function_exists('wp_register_block_types_from_metadata_collection')) {
			wp_register_block_types_from_metadata_collection(SMARTFRAME_PLUGIN_DIR . '/build', SMARTFRAME_PLUGIN_DIR . '/build/blocks-manifest.php');
			return;
		}

		if (function_exists('wp_register_block_metadata_collection')) {
			wp_register_block_metadata_collection(SMARTFRAME_PLUGIN_DIR . '/build', SMARTFRAME_PLUGIN_DIR . '/build/blocks-manifest.php');
		}

		$manifest_data = require SMARTFRAME_PLUGIN_DIR . '/build/blocks-manifest.php';
		foreach (array_keys($manifest_data) as $block_type) {
			register_block_type(SMARTFRAME_PLUGIN_DIR . "/build/{$block_type}");
		}
	}

	public function smartframe_enqueue_main_embed() {
		wp_enqueue_script('smartframe-embed-js', 'https://static.smartframe.io/embed.js', [], SMARTFRAME_VERSION, ['strategy' => 'async'], true);
	}

	public function smartframe_single_post_replacement(string $html, int $post_id) {
		if (is_admin() || wp_doing_ajax() || ( defined('REST_REQUEST') && REST_REQUEST ) || $this->smartframe_is_aggregator_or_bot()) {
			return $html;
		}
		if (get_queried_object_id() === $post_id && in_the_loop()) {
			$smartframe_enabled_settings = intval(get_post_meta($post_id, 'smartframe_featured_image_meta', true));
			if ($smartframe_enabled_settings === 1) {
				$smartframe_url = get_post_meta($post_id, 'smartframe_embed_code', true);
				$raw_html     = '';

				if (str_contains($smartframe_url, 'smart-frame-embed')) {
					$raw_html = str_replace('smart-frame-embed', 'smart-frame-embed class="featured-image"', $smartframe_url);
				} else {
					$raw_html = str_replace('smartframe-embed', 'smartframe-embed class="featured-image"', $smartframe_url);
				}

				$allowed_tags = [
					'smartframe-embed' => [
						'disable-caption' => true,
						'customer-id'     => true,
						'image-id'        => true,
						'style'           => true,
						'class'           => true,
						'v'               => true,
					],
				];
				$html         = wp_kses($raw_html, $allowed_tags);
				remove_filter('post_thumbnail_html', [$this, 'smartframe_single_post_replacement'], 10, 2);
			}
		}

		return $html;
	}

	public function smartframe_add_smartframe_to_allowed_html($allowed_tags, $context) {
		if ( 'post' === $context ) {
			$allowed_tags['smartframe-embed'] = [
				'disable-caption' => true,
				'customer-id'     => true,
				'image-id'        => true,
				'style'           => true,
				'class'           => true,
				'v'               => true,
			];
		}
		return $allowed_tags;
	}

	public function smartframe_add_smartframe_to_tinymce($init_array) {
		$extended_valid_elements               = isset($init_array['extended_valid_elements']) ? $init_array['extended_valid_elements'] . ',' : '';
		$init_array['extended_valid_elements'] = $extended_valid_elements . 'smartframe-embed[*]';

		return $init_array;
	}

	public function smartframe_embed_shortcode_mode($atts) {
		$a = shortcode_atts(
			[
				'alignment'       => '',
				'max-width'       => '',
				'customer-id'     => '',
				'image-id'        => '',
				'disable-caption' => '',
				'style'           => 'width: 100%; display: inline-flex;',
				'class'           => 'smartframe_wp_element',
			],
			$atts
		);

		$is_classic_editor_preview = false;
		if (defined('DOING_AJAX') && DOING_AJAX && isset($_POST['action']) && $_POST['action'] === 'smartframe_render_shortcode_preview') {
			$nonce = '';
			if (isset($_POST['nonce'])) {
				$nonce = sanitize_text_field(wp_unslash($_POST['nonce']));
			}

			if (wp_verify_nonce($nonce, 'smartframe_shortcode_preview')) {
				$is_classic_editor_preview = true;
			}
		}

		$preview_attribute = $is_classic_editor_preview ? ' thumbnail-mode preview-mode' : '';

		if (empty($a['customer-id']) || empty($a['image-id'])) {
			return '';
		}

		$alignment    = esc_attr($a['alignment']);
		$max_width    = esc_attr($a['max-width']);
		$customer_id  = esc_attr($a['customer-id']);
		$image_id     = esc_attr($a['image-id']);
		$hide_caption = ( $a['disable-caption'] === 'true' ) ? 'disable-caption' : '';
		$style        = esc_attr($a['style']);
		$class        = esc_attr($a['class']);

		return sprintf(
			'<p class="%s" style="max-width: %spx"><smartframe-embed class="%s" customer-id="%s" image-id="%s" %s style="%s" %s></smartframe-embed></p>',
			$alignment,
			$max_width,
			$class,
			$customer_id,
			$image_id,
			$hide_caption,
			$style,
			$preview_attribute
		);
	}

	public function smartframe_featured_shortcode_mode() {
		global $post;
		$post_id                       = $post->ID;
		$html                          = '';
			$smartframe_enabled_settings = intval(get_post_meta($post_id, 'smartframe_featured_image', true));
		if ($smartframe_enabled_settings === 1) {
			$raw_html     = '';
			$smartframe_url = get_post_meta($post_id, 'smartframe_embed_code', true);
			if (str_contains($smartframe_url, 'smart-frame-embed')) {
				$raw_html .= str_replace('smart-frame-embed', 'smart-frame-embed class="featured-sf-image"', $smartframe_url);
			} else {
				$raw_html .= str_replace('smartframe-embed', 'smartframe-embed class="featured-sf-image"', $smartframe_url);
			}

			$allowed_tags = [
				'style'            => [],
				'smartframe-embed' => [
					'disable-caption' => true,
					'customer-id'     => true,
					'image-id'        => true,
					'style'           => true,
					'class'           => true,
					'v'               => true,
				],
			];

			$html = wp_kses($raw_html, $allowed_tags);
		}
		return $html;
	}

	public function smartframe_is_aggregator_or_bot() {
		if ( is_feed() ) {
			return true;
		}

		if ( empty($_SERVER['HTTP_USER_AGENT']) ) {
			return false;
		}

		$user_agent = sanitize_text_field(wp_unslash($_SERVER['HTTP_USER_AGENT']));
		$bots       = [
			'GTmetrix', 'Googlebot', 'Bingbot', 'BingPreview', 'msnbot',
			'slurp', 'Ask Jeeves', 'Baidu', 'DuckDuckBot', 'AOLBuild',
		];

		foreach ( $bots as $bot ) {
			if ( stripos($user_agent, $bot) !== false ) {
				return true;
			}
		}

		return false;
	}
}

new Smartframe_Featured_Image_Replacement();
