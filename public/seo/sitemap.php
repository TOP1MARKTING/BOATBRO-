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
header('X-Robots-Tag: index, follow');

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

function bp_sitemap_url($loc, $lastmod, $changefreq, $priority)
{
    $xml = "  <url>\n    <loc>" . bp_e($loc) . "</loc>\n";
    if ($lastmod !== '') {
        $xml .= '    <lastmod>' . bp_e($lastmod) . "</lastmod>\n";
    }
    $xml .= '    <changefreq>' . bp_e($changefreq) . "</changefreq>\n";
    $xml .= '    <priority>' . bp_e($priority) . "</priority>\n";
    return $xml . "  </url>\n";
}

$latestPost = '';
foreach ($posts as $post) {
    if (empty($post['noindex'])) {
        $date = substr(bp_iso_date(bp_str($post, 'updatedAt') ?: bp_str($post, 'createdAt')), 0, 10);
        if ($date > $latestPost) {
            $latestPost = $date;
        }
    }
}

$body = '';
foreach ($staticPaths as $path) {
    $suffix = $path === '/' ? '/' : $path . '/';
    $hints = array(
        '/' => array('weekly', '1.0'),
        '/about' => array('monthly', '0.8'),
        '/features' => array('weekly', '0.9'),
        '/app' => array('monthly', '0.7'),
        '/contact' => array('monthly', '0.85'),
        '/blog' => array('weekly', '0.75'),
    );
    $hint = isset($hints[$path]) ? $hints[$path] : array('monthly', '0.7');
    foreach (array('ar', 'en') as $lang) {
        $body .= bp_sitemap_url(
            BP_ORIGIN . '/' . $lang . $suffix,
            $path === '/blog' ? $latestPost : '',
            $hint[0],
            $hint[1]
        );
    }
}

$seen = array();
foreach ($posts as $post) {
    if (!empty($post['noindex']) || isset($seen[$post['slug']])) {
        continue;
    }
    $seen[$post['slug']] = true;
    $langs = bp_post_langs($post);
    $lastmod = substr(bp_iso_date(bp_str($post, 'updatedAt') ?: bp_str($post, 'createdAt')), 0, 10);
    foreach ($langs as $lang) {
        $body .= bp_sitemap_url(bp_post_url($post['slug'], $lang), $lastmod, 'monthly', '0.7');
    }
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
echo $body;
echo "</urlset>\n";
