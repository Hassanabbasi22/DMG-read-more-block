<?php
/*
Plugin Name: DMG Read More
Description: This plugin have two different geatures. 1) Custom WP-CLI command to search for posts with a specific Gutenberg block within a date range. 2) Gutenberg block to insert stylized anchor. 
Version: 1.0
Author: Hasan Jamil Abbasi
*/


// Gutenberg block to insert stylized anchor
function dmg_read_more_register_block() {
    // For load dependencies and version.
    $asset_file = include( plugin_dir_path( __FILE__ ) . 'build/index.asset.php' );

    // Register block script
    wp_register_script(
        'dmg-read-more-block',
        plugins_url( 'build/index.js', __FILE__ ),
        $asset_file['dependencies'],
        $asset_file['version']
    );
// Register Block
    register_block_type( 'dmg/read-more', array(
        'editor_script' => 'dmg-read-more-block',
    ) );
}
//hook the function into the 'init' action
add_action( 'init', 'dmg_read_more_register_block' );



// Custom WP-CLI command to search for posts with a specific Gutenberg block within a date range.
if (defined('WP_CLI') && WP_CLI) {
    class DMG_Read_More_Search_Command {
        public function __invoke($args, $assoc_args) {
            // Get date range from arguments or set default to last 30 days
            $date_before = isset($assoc_args['date-before']) ? $assoc_args['date-before'] : date('Y-m-d', strtotime('now'));
            $date_after = isset($assoc_args['date-after']) ? $assoc_args['date-after'] : date('Y-m-d', strtotime('-30 days'));

            // Date format validation
            if (!self::validate_date($date_before) || !self::validate_date($date_after)) {
                WP_CLI::error('Invalid date format. Please use Y-m-d.');
                return;
            }

            // WP Query posts within date range
            $query_args = array(
                'post_type' => 'post',
                'date_query' => array(
                    array(
                        'after' => $date_after,
                        'before' => $date_before,
                        'inclusive' => true,
                    ),
                ),
                'posts_per_page' => -1,
                'fields' => 'ids',
            );

            $query = new WP_Query($query_args);
            $post_ids = array();

            // Check each post (foreach) for the Gutenberg block
            if ($query->have_posts()) { 
                foreach ($query->posts as $post_id) {
                    $post_content = get_post_field('post_content', $post_id);
                    if (has_block('core/read-more', $post_content)) { // check read-more black exist
                        $post_ids[] = $post_id;
                    }
                }
            }
            
            // Output results
            if (!empty($post_ids)) {
                WP_CLI::success('Found posts: ' . implode(', ', $post_ids));
            } else {
                WP_CLI::log('No posts found in Gutenberg block in the given date range.');
            }
        }

        private static function validate_date($date) {
            $d = DateTime::createFromFormat('Y-m-d', $date);
            return $d && $d->format('Y-m-d') === $date;
        }
    }

    WP_CLI::add_command('dmg-read-more search', 'DMG_Read_More_Search_Command');
}
