<?php
/**
 * Plugin Name: Editor AI
 * Description: Enhances the Classic Editor with text alternatives and corrections using OpenAI.
 * Version: 1.1
 * Author: Client.Studio
 */

// Enqueue necessary scripts and styles
function editor_ai_enqueue_scripts() {
    if (is_admin()) {
        wp_enqueue_script('editor-ai-js', plugin_dir_url(__FILE__) . 'js/editor-ai.js', array('jquery'), '1.1', true);
        wp_enqueue_style('editor-ai-css', plugin_dir_url(__FILE__) . 'css/editor-ai.css', array(), '1.1');
    }
}
add_action('admin_enqueue_scripts', 'editor_ai_enqueue_scripts');

// Add settings page
function editor_ai_settings_page() {
    add_options_page('Editor AI Settings', 'Editor AI', 'manage_options', 'editor-ai-settings', 'editor_ai_settings_page_content');
}
add_action('admin_menu', 'editor_ai_settings_page');

// Settings page content
function editor_ai_settings_page_content() {
    ?>
    <div class="wrap">
        <h1>Editor AI Settings</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('editor_ai_settings');
            do_settings_sections('editor_ai_settings');
            submit_button();
            ?>
        </form>
    </div>
    <?php
}

// Register settings
function editor_ai_register_settings() {
    register_setting('editor_ai_settings', 'editor_ai_tone');
    register_setting('editor_ai_settings', 'editor_ai_openai_api_key');
    register_setting('editor_ai_settings', 'editor_ai_brand_voice');
    register_setting('editor_ai_settings', 'editor_ai_model');
    register_setting('editor_ai_settings', 'editor_ai_blacklist');
    
    add_settings_section('editor_ai_main_section', 'Main Settings', null, 'editor_ai_settings');
    add_settings_field('editor_ai_tone', 'Tone of Voice', 'editor_ai_tone_callback', 'editor_ai_settings', 'editor_ai_main_section');
    add_settings_field('editor_ai_openai_api_key', 'OpenAI API Key', 'editor_ai_openai_api_key_callback', 'editor_ai_settings', 'editor_ai_main_section');
    add_settings_field('editor_ai_brand_voice', 'Brand Voice', 'editor_ai_brand_voice_callback', 'editor_ai_settings', 'editor_ai_main_section');
    add_settings_field('editor_ai_model', 'AI Model', 'editor_ai_model_callback', 'editor_ai_settings', 'editor_ai_main_section');
    add_settings_field('editor_ai_blacklist', 'Blacklist words', 'editor_ai_blacklist_callback', 'editor_ai_settings', 'editor_ai_main_section');
}
add_action('admin_init', 'editor_ai_register_settings');

// Tone of voice field callback
function editor_ai_tone_callback() {
    $tone = get_option('editor_ai_tone', 'neutral');
    ?>
    <select name="editor_ai_tone">
        <option value="formal" <?php selected($tone, 'formal'); ?>>Formal</option>
        <option value="casual" <?php selected($tone, 'casual'); ?>>Casual</option>
        <option value="neutral" <?php selected($tone, 'neutral'); ?>>Neutral</option>
    </select>
    <?php
}

// OpenAI API key field callback
function editor_ai_openai_api_key_callback() {
    $api_key = get_option('editor_ai_openai_api_key', '');
    echo "<input type='text' name='editor_ai_openai_api_key' value='" . esc_attr($api_key) . "' class='regular-text'>";
}

// Brand voice field callback
function editor_ai_brand_voice_callback() {
    $brand_voice = get_option('editor_ai_brand_voice', '');
    echo "<textarea name='editor_ai_brand_voice' rows='5' cols='50' class='large-text'>" . esc_textarea($brand_voice) . "</textarea>";
    echo "<p class='description'>Describe your brand's voice and tone here or add custom prompt instructions.</p>";
}

// AI Model field callback
function editor_ai_model_callback() {
    $model = get_option('editor_ai_model', 'gpt-3.5-turbo');
    ?>
    <select name="editor_ai_model">
        <option value="gpt-4o" <?php selected($model, 'gpt-4o'); ?>>gpt-4o</option>
        <option value="gpt-4o-mini" <?php selected($model, 'gpt-4o-mini'); ?>>gpt-4o-mini</option>
        <option value="gpt-3.5-turbo" <?php selected($model, 'gpt-3.5-turbo'); ?>>gpt-3.5-turbo</option>
    </select>
    <p class="description">Select the AI model to use for generating content.</p>
    <?php
}

// Blacklist field callback
function editor_ai_blacklist_callback() {
    $blacklist = get_option('editor_ai_blacklist', '');
    echo "<textarea name='editor_ai_blacklist' rows='3' cols='50' class='large-text'>" . esc_textarea($blacklist) . "</textarea>";
    echo "<p class='description'>Enter words to avoid, separated by commas.</p>";
}

// Add to editor_AI_register_settings function
// register_setting('editor_ai_settings', 'editor_ai_brand_voice');
// add_settings_field('editor_ai_brand_voice', 'Brand Voice', 'editor_ai_brand_voice_callback', 'editor_ai_settings', 'editor_ai_main_section');

// Remove this function as it's a duplicate
// function editor_AI_brand_voice_callback() {
//     $brand_voice = get_option('editor_AI_brand_voice', '');
//     echo "<textarea name='editor_AI_brand_voice' rows='5' cols='50' class='large-text'>" . esc_textarea($brand_voice) . "</textarea>";
//     echo "<p class='description'>Describe your brand's voice and tone here.</p>";
// }

// Add OpenAI API key to JavaScript
function editor_ai_localize_script() {
    // Get the current WordPress locale
    $locale = get_locale();
    
    // Convert locale to a language code that OpenAI can understand
    $language = substr($locale, 0, 2); // This gets the first two characters, e.g., 'en' from 'en_US'

    wp_localize_script('editor-ai-js', 'editoraiSettings', array(
        'openai_api_key' => get_option('editor_ai_openai_api_key', ''),
        'tone' => get_option('editor_ai_tone', 'neutral'),
        'brand_voice' => get_option('editor_ai_brand_voice', ''),
        'language' => $language,
        'model' => get_option('editor_ai_model', 'gpt-3.5-turbo'), // Add the model to the localized script
        'blacklist' => get_option('editor_ai_blacklist', ''),
    ));
}
add_action('admin_enqueue_scripts', 'editor_ai_localize_script');

// Add custom button to TinyMCE
function editor_ai_add_button($buttons) {
    array_push($buttons, 'editor_ai_button');
    return $buttons;
}
add_filter('mce_buttons', 'editor_ai_add_button');

// Register TinyMCE plugin
function editor_ai_add_tinymce_plugin($plugin_array) {
    $plugin_array['editor_ai_button'] = plugin_dir_url(__FILE__) . 'js/tinymce-plugin.js';
    return $plugin_array;
}
add_filter('mce_external_plugins', 'editor_ai_add_tinymce_plugin');