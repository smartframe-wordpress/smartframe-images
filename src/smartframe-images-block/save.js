/**
 * The save function for a dynamic block must return null.
 * The block's attributes are saved automatically, and the HTML is
 * rendered by the render.php file on the server.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/#save
 * @return {null} Nothing is saved, as this is a dynamic block.
 */
export default function save() {
	return null;
}
