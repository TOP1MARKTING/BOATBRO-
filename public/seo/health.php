<?php
/** Quick check after uploading to cPanel: open https://boatpro.club/seo/health.php — it must print JSON, not this code. */
define('BP_SEO', 1);
require __DIR__ . '/lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

$posts = bp_published_posts(true);
echo json_encode(array(
    'php' => 'ok',
    'version' => PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION,
    'curl' => function_exists('curl_init'),
    'mbstring' => extension_loaded('mbstring'),
    'firestore' => $posts !== null,
    'publishedPosts' => $posts === null ? null : count($posts),
    'shell' => is_file(dirname(__DIR__) . '/index.html'),
), JSON_PRETTY_PRINT);
