// GET — returns PHP plugin file for download
export async function GET() {
  const pluginCode = `<?php
/**
 * Plugin Name: itgrows.ai Publisher
 * Description: Allows itgrows.ai to publish SEO articles to your WordPress blog
 * Version: 1.0
 * Author: itgrows.ai
 */

if (!defined('ABSPATH')) exit;

// Generate and store site token
function itgrows_get_token() {
    $token = get_option('itgrows_site_token');
    if (!$token) {
        $token = 'igt_' . bin2hex(random_bytes(16));
        update_option('itgrows_site_token', $token);
    }
    return $token;
}

// Admin settings page
function itgrows_admin_menu() {
    add_options_page('itgrows.ai', 'itgrows.ai', 'manage_options', 'itgrows', 'itgrows_settings_page');
}
add_action('admin_menu', 'itgrows_admin_menu');

function itgrows_settings_page() {
    $token = itgrows_get_token();
    echo '<div class="wrap">';
    echo '<h1>itgrows.ai Publisher</h1>';
    echo '<p>Copy this token and paste it in your itgrows.ai dashboard:</p>';
    echo '<input type="text" value="' . esc_attr($token) . '" style="width:400px;font-family:monospace;padding:8px;" readonly onclick="this.select()" />';
    echo '<p><a href="https://itgrows.ai/dashboard/settings">Go to itgrows.ai Settings &rarr;</a></p>';
    echo '</div>';
}

// REST API endpoint for publishing
add_action('rest_api_init', function() {
    register_rest_route('itgrows/v1', '/publish', array(
        'methods' => 'POST',
        'callback' => 'itgrows_publish_post',
        'permission_callback' => '__return_true',
    ));
});

function itgrows_publish_post($request) {
    $params = $request->get_json_params();
    $token = itgrows_get_token();

    if (!isset($params['token']) || $params['token'] !== $token) {
        return new WP_Error('unauthorized', 'Invalid token', array('status' => 401));
    }

    $post_data = array(
        'post_title'   => sanitize_text_field($params['title'] ?? ''),
        'post_content' => wp_kses_post($params['content'] ?? ''),
        'post_excerpt' => sanitize_text_field($params['metaDescription'] ?? ''),
        'post_status'  => 'publish',
        'post_type'    => 'post',
    );

    $post_id = wp_insert_post($post_data);

    if (is_wp_error($post_id)) {
        return new WP_Error('publish_failed', $post_id->get_error_message(), array('status' => 500));
    }

    return array(
        'success' => true,
        'post_id' => $post_id,
        'url' => get_permalink($post_id),
    );
}
`

  return new Response(pluginCode, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": 'attachment; filename="itgrows-publisher.php"',
    },
  })
}
