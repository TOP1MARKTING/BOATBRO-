<?php
/**
 * /sitemap.xml (rewritten here by .htaccess): static pages + every published, indexable post, read live
 * from Firestore so new articles appear without a rebuild. Falls back to the build-time sitemap.xml.
 */
define('BP_SEO', 1);
require __DIR__ . '/lib.php';

$posts = bp_published_posts();

header('Content-Type: application/xml; charset=UTF-8');
header('Cache-Control: public, max-age=300');

$routeManifestPath = __DIR__ . '/public-routes.json';
$routeManifest = is_file($routeManifestPath) ? json_decode(file_get_contents($routeManifestPath), true) : null;
if (!is_array($routeManifest) || !isset($routeManifest['routes']) || !is_array($routeManifest['routes'])) {
    http_response_code(500);
    exit('Sitemap route manifest missing or invalid. Run the production build and deploy its output.');
}

if ($posts === null) {
    readfile(dirname(__DIR__) . '/sitemap.xml');
    exit;
}

$staticPaths = $routeManifest['routes'];

function bp_sitemap_url($loc, $alternates, $lastmod, $images)
{
    $xml = "  <url>\n    <loc>" . bp_e($loc) . "</loc>\n";
    if ($lastmod !== '') {
        $xml .= '    <lastmod>' . bp_e($lastmod) . "</lastmod>\n";
    }
    foreach ($alternates as $hreflang => $href) {
        $xml .= '    <xhtml:link rel="alternate" hreflang="' . bp_e($hreflang) . '" href="' . bp_e($href) . "\" />\n";
    }
    foreach ($images as $image) {
        $xml .= "    <image:image>\n      <image:loc>" . bp_e($image) . "</image:loc>\n    </image:image>\n";
    }
    return $xml . "  </url>\n";
}

$latestPost = '';
foreach ($posts as $post) {
    if (empty($post['noindex'])) {
        $date = bp_iso_date(bp_str($post, 'updatedAt') ?: bp_str($post, 'createdAt'));
        if ($date > $latestPost) {
            $latestPost = $date;
        }
    }
}

$body = '';
foreach ($staticPaths as $path) {
    $suffix = $path === '/' ? '/' : $path . '/';
    $alternates = array(
        'ar' => BP_ORIGIN . '/ar' . $suffix,
        'en' => BP_ORIGIN . '/en' . $suffix,
        'x-default' => BP_ORIGIN . '/ar' . $suffix,
    );
    foreach (array('ar', 'en') as $lang) {
        $body .= bp_sitemap_url(BP_ORIGIN . '/' . $lang . $suffix, $alternates, $path === '/blog' ? $latestPost : '', array());
    }
}

$seen = array();
foreach ($posts as $post) {
    if (!empty($post['noindex']) || isset($seen[$post['slug']])) {
        continue;
    }
    $seen[$post['slug']] = true;
    $langs = bp_post_langs($post);
    $alternates = array();
    if (count($langs) > 1) {
        foreach ($langs as $lang) {
            $alternates[$lang] = bp_post_url($post['slug'], $lang);
        }
        $alternates['x-default'] = bp_post_url($post['slug'], in_array('ar', $langs, true) ? 'ar' : $langs[0]);
    }
    $lastmod = bp_iso_date(bp_str($post, 'updatedAt') ?: bp_str($post, 'createdAt'));
    foreach ($langs as $lang) {
        $image = bp_share_image($post, $lang);
        $images = $image !== BP_ORIGIN . '/og.jpg' ? array($image) : array();
        $body .= bp_sitemap_url(bp_post_url($post['slug'], $lang), $alternates, $lastmod, $images);
    }
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' . "\n";
echo $body;
echo "</urlset>\n";
