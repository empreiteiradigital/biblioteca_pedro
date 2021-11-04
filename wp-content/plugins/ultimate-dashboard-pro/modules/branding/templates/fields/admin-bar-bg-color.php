<?php
/**
 * Admin bar bg color field.
 *
 * @package Ultimate_Dashboard_PRO
 */

defined( 'ABSPATH' ) || die( "Can't access directly" );

return function () {

	$branding = get_option( 'udb_branding' );
	$default  = '#232931';
	$color    = isset( $branding['admin_bar_bg_color'] ) ? $branding['admin_bar_bg_color'] : $default;
	?>

	<input type="text" name="udb_branding[admin_bar_bg_color]" value="<?php echo esc_attr( $color ); ?>" class="udb-color-field udb-branding-color-field udb-instant-preview-trigger" data-default="<?php echo esc_attr( $default ); ?>" data-udb-trigger-name="admin-bar-bg-color" />

	<?php

};
