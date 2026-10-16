<?php
/**
 * Serves article images stored in Firestore as real image responses:
 *   /media/posts/{id}.jpg       → postImages/{id} (immutable, cached for a year)
 *   /media/covers/{postId}-ar.jpg → base64 cover of an older published post (cached for an hour)
 */
define('BP_SEO', 1);
require __DIR__ . '/lib.php';

function bp_image_not_found()
{
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: public, max-age=60');
    exit('Not found');
}

function bp_send_data_url($dataUrl, $etag, $cacheControl)
{
    if (!preg_match('#^data:(image/(?:jpeg|png|webp));base64,(.+)$#s', (string) $dataUrl, $m)) {
        bp_image_not_found();
    }
    $bytes = base64_decode($m[2], true);
    if ($bytes === false || $bytes === '') {
        bp_image_not_found();
    }
    $etag = '"' . $etag . '"';
    header('Cache-Control: ' . $cacheControl);
    header('ETag: ' . $etag);
    if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
        http_response_code(304);
        exit;
    }
    header('Content-Type: ' . $m[1]);
    header('Content-Length: ' . strlen($bytes));
    echo $bytes;
    exit;
}

function bp_fetch_document($path, $cacheKey, $ttl)
{
    $cached = bp_cache_get($cacheKey, $ttl);
    if ($cached !== null) {
        $decoded = json_decode($cached, true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }
    list($status, $body) = bp_http('GET', BP_FIRESTORE . '/' . $path);
    $document = json_decode($body, true);
    if ($status !== 200 || !is_array($document)) {
        return null;
    }
    $fields = bp_fs_document($document);
    bp_cache_put($cacheKey, json_encode($fields));
    return $fields;
}

$id = isset($_GET['id']) ? (string) $_GET['id'] : '';
$coverId = isset($_GET['cover']) ? (string) $_GET['cover'] : '';

if ($id !== '') {
    if (!preg_match('/^[A-Za-z0-9_-]{6,64}$/', $id)) {
        bp_image_not_found();
    }
    $image = bp_fetch_document('postImages/' . $id, 'post-image-' . $id, 0);
    if (!$image) {
        bp_image_not_found();
    }
    bp_send_data_url(bp_str($image, 'dataUrl'), $id, 'public, max-age=31536000, immutable');
}

if ($coverId !== '') {
    if (!preg_match('/^[A-Za-z0-9_-]{6,64}$/', $coverId)) {
        bp_image_not_found();
    }
    $lang = isset($_GET['lang']) && $_GET['lang'] === 'en' ? 'en' : 'ar';
    $mask = '?mask.fieldPaths=coverUrl&mask.fieldPaths=coverUrlEn&mask.fieldPaths=published';
    $post = bp_fetch_document('posts/' . $coverId . $mask, 'post-cover-' . $coverId, 3600);
    if (!$post || empty($post['published'])) {
        bp_image_not_found();
    }
    $cover = $lang === 'en' && trim(bp_str($post, 'coverUrlEn')) !== '' ? trim(bp_str($post, 'coverUrlEn')) : trim(bp_str($post, 'coverUrl'));
    if ($cover === '') {
        bp_image_not_found();
    }
    if (strpos($cover, 'data:') !== 0) {
        header('Cache-Control: public, max-age=3600');
        header('Location: ' . bp_absolute($cover), true, 302);
        exit;
    }
    bp_send_data_url($cover, 'cover-' . $coverId . '-' . $lang . '-' . substr(sha1($cover), 0, 12), 'public, max-age=3600');
}

bp_image_not_found();
