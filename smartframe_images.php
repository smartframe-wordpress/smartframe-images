<?php
/**
 * Plugin Name:       SmartFrame Images
 * Plugin URI:        https://smartframe.io/help-center/
 * Description:       Browse, embed, and publish over 55 million free-to-embed images – without leaving WordPress.
 * Version:           1.3.0
 * Author:            SmartFrame Technologies Ltd
 * Author URI:        https://smartframe.com/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       smartframe-images
 * Domain Path:       /languages
 */

if ( ! defined('ABSPATH')) {
	exit;
}

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * This function is hooked into 'init' to ensure the block is registered
 * at the correct time in the WordPress initialization process.
 */

// Define constants for file paths.
define('SMARTFRAME_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SMARTFRAME_INCLUDES_DIR', SMARTFRAME_PLUGIN_DIR . 'includes');
define('SMARTFRAME_ADMIN_DIR', SMARTFRAME_PLUGIN_DIR . 'admin');
define('SMARTFRAME_VERSION', '1.3.0');


// Include other necessary plugin files.
require_once SMARTFRAME_ADMIN_DIR . '/sfimages_metabox.php';
require_once SMARTFRAME_ADMIN_DIR . '/sfimages_admin.php';
require_once SMARTFRAME_INCLUDES_DIR . '/sfimages_library_backend.php';
