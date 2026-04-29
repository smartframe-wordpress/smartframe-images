<?php
if ( ! defined('ABSPATH')) {
	exit;
}

class Smartframe_Metabox {
	public function __construct() {
		//Gutenberg
		add_action('init', [$this, 'smartframe_register_gutenberg_meta']);
		add_action('enqueue_block_editor_assets', [$this, 'smartframe_gutenberg_scripts']);
		$this->add_gutenberg_save_hook();

		//Classic Editor
		add_filter('admin_post_thumbnail_html', [$this, 'smartframe_metabox_classic_editor_container'], 10, 2);
		add_action('save_post', [$this, 'save_smartframe_metabox_classic_editor'], 10);
		add_action('admin_enqueue_scripts', [$this, 'smartframe_classic_editor_scripts']);
	}

	public function add_gutenberg_save_hook() {
		$post_types = get_post_types(['public' => true], 'names');
		foreach ( $post_types as $post_type ) {
			if ( post_type_supports($post_type, 'thumbnail') ) {
				add_action("rest_after_insert_{$post_type}", [$this, 'save_gutenberg_featured_image'], 10, 2);
			}
		}
	}

	public function smartframe_register_gutenberg_meta() {
		register_post_meta(
			'post',
			'smartframe_featured_image_meta',
			[
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'boolean',
				'default'       => false,
				'auth_callback' => function () {
					return current_user_can('edit_posts');
				},
			]
		);
		register_post_meta(
			'post',
			'smartframe_embed_code',
			[
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'default'           => '',
				'auth_callback'     => function () {
					return current_user_can('edit_posts');
				},
				'sanitize_callback' => function ($meta_value) {
					$allowed_tags = [
						'smartframe-embed' => [
							'customer-id' => true,
							'image-id'    => true,
							'v'           => true,
							'style'       => true,
						],
					];
					return wp_kses($meta_value, $allowed_tags);
				},
			]
		);
	}

	public function save_gutenberg_featured_image($post, $request) {
		$post_ID = $post->ID;
		$meta    = $request->get_param('meta');
		if ( ! isset($meta['smartframe_featured_image_meta']) && ! isset($meta['smartframe_embed_code']) ) {
			return;
		}
		$is_enabled = isset($meta['smartframe_featured_image_meta']) ? (bool) $meta['smartframe_featured_image_meta'] : false;
		$image_data = isset($meta['smartframe_embed_code']) ? $meta['smartframe_embed_code'] : null;
		if ( ! $is_enabled || empty($image_data) ) {
			if ( get_post_meta(get_post_thumbnail_id($post_ID), '_smartframe_sideloaded_image', true) ) {
				delete_post_thumbnail($post_ID);
			}
			return;
		}
		$smartframe_embed_url = is_array($image_data) && ! empty($image_data['embedCode']) ? $image_data['embedCode'] : ( is_string($image_data) ? $image_data : '' );
		if ( empty($smartframe_embed_url) ) {
			return;
		}
		$this->smartframe_generate_thumbnail_from_url($post_ID, $smartframe_embed_url);
	}

	public function smartframe_metabox_classic_editor_container(string $content, int $post_id) {
		$html  = '<div id="sf-classic-featured-image-root"></div>';
		$html .= sprintf('<input type="hidden" name="smartframe_classic_nonce" value="%s" />', wp_create_nonce('smartframe_classic_nonce' . $post_id));
		return $content . $html;
	}

	public function save_smartframe_metabox_classic_editor(int $post_ID) {
		if ( ( defined('REST_REQUEST') && REST_REQUEST ) || ( defined('DOING_AUTOSAVE') && DOING_AUTOSAVE ) ) {
			return;
		}
		if ( ! isset($_POST['smartframe_classic_nonce']) || ! wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['smartframe_classic_nonce'])), 'smartframe_classic_nonce' . $post_ID) ) {
			return;
		}

		$is_enabled = ( isset($_POST['smartframe_featured_image_meta']) && $_POST['smartframe_featured_image_meta'] === '1' );
		update_post_meta($post_ID, 'smartframe_featured_image_meta', $is_enabled ? '1' : '0');

		if ($is_enabled) {
			$embed_code = '';
			if (isset($_POST['smartframe_embed_code'])) {
				$allowed_tags = [
					'smartframe-embed' => [
						'customer-id' => true,
						'image-id'    => true,
						'v'           => true,
						'style'       => true,
					],
				];
				$embed_code   = wp_kses(wp_unslash($_POST['smartframe_embed_code']), $allowed_tags);
				update_post_meta($post_ID, 'smartframe_embed_code', $embed_code);
			}

			if ( ! empty($embed_code)) {
				$this->smartframe_generate_thumbnail_from_url($post_ID, $embed_code);
			}
		} else {
			update_post_meta($post_ID, 'smartframe_embed_code', '');
		}
	}

	public function smartframe_classic_editor_scripts($hook) {
		global $post;
		if ($hook === 'post.php' || $hook === 'post-new.php') {
			$screen = get_current_screen();
			if ( $screen->is_block_editor() ) {
				return;
			}

			$script_asset_path = dirname(__DIR__) . '/build/classic-featured-image.asset.php';
			if ( ! file_exists($script_asset_path)) {
				return;
			}
			$script_asset = require $script_asset_path;

			wp_enqueue_script(
				'smartframe-classic-featured-image-script',
				plugin_dir_url(__DIR__) . 'build/classic-featured-image.js',
				$script_asset['dependencies'],
				$script_asset['version'],
				true
			);

			$embed_code = get_post_meta($post->ID, 'smartframe_embed_code', true);

			wp_localize_script(
				'smartframe-classic-featured-image-script',
				'smartframeClassicData',
				[
					'isEnabled' => (bool) get_post_meta($post->ID, 'smartframe_featured_image_meta', true),
					'embedCode' => $embed_code ? $embed_code : '',
					'apiKey'    => get_option('smartframe_api_settings'),
				]
			);
		}
	}

	private function smartframe_generate_thumbnail_from_url($post_ID, $smartframe_embed_url) {
		if ( empty($smartframe_embed_url) ) {
			return;
		}
		$smartframe_base_url  = defined('smartframe_DEV_THUMB_URL') ? smartframe_DEV_THUMB_URL : 'https://thumbs.smartframe.io/';
		$smartframe_client_id = sanitize_key($this->smartframe_get_string_between($smartframe_embed_url, 'customer-id="', '"'));
		$smartframe_image_id  = sanitize_text_field($this->smartframe_get_string_between($smartframe_embed_url, 'image-id="', '"'));
		if (empty($smartframe_client_id) || empty($smartframe_image_id)) {
			return;
		}
		$url = $smartframe_base_url . $smartframe_client_id . '/' . $smartframe_image_id . '.webp?force-scraper=WordPress&t=WordPress';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
		$image_id          = 0;
		$existing_image_id = $this->smartframe_media_already_uploaded($smartframe_image_id . '.webp');
		if ($existing_image_id === 0) {
			$image_id = media_sideload_image($url, $post_ID, $smartframe_image_id, 'id');
			if ( ! is_wp_error($image_id) ) {
				update_post_meta($image_id, '_smartframe_sideloaded_image', true);
			}
		} else {
			$image_id = $existing_image_id;
		}
		if ( ! is_wp_error($image_id) && $image_id > 0) {
			set_post_thumbnail($post_ID, $image_id);
		}
	}

	public function smartframe_gutenberg_scripts() {
		$plugin_root_dir   = dirname(__DIR__);
		$script_asset_path = $plugin_root_dir . '/build/featured-image.asset.php';
		if ( ! file_exists($script_asset_path)) {
			return;
		}
		$script_asset = require $script_asset_path;
		wp_enqueue_script(
			'smartframe-featured-image-script',
			plugins_url('../build/featured-image.js', __FILE__),
			$script_asset['dependencies'],
			$script_asset['version'],
			true
		);
		$api_key = get_option('smartframe_api_settings');
		wp_localize_script(
			'smartframe-featured-image-script',
			'smartframe_images_script_vars',
			['api_key' => $api_key]
		);
	}

	public function smartframe_get_string_between(string $string, string $start, string $end) {
		$ini = strpos($string, $start);
		if ($ini === false) {
			return '';
		}
		$ini += strlen($start);
		$len  = strpos($string, $end, $ini) - $ini;
		return substr($string, $ini, $len);
	}

	public function smartframe_media_already_uploaded($filename) {
		$slug = sanitize_title(pathinfo($filename, PATHINFO_FILENAME));

		$args = [
			'name'           => $slug,
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'no_found_rows'  => true,
		];

		$posts = get_posts($args);
		return ! empty($posts) ? intval($posts[0]) : 0;
	}
}
new Smartframe_Metabox();
