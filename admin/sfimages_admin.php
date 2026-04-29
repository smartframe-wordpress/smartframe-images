<?php
namespace Smartframe\Admin;

if ( ! defined('ABSPATH') ) {
	exit;
}

class Smartframe_Admin {
	public function __construct() {
		add_action('admin_init', [$this, 'smartframe_register_settings_menu']);
		add_action('admin_menu', [$this, 'smartframe_admin_menu'], 9);
		add_action('admin_enqueue_scripts', [$this, 'smartframe_enqueue_classic_editor_assets']);
		add_action('media_buttons', [$this, 'smartframe_add_media_button']);
		add_action('wp_ajax_smartframe_render_shortcode_preview', [$this, 'smartframe_render_shortcode_preview_ajax']);
		add_action('admin_enqueue_scripts', [$this, 'smartframe_enqueue_classic_editor_preview_scripts']);
	}

	public function smartframe_register_settings_menu() {
		register_setting('smartframe_admin_settings', 'smartframe_api_settings', ['show_in_rest' => true, 'type' => 'string', 'sanitize_callback' => [$this, 'smartframe_sanitize_and_validate_api_key']]);
		add_action('admin_enqueue_scripts', [$this, 'smartframe_admin_scripts']);
		add_editor_style(plugin_dir_url(__DIR__) . 'admin/assets/css/sfimages_classic_editor_tinymce.css');
	}

	public function smartframe_sanitize_and_validate_api_key($input) {
		$sanitized_input = sanitize_text_field($input);

		if (empty($sanitized_input)) {
			delete_option('smartframe_api_key_status');
			return $sanitized_input;
		}

		$old_value = get_option('smartframe_api_settings');
		$current_status = get_option('smartframe_api_key_status');

		if ($sanitized_input !== $old_value || !$current_status) {
			$response = wp_remote_get(
				'https://api2.smartframe.io/search-api/search/images',
				[
					'timeout'     => 15,
					'redirection' => 10,
					'httpversion' => '1.1',
					'headers'     => [
						'X-API-KEY' => $sanitized_input,
					],
				]
			);

			if (is_wp_error($response)) {
				update_option('smartframe_api_key_status', 500);
			} else {
				$http_code = wp_remote_retrieve_response_code($response);
				update_option('smartframe_api_key_status', $http_code);
			}
		}

		return $sanitized_input;
	}

	public function smartframe_admin_menu() {
		add_options_page(
			__('Smartframe Library', 'smartframe-images'),
			__('Smartframe Library', 'smartframe-images'),
			'manage_options',
			'smartframe_admin_settings',
			[$this, 'smartframe_display_admin_settings_dashboard']
		);
	}

	public function smartframe_display_admin_settings_dashboard() {
		?>
		<div class="wrap">
			<h2><?php esc_html_e('SmartFrame Images Settings', 'smartframe-images'); ?></h2>
			<?php
			if (get_option('smartframe_api_settings')) {
				$http_code = get_option('smartframe_api_key_status');

				if ($http_code == 200) {
					?>
					<p><?php esc_html_e('API Key successfully validated', 'smartframe-images'); ?></p>
					<h4><?php esc_html_e('If you have questions feel free to', 'smartframe-images'); ?> <a href="https://smartframe.io/help-center" target="_blank"><?php esc_html_e('check out our help center', 'smartframe-images'); ?></a> <?php esc_html_e('or', 'smartframe-images'); ?> <a href="mailto:support@smartframe.io"><?php esc_html_e('contact our support', 'smartframe-images'); ?></a></h4>
					<form method="post" action="options.php">
						<?php settings_fields('smartframe_admin_settings'); ?>
						<input type="hidden" name="smartframe_api_settings" value="">
						<?php submit_button(__('Reset API Key', 'smartframe-images')); ?>
					</form>
					<?php
				} elseif ($http_code == 429) {
					?>
					<p><?php esc_html_e('API Key successfully validated', 'smartframe-images'); ?></p>
					<h4><?php esc_html_e('If you have questions feel free to', 'smartframe-images'); ?> <a href="https://smartframe.io/help-center" target="_blank"><?php esc_html_e('check out our help center', 'smartframe-images'); ?></a> <?php esc_html_e('or', 'smartframe-images'); ?> <a href="mailto:support@smartframe.io"><?php esc_html_e('contact our support', 'smartframe-images'); ?></a></h4>
					<p  style="color:red"><?php esc_html_e('Too many requests for the moment try again later please', 'smartframe-images'); ?></p>
					<form method="post" action="options.php">
						<?php settings_fields('smartframe_admin_settings'); ?>
						<input type="hidden" name="smartframe_api_settings" value="">
						<?php submit_button(__('Reset API Key', 'smartframe-images')); ?>
					</form>
					<?php
				} else {
					?>
					<h4><a href="https://panel.smartframe.io/account/integration" target="_blank"><?php esc_html_e('Click here to generate an API key', 'smartframe-images'); ?></a></h4>
					<h4><?php esc_html_e('If you have questions feel free to', 'smartframe-images'); ?> <a href="https://smartframe.io/help-center" target="_blank"><?php esc_html_e('check out our help center', 'smartframe-images'); ?></a> <?php esc_html_e('or', 'smartframe-images'); ?> <a href="mailto:support@smartframe.io"><?php esc_html_e('contact our support', 'smartframe-images'); ?></a></h4>
					<form method="post" action="options.php">
						<?php settings_fields('smartframe_admin_settings'); ?>
						<table class="form-table">
							<tr>
								<th><label for="first_field_id"><?php esc_html_e('API Key:', 'smartframe-images'); ?></label></th>
								<td>
									<input type="password" class="regular-text" id="smartframe_api_key" name="smartframe_api_settings" value="<?php echo esc_attr(get_option('smartframe_api_settings')); ?>">
									<p style="color:red"><?php esc_html_e('Invalid API key provided. Please contact us at support@smartframe.io', 'smartframe-images'); ?></p>
								</td>
							</tr>
						</table>
						<?php submit_button(); ?>
					</form> 
					<?php
				}
			} else {
				?>
				<h4><a href="https://panel.smartframe.io/account/integration" target="_blank"><?php esc_html_e('Click here to generate an API key', 'smartframe-images'); ?></a></h4>
				<h4><?php esc_html_e('If you have questions feel free to', 'smartframe-images'); ?> <a href="https://smartframe.io/help-center" target="_blank"><?php esc_html_e('check out our help center', 'smartframe-images'); ?></a> <?php esc_html_e('or', 'smartframe-images'); ?> <a href="mailto:support@smartframe.io"><?php esc_html_e('contact our support', 'smartframe-images'); ?></a></h4>
				<form method="post" action="options.php">
					<?php settings_fields('smartframe_admin_settings'); ?>
					<table class="form-table">
						<tr>
							<th><label for="first_field_id"><?php esc_html_e('API Key:', 'smartframe-images'); ?></label></th>
							<td>
								<input type="password" class="regular-text" id="smartframe_api_key" name="smartframe_api_settings" value="<?php echo esc_attr(get_option('smartframe_api_settings')); ?>">
							</td>
						</tr>
					</table>
					<?php submit_button(); ?>
				</form> <?php } ?>
		</div>
		<?php
	}

	public function smartframe_admin_scripts($hook) {
		if ( $hook !== 'settings_page_smartframe_admin_settings' ) {
			return;
		}
		wp_enqueue_style('sfimages-admin-style', plugin_dir_url(__FILE__) . 'assets/css/sfimages_admin.css', [], SMARTFRAME_VERSION);
	}

	public function smartframe_enqueue_classic_editor_assets($hook) {
		if ($hook == 'post.php' || $hook == 'post-new.php') {
			$script_asset_path = SMARTFRAME_PLUGIN_DIR . 'build/classic_editor.asset.php';
			if (file_exists($script_asset_path)) {
				$script_asset = require $script_asset_path;
				wp_enqueue_script(
					'sfimages-classic-editor-script',
					plugin_dir_url(__DIR__) . 'build/classic_editor.js',
					$script_asset['dependencies'],
					SMARTFRAME_VERSION,
					true
				);

				$api_key = get_option('smartframe_api_settings');
				wp_localize_script(
					'sfimages-classic-editor-script',
					'smartframeClassic',
					[
						'apiKey' => $api_key,
					]
				);

				wp_enqueue_style(
					'sfimages-classic-editor-style',
					plugin_dir_url(__DIR__) . 'build/classic_editor.css',
					['wp-components'],
					SMARTFRAME_VERSION
				);

				wp_enqueue_style(
					'sfimages-classic-editor-tailwind',
					plugin_dir_url(__DIR__) . 'build/tailwind.css',
					['wp-components'],
					SMARTFRAME_VERSION
				);

				wp_enqueue_script('smartframe-images-embed-classiceditor', 'https://static.smartframe.io/embed.js', [], SMARTFRAME_VERSION, ['strategy' => 'async'], false);
			}
		}
	}
	public function smartframe_add_media_button($editor_id = 'content') {
		?>
		<a href="#" id="insert-sfimages-button" class="sfimages-library-activate"
			data-editor="<?php echo esc_attr($editor_id); ?>"
			title="<?php esc_attr_e('SmartFrame Images', 'smartframe-images'); ?>"><img src="<?php echo esc_url(plugin_dir_url(__FILE__) . '../admin/assets/images/sfimages_icon.svg'); ?>" width="20"/><?php esc_html_e('SmartFrame Images', 'smartframe-images'); ?></a>
		<?php
	}

	public function smartframe_render_shortcode_preview_ajax() {
		check_ajax_referer('smartframe_shortcode_preview', 'nonce');

		if ( ! current_user_can('edit_posts') ) {
			wp_send_json_error(__('You do not have permission to do this.', 'smartframe-images'));
			wp_die();
		}

		if ( ! isset($_POST['shortcode']) ) {
			wp_send_json_error(__('Invalid shortcode provided.', 'smartframe-images'));
			wp_die();
		}
		$shortcode = sanitize_textarea_field(wp_unslash($_POST['shortcode']));
		$pattern   = get_shortcode_regex(['smartframe_images_embed']);

		if ( preg_match("/$pattern/", $shortcode, $matches) ) {
			$safe_shortcode = $matches[0];
			$html           = do_shortcode($safe_shortcode);

			$allowed_html = [
				'div'              => [ 'class' => true ],
				'p'                => [ 'class' => true, 'style' => true ],
				'smartframe-embed' => [
					'class'           => true,
					'customer-id'     => true,
					'image-id'        => true,
					'style'           => true,
					'thumbnail-mode'  => true,
					'preview-mode'    => true,
					'v'               => true,
					'disable-caption' => true,
				],
			];

			$safe_html = wp_kses('<div class="sf-preview-content-holder">' . $html . '</div>', $allowed_html);

			wp_send_json_success($safe_html);
		} else {
			wp_send_json_error(__('Invalid shortcode provided.', 'smartframe-images'));
		}

		wp_die();
	}

	public function smartframe_enqueue_classic_editor_preview_scripts($hook) {
		if ('post.php' != $hook && 'post-new.php' != $hook) {
			return;
		}
		$post_type = get_post_type();
		if ( ! $post_type) {
			$post_id = null;
			if (isset($_GET['post'])) {
				$post_id = absint(wp_unslash($_GET['post']));
			} elseif (isset($_POST['post_ID'])) {
				$nonce = isset($_POST['_wpnonce']) ? sanitize_text_field(wp_unslash($_POST['_wpnonce'])) : '';
				if (wp_verify_nonce($nonce, 'update-post_' . absint(wp_unslash($_POST['post_ID'])))) {
					$post_id = absint(wp_unslash($_POST['post_ID']));
				}
			}

			if ($post_id) {
				$post_type = get_post_type($post_id);
			}
		}
		if (function_exists('use_block_editor_for_post_type') && use_block_editor_for_post_type($post_type)) {
			return;
		}

		wp_enqueue_script(
			'smartframe-classic-preview',
			plugin_dir_url(__FILE__) . 'classic-editor/sfimages_shortcode_preview_classic_editor.js',
			['jquery'],
			SMARTFRAME_VERSION,
			true
		);
		wp_localize_script(
			'smartframe-classic-preview',
			'smartframe_preview_vars',
			[
				'ajaxurl'      => admin_url('admin-ajax.php'),
				'nonce'        => wp_create_nonce('smartframe_shortcode_preview'),
				'embed_js_url' => 'https://static.smartframe.io/embed.js',
			]
		);
		$css = '
        .sf-shortcode-preview-wrapper { display: inline-block; vertical-align: middle; border: 1px dashed #ccc; padding: 10px; margin: 0 2px; width: 99%; }
        .sf-preview-loading, .sf-preview-error { text-align: center; color: #888; font-style: italic; padding: 20px 0; }
        .sf-preview-error { color: #d63638; }
    ';
		wp_add_inline_style('editor-buttons', $css);
	}
}

new Smartframe_Admin();