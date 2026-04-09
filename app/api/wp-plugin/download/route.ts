// GET — returns PHP plugin file for download
export async function GET() {
  const pluginCode = `<?php
/**
 * Plugin Name: itgrows.ai Publisher
 * Description: Allows itgrows.ai to publish SEO articles to your WordPress blog
 * Version: 2.0
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

    $meta_desc = sanitize_text_field($params['metaDescription'] ?? '');
    $keywords  = isset($params['keywords']) && is_array($params['keywords']) ? $params['keywords'] : [];

    $post_data = array(
        'post_title'   => sanitize_text_field($params['title'] ?? ''),
        'post_content' => wp_kses_post($params['content'] ?? ''),
        'post_excerpt' => $meta_desc,
        'post_status'  => 'publish',
        'post_type'    => 'post',
    );

    $post_id = wp_insert_post($post_data);

    if (is_wp_error($post_id)) {
        return new WP_Error('publish_failed', $post_id->get_error_message(), array('status' => 500));
    }

    // Yoast SEO meta description
    update_post_meta($post_id, '_yoast_wpseo_metadesc', $meta_desc);

    // RankMath meta description
    update_post_meta($post_id, 'rank_math_description', $meta_desc);

    // Yoast focus keyword (first keyword)
    if (!empty($keywords)) {
        update_post_meta($post_id, '_yoast_wpseo_focuskw', sanitize_text_field($keywords[0]));
    }

    // Assign tags from keywords array
    if (!empty($keywords)) {
        $tags = array_map('sanitize_text_field', $keywords);
        wp_set_post_tags($post_id, $tags, false);
    }

    // Featured image from coverImageUrl (base64 data URL)
    if (!empty($params['coverImageUrl'])) {
        $image_url = $params['coverImageUrl'];
        if (strpos($image_url, 'data:image') === 0) {
            preg_match('/data:([^;]+);base64,(.+)/', $image_url, $matches);
            if (count($matches) === 3) {
                $mime_type  = $matches[1];
                $image_data = base64_decode($matches[2]);
                $ext        = $mime_type === 'image/png' ? 'png' : 'jpg';
                $filename   = 'cover-' . $post_id . '.' . $ext;
                $upload     = wp_upload_bits($filename, null, $image_data);
                if (!$upload['error']) {
                    $attachment = array(
                        'post_mime_type' => $mime_type,
                        'post_title'     => sanitize_file_name($filename),
                        'post_status'    => 'inherit',
                    );
                    $attach_id = wp_insert_attachment($attachment, $upload['file'], $post_id);
                    require_once(ABSPATH . 'wp-admin/includes/image.php');
                    $attach_data = wp_generate_attachment_metadata($attach_id, $upload['file']);
                    wp_update_attachment_metadata($attach_id, $attach_data);
                    set_post_thumbnail($post_id, $attach_id);
                }
            }
        }
    }

    return array(
        'success' => true,
        'post_id' => $post_id,
        'url'     => get_permalink($post_id),
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
