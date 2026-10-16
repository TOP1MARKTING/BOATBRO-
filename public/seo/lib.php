<?php
/**
 * Shared helpers for the dynamic SEO layer on the cPanel host (sitemap, per-post meta, post images).
 * Reads the same public Firestore data as the site: published posts and postImages by id.
 * Written for PHP 7.0+ (no PHP 8-only syntax) because the host version is not pinned.
 */

if (!defined('BP_SEO')) {
    http_response_code(404);
    exit;
}

if (!function_exists('mb_substr')) {
    function mb_strlen($value, $encoding = null)
    {
        return (int) preg_match_all('/./us', (string) $value);
    }

    function mb_substr($value, $start, $length = null, $encoding = null)
    {
        $chars = preg_split('//u', (string) $value, -1, PREG_SPLIT_NO_EMPTY);
        return implode('', array_slice($chars, $start, $length));
    }

    function mb_strrpos($haystack, $needle, $offset = 0, $encoding = null)
    {
        $pos = strrpos((string) $haystack, (string) $needle);
        return $pos === false ? false : mb_strlen(substr((string) $haystack, 0, $pos));
    }
}

define('BP_ORIGIN', 'https://boatpro.club');
define('BP_FIRESTORE', getenv('BP_FIRESTORE_URL') ?: 'https://firestore.googleapis.com/v1/projects/boatpro1-18c6d/databases/(default)/documents');
define('BP_POSTS_TTL', 120);
define('BP_SITE_NAME_AR', 'بوت برو');
define('BP_SITE_NAME_EN', 'BoatPro');

function bp_cache_file($key)
{
    $dir = rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . 'boatpro-seo-cache';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir . DIRECTORY_SEPARATOR . sha1($key);
}

/** $ttl = 0 means the entry never expires (immutable content such as postImages). */
function bp_cache_get($key, $ttl)
{
    $file = bp_cache_file($key);
    if (!is_file($file)) {
        return null;
    }
    if ($ttl > 0 && time() - filemtime($file) >= $ttl) {
        return null;
    }
    $raw = @file_get_contents($file);
    return $raw === false ? null : $raw;
}

function bp_cache_put($key, $value)
{
    @file_put_contents(bp_cache_file($key), $value, LOCK_EX);
}

/** @return array{0:int,1:string} [status, body] */
function bp_http($method, $url, $body = null)
{
    $headers = array('Accept: application/json');
    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
    }
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 20,
        ));
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }
        $res = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return array($status, $res === false ? '' : (string) $res);
    }
    $context = stream_context_create(array('http' => array(
        'method' => $method,
        'header' => implode("\r\n", $headers),
        'content' => $body === null ? '' : $body,
        'timeout' => 20,
        'ignore_errors' => true,
    )));
    $res = @file_get_contents($url, false, $context);
    $status = 0;
    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\b/', $http_response_header[0], $m)) {
        $status = (int) $m[1];
    }
    return array($status, $res === false ? '' : (string) $res);
}

function bp_fs_value($value)
{
    if (!is_array($value)) {
        return null;
    }
    if (array_key_exists('stringValue', $value)) {
        return (string) $value['stringValue'];
    }
    if (array_key_exists('booleanValue', $value)) {
        return (bool) $value['booleanValue'];
    }
    if (array_key_exists('integerValue', $value)) {
        return (int) $value['integerValue'];
    }
    if (array_key_exists('doubleValue', $value)) {
        return (float) $value['doubleValue'];
    }
    if (array_key_exists('timestampValue', $value)) {
        return (string) $value['timestampValue'];
    }
    if (array_key_exists('mapValue', $value)) {
        $out = array();
        $fields = isset($value['mapValue']['fields']) ? $value['mapValue']['fields'] : array();
        foreach ($fields as $key => $item) {
            $out[$key] = bp_fs_value($item);
        }
        return $out;
    }
    if (array_key_exists('arrayValue', $value)) {
        $out = array();
        $items = isset($value['arrayValue']['values']) ? $value['arrayValue']['values'] : array();
        foreach ($items as $item) {
            $out[] = bp_fs_value($item);
        }
        return $out;
    }
    return null;
}

function bp_fs_document($document)
{
    $out = array();
    $fields = isset($document['fields']) ? $document['fields'] : array();
    foreach ($fields as $key => $value) {
        $out[$key] = bp_fs_value($value);
    }
    $name = isset($document['name']) ? (string) $document['name'] : '';
    $out['_id'] = substr($name, strrpos($name, '/') + 1);
    return $out;
}

/**
 * Published posts (same query the build script and public rules allow).
 * @return array|null null when Firestore is unreachable, so callers can fall back instead of reporting "no posts".
 */
function bp_published_posts($refresh = false)
{
    $cacheKey = 'published-posts-v1';
    if (!$refresh) {
        $cached = bp_cache_get($cacheKey, BP_POSTS_TTL);
        if ($cached !== null) {
            $decoded = json_decode($cached, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }
    }
    $query = json_encode(array('structuredQuery' => array(
        'from' => array(array('collectionId' => 'posts')),
        'where' => array('fieldFilter' => array(
            'field' => array('fieldPath' => 'published'),
            'op' => 'EQUAL',
            'value' => array('booleanValue' => true),
        )),
    )));
    list($status, $body) = bp_http('POST', BP_FIRESTORE . ':runQuery', $query);
    // Older posts embed base64 images (hundreds of KB each). Only the "data:image/" prefix matters here
    // (cover → /media/covers URL, inline → skipped); image.php fetches the real bytes on its own.
    $stripped = preg_replace('#data:image/[a-z+.-]+;base64,[A-Za-z0-9+/=]++#', 'data:image/', $body);
    if (is_string($stripped)) {
        $body = $stripped;
    }
    $rows = json_decode($body, true);
    if ($status !== 200 || !is_array($rows)) {
        $stale = bp_cache_get($cacheKey, 0);
        $decoded = $stale === null ? null : json_decode($stale, true);
        return is_array($decoded) ? $decoded : null;
    }
    $posts = array();
    foreach ($rows as $row) {
        if (!isset($row['document'])) {
            continue;
        }
        $post = bp_fs_document($row['document']);
        if (empty($post['published'])) {
            continue;
        }
        $slug = trim(bp_str($post, 'slug'));
        $post['slug'] = $slug !== '' ? $slug : $post['_id'];
        $posts[] = $post;
    }
    usort($posts, function ($a, $b) {
        return strcmp(bp_str($b, 'createdAt'), bp_str($a, 'createdAt'));
    });
    bp_cache_put($cacheKey, json_encode($posts));
    return $posts;
}

/** @return array|null|false post, null when not published/missing, false when Firestore is unreachable. */
function bp_find_post($slug)
{
    $slug = trim($slug);
    if ($slug === '') {
        return null;
    }
    foreach (array(false, true) as $refresh) {
        $posts = bp_published_posts($refresh);
        if ($posts === null) {
            return false;
        }
        foreach ($posts as $post) {
            if ($post['slug'] === $slug || $post['_id'] === $slug) {
                return $post;
            }
        }
    }
    return null;
}

function bp_str($row, $key)
{
    return isset($row[$key]) && is_string($row[$key]) ? $row[$key] : '';
}

/** Mirrors pickLocalized(): requested language, then Arabic, then English, then the fallback. */
function bp_pick($row, $key, $lang, $fallback = '')
{
    $map = isset($row[$key]) && is_array($row[$key]) ? $row[$key] : array();
    $order = $lang === 'en' ? array('en', 'ar') : array('ar', 'en');
    foreach ($order as $code) {
        $value = isset($map[$code]) && is_string($map[$code]) ? trim($map[$code]) : '';
        if ($value !== '') {
            return $value;
        }
    }
    return $fallback;
}

/** Mirrors postAvailableLangs(): a language counts only with its own title and body. */
function bp_post_langs($post)
{
    $langs = array();
    $titles = isset($post['titleI18n']) && is_array($post['titleI18n']) ? $post['titleI18n'] : array();
    $html = isset($post['contentHtml']) && is_array($post['contentHtml']) ? $post['contentHtml'] : array();
    $isHtml = bp_str($post, 'contentMode') === 'html';
    foreach (array('ar', 'en') as $lang) {
        $title = isset($titles[$lang]) && is_string($titles[$lang]) ? trim($titles[$lang]) : '';
        $body = isset($html[$lang]) && is_string($html[$lang]) ? trim($html[$lang]) : '';
        if ($title !== '' && (!$isHtml || $body !== '')) {
            $langs[] = $lang;
        }
    }
    return $langs ? $langs : array('ar');
}

function bp_plain_text($html)
{
    $text = preg_replace('#<(script|style)\b[\s\S]*?</\1>#i', ' ', (string) $html);
    $text = html_entity_decode(strip_tags((string) $text), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return trim(preg_replace('/\s+/u', ' ', $text));
}

function bp_truncate($text, $max)
{
    $text = trim(preg_replace('/\s+/u', ' ', (string) $text));
    if (mb_strlen($text, 'UTF-8') <= $max) {
        return $text;
    }
    $cut = mb_substr($text, 0, $max - 3, 'UTF-8');
    $space = mb_strrpos($cut, ' ', 0, 'UTF-8');
    if ($space !== false && $space >= $max - 40) {
        $cut = mb_substr($cut, 0, $space, 'UTF-8');
    }
    return $cut . '…';
}

function bp_post_html($post, $lang)
{
    return bp_pick($post, 'contentHtml', $lang, '');
}

/** Mirrors resolveMetaTitle(). */
function bp_meta_title($post, $lang)
{
    $value = bp_pick($post, 'metaTitleI18n', $lang);
    if ($value === '') {
        $value = trim(bp_str($post, 'metaTitle'));
    }
    if ($value === '') {
        $value = bp_pick($post, 'titleI18n', $lang, bp_str($post, 'title'));
    }
    return $value;
}

/** Mirrors postMetaDescription(): stored description, excerpt, then the article text. */
function bp_meta_description($post, $lang)
{
    $value = bp_pick($post, 'metaDescriptionI18n', $lang);
    if ($value === '') {
        $value = trim(bp_str($post, 'metaDescription'));
    }
    if ($value === '') {
        $value = bp_pick($post, 'excerptI18n', $lang, bp_str($post, 'excerpt'));
    }
    if ($value === '') {
        $value = bp_plain_text(bp_post_html($post, $lang));
    }
    if ($value === '') {
        $value = bp_str($post, 'body');
    }
    return bp_truncate($value, 160);
}

function bp_absolute($path)
{
    $path = trim((string) $path);
    if ($path === '') {
        return '';
    }
    if (preg_match('#^https?://#i', $path)) {
        return $path;
    }
    return BP_ORIGIN . ($path[0] === '/' ? $path : '/' . $path);
}

/** Cover for the language; base64 covers are exposed through image.php so crawlers get a real URL. */
function bp_cover_url($post, $lang)
{
    $cover = $lang === 'en' && trim(bp_str($post, 'coverUrlEn')) !== '' ? trim(bp_str($post, 'coverUrlEn')) : trim(bp_str($post, 'coverUrl'));
    if ($cover === '') {
        return '';
    }
    if (strpos($cover, 'data:image/') === 0) {
        return BP_ORIGIN . '/media/covers/' . rawurlencode($post['_id']) . '-' . $lang . '.jpg';
    }
    return bp_absolute($cover);
}

function bp_first_html_image($html)
{
    if (preg_match_all('#<img\b[^>]*\bsrc=["\']([^"\']+)["\']#i', (string) $html, $matches)) {
        foreach ($matches[1] as $src) {
            $src = trim($src);
            if ($src !== '' && strpos($src, 'data:') !== 0) {
                return $src;
            }
        }
    }
    return '';
}

/** Share image priority: dedicated og image, cover, first article image, site default. */
function bp_share_image($post, $lang)
{
    $og = trim(bp_str($post, 'ogImage'));
    if ($og !== '' && strpos($og, 'data:') !== 0) {
        return bp_absolute($og);
    }
    $cover = bp_cover_url($post, $lang);
    if ($cover !== '') {
        return $cover;
    }
    $html = isset($post['contentHtml']) && is_array($post['contentHtml']) ? $post['contentHtml'] : array();
    foreach (array($lang, 'ar', 'en') as $code) {
        $src = bp_first_html_image(isset($html[$code]) ? $html[$code] : '');
        if ($src !== '') {
            return bp_absolute($src);
        }
    }
    return BP_ORIGIN . '/og.jpg';
}

function bp_post_url($slug, $lang)
{
    return BP_ORIGIN . '/' . $lang . '/blog/' . rawurlencode($slug) . '/';
}

function bp_iso_date($value)
{
    $time = strtotime((string) $value);
    return $time ? gmdate('Y-m-d\TH:i:s\Z', $time) : '';
}

function bp_e($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Mirrors siteLinkPath() in src/lib/post-html.ts: boatpro.club links → same-language path without utm_*. */
function bp_site_link($href, $lang)
{
    $href = trim(html_entity_decode((string) $href, ENT_QUOTES, 'UTF-8'));
    if (preg_match('#^(?:https?:)?//(?:www\.)?boatpro\.club(?=[/?\#]|$)(.*)$#i', $href, $m)) {
        $rest = $m[1];
    } elseif (preg_match('#^/(?!/)#', $href)) {
        $rest = $href;
    } else {
        return null;
    }
    if ($rest === '' || $rest[0] !== '/') {
        $rest = '/' . $rest;
    }
    $parts = parse_url('https://boatpro.club' . $rest);
    if ($parts === false) {
        return null;
    }
    $path = isset($parts['path']) ? $parts['path'] : '/';
    $query = array();
    if (isset($parts['query'])) {
        foreach (explode('&', $parts['query']) as $pair) {
            if ($pair !== '' && !preg_match('/^utm_/i', $pair)) {
                $query[] = $pair;
            }
        }
    }
    $path = preg_replace('#^/(ar|en)(?=/|$)#', '', $path);
    if (preg_match('#^/(?:media|seo|assets)/|\.[a-z0-9]{2,5}$#i', $path)) {
        $target = $path;
    } else {
        $path = rtrim($path, '/');
        if (preg_match('#^/(admin|login)(/|$)#', $path)) {
            $target = $path;
        } else {
            $target = '/' . $lang . ($path === '' ? '/' : $path . '/');
        }
    }
    return $target . ($query ? '?' . implode('&', $query) : '') . (isset($parts['fragment']) ? '#' . $parts['fragment'] : '');
}

/** Minimal server-side cleanup of trusted admin HTML for the crawler copy of the article. */
function bp_clean_article_html($html, $fallbackAlt, $lang)
{
    $html = preg_replace('#<(script|style|iframe|object|embed|form|noscript)\b[\s\S]*?</\1\s*>#i', '', (string) $html);
    $html = preg_replace('#<(script|style|iframe|object|embed|form|link|meta)\b[^>]*>#i', '', (string) $html);
    $html = preg_replace('#\son[a-z]+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)#i', '', (string) $html);
    $html = preg_replace('#(href|src)\s*=\s*(["\'])\s*javascript:[^"\']*\2#i', '$1="#"', (string) $html);
    // The page title is the only <h1>; <h1> pasted inside an article is a section heading. Mirrors sanitizePostHtml().
    $html = preg_replace('#<(/?)h1\b#i', '<$1h2', (string) $html);
    $html = preg_replace_callback('#<a\b[^>]*>#i', function ($m) use ($lang) {
        if (!preg_match('#\shref\s*=\s*(["\'])([^"\']*)\1#i', $m[0], $h)) {
            return $m[0];
        }
        $link = bp_site_link($h[2], $lang);
        if ($link === null) {
            return $m[0];
        }
        $tag = str_replace($h[0], ' href="' . bp_e($link) . '"', $m[0]);
        return preg_replace('#\s(?:target|rel)\s*=\s*(["\'])[^"\']*\1#i', '', $tag);
    }, (string) $html);
    // Legacy base64 images stay out of the crawler copy (they can be hundreds of KB); the app renders them.
    $html = preg_replace('#<img\b[^>]*\bsrc=["\']data:[^"\']*["\'][^>]*>#i', '', (string) $html);
    $alt = bp_e($fallbackAlt);
    $html = preg_replace_callback('#<img\b[^>]*>#i', function ($m) use ($alt) {
        $tag = $m[0];
        if (!preg_match('#\salt\s*=\s*(["\'])\s*[^"\'\s]#i', $tag)) {
            $tag = preg_replace('#\salt\s*=\s*(["\'])\s*\1#i', '', $tag);
            $tag = preg_replace('#^<img\b#i', '<img alt="' . $alt . '"', $tag);
        }
        if (!preg_match('#\sloading\s*=#i', $tag)) {
            $tag = preg_replace('#^<img\b#i', '<img loading="lazy"', $tag);
        }
        return $tag;
    }, (string) $html);
    return (string) $html;
}

function bp_json_ld($data)
{
    return '<script type="application/ld+json" data-seo-ssr>'
        . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP)
        . '</script>';
}
