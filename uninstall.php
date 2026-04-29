<?php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'smartframe_api_settings' );
delete_option( 'smartframe_api_key_status' );