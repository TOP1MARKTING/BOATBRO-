<?php
/**
 * /ar/blog/{slug}/ and /en/blog/{slug}/ (rewritten here by .htaccess).
 * Serves the SPA shell with this post's title, description, canonical, hreflang, Open Graph, Twitter and
 * JSON-LD already in the HTML, plus a crawler-readable copy of the article. The app then boots as usual
 * (main.tsx removes the [data-seo-ssr] tags and the router renders the same metadata client-side).
 */
define('BP_SEO', 1);
require __DIR__ . '/lib.php';

$lang = isset($_GET['lang']) && $_GET['lang'] === 'en' ? 'en' : 'ar';
$slug = isset($_GET['slug']) ? (string) $_GET['slug'] : '';
$slug = mb_substr(trim(rawurldecode($slug), "/ \t\n"), 0, 200, 'UTF-8');

$shell = @file_get_contents(dirname(__DIR__) . '/index.html');
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=0, must-revalidate');
if ($shell === false) {
    http_response_code(500);
    exit('Site shell missing.');
}

$post = bp_find_post($slug);

if ($post === false) {
    // Firestore unreachable: hand over to the app instead of reporting a false 404.
    echo $shell;
    exit;
}

$isRtl = $lang === 'ar';
$siteName = $isRtl ? BP_SITE_NAME_AR : BP_SITE_NAME_EN;

function bp_render($shell, $lang, $title, $headTags, $rootHtml)
{
    $dir = $lang === 'ar' ? 'rtl' : 'ltr';
    $html = preg_replace('#<html\b[^>]*>#i', '<html lang="' . $lang . '" dir="' . $dir . '">', $shell, 1);
    $html = preg_replace('#<title\b[^>]*>[\s\S]*?</title>#i', '<title data-seo-ssr>' . bp_e($title) . '</title>', $html, 1);
    $html = preg_replace('#<meta\s+(?:data-seo-ssr\s+)?name="description"[\s\S]*?/?>#i', '', $html, 1);
    $html = preg_replace('#</head>#i', implode("\n    ", $headTags) . "\n  </head>", $html, 1);
    $html = str_replace('<div id="root"></div>', '<div id="root">' . $rootHtml . '</div>', $html);
    return $html;
}

if ($post === null) {
    http_response_code(404);
    header('X-Robots-Tag: noindex, nofollow');
    $title = $isRtl ? 'الصفحة غير موجودة | ' . $siteName : 'Page not found | ' . $siteName;
    echo bp_render($shell, $lang, $title, array('<meta name="robots" content="noindex, nofollow" data-seo-ssr>'), '');
    exit;
}

$langs = bp_post_langs($post);
$canonicalLang = in_array($lang, $langs, true) ? $lang : $langs[0];
$url = bp_post_url($post['slug'], $canonicalLang);
$noindex = !empty($post['noindex']);

$headline = bp_pick($post, 'titleI18n', $lang, bp_str($post, 'title'));
$metaTitle = bp_meta_title($post, $lang);
$title = $metaTitle . ' | ' . $siteName;
$description = bp_meta_description($post, $lang);
$image = bp_share_image($post, $lang);
$imageAlt = bp_pick($post, 'coverAlt', $lang, $headline);
$category = bp_pick($post, 'categoryI18n', $lang, bp_str($post, 'category'));
$author = bp_pick($post, 'authorI18n', $lang, bp_str($post, 'authorName'));
$excerpt = bp_pick($post, 'excerptI18n', $lang, bp_str($post, 'excerpt'));
$published = bp_iso_date(bp_str($post, 'createdAt'));
$modified = bp_iso_date(bp_str($post, 'updatedAt') ?: bp_str($post, 'createdAt'));
$tags = isset($post['tags'][$lang]) && is_array($post['tags'][$lang]) ? $post['tags'][$lang] : array();
$locale = $lang === 'ar' ? 'ar_SA' : 'en_US';

$head = array(
    '<meta name="description" content="' . bp_e($description) . '" data-seo-ssr>',
    '<meta name="robots" content="' . ($noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large') . '" data-seo-ssr>',
);
if (!$noindex) {
    $head[] = '<link rel="canonical" href="' . bp_e($url) . '" data-seo-ssr>';
    if (count($langs) > 1) {
        foreach ($langs as $code) {
            $head[] = '<link rel="alternate" hreflang="' . $code . '" href="' . bp_e(bp_post_url($post['slug'], $code)) . '" data-seo-ssr>';
        }
        $default = in_array('ar', $langs, true) ? 'ar' : $langs[0];
        $head[] = '<link rel="alternate" hreflang="x-default" href="' . bp_e(bp_post_url($post['slug'], $default)) . '" data-seo-ssr>';
    }
}
$og = array(
    'og:title' => $title,
    'og:description' => $description,
    'og:type' => 'article',
    'og:url' => $url,
    'og:image' => $image,
    'og:image:alt' => $imageAlt,
    'og:locale' => $locale,
    'og:site_name' => 'BoatPro',
);
foreach ($og as $property => $content) {
    $head[] = '<meta property="' . $property . '" content="' . bp_e($content) . '" data-seo-ssr>';
}
foreach ($langs as $code) {
    if ($code !== $lang) {
        $head[] = '<meta property="og:locale:alternate" content="' . ($code === 'ar' ? 'ar_SA' : 'en_US') . '" data-seo-ssr>';
    }
}
if ($published !== '') {
    $head[] = '<meta property="article:published_time" content="' . bp_e($published) . '" data-seo-ssr>';
}
if ($modified !== '') {
    $head[] = '<meta property="article:modified_time" content="' . bp_e($modified) . '" data-seo-ssr>';
}
if ($category !== '') {
    $head[] = '<meta property="article:section" content="' . bp_e($category) . '" data-seo-ssr>';
}
foreach ($tags as $tag) {
    $head[] = '<meta property="article:tag" content="' . bp_e($tag) . '" data-seo-ssr>';
}
$twitter = array(
    'twitter:card' => 'summary_large_image',
    'twitter:title' => $title,
    'twitter:description' => $description,
    'twitter:image' => $image,
    'twitter:image:alt' => $imageAlt,
);
foreach ($twitter as $name => $content) {
    $head[] = '<meta name="' . $name . '" content="' . bp_e($content) . '" data-seo-ssr>';
}

$article = array(
    '@context' => 'https://schema.org',
    '@type' => 'Article',
    'headline' => mb_substr($metaTitle, 0, 110, 'UTF-8'),
    'description' => $description,
    'image' => array($image),
    'author' => $author !== ''
        ? array('@type' => 'Person', 'name' => $author)
        : array('@type' => 'Organization', 'name' => 'BoatPro', 'url' => BP_ORIGIN),
    'publisher' => array(
        '@type' => 'Organization',
        'name' => 'BoatPro',
        'logo' => array('@type' => 'ImageObject', 'url' => BP_ORIGIN . '/logo.png'),
    ),
    'mainEntityOfPage' => array('@type' => 'WebPage', '@id' => $url),
    'inLanguage' => $lang,
);
if ($published !== '') {
    $article['datePublished'] = $published;
}
if ($modified !== '') {
    $article['dateModified'] = $modified;
}
if ($category !== '') {
    $article['articleSection'] = $category;
}
if ($tags) {
    $article['keywords'] = implode(', ', $tags);
}
$head[] = bp_json_ld($article);
$head[] = bp_json_ld(array(
    '@context' => 'https://schema.org',
    '@type' => 'BreadcrumbList',
    'itemListElement' => array(
        array('@type' => 'ListItem', 'position' => 1, 'name' => $isRtl ? 'الرئيسية' : 'Home', 'item' => BP_ORIGIN . '/' . $lang . '/'),
        array('@type' => 'ListItem', 'position' => 2, 'name' => $isRtl ? 'المدونة' : 'Blog', 'item' => BP_ORIGIN . '/' . $lang . '/blog/'),
        array('@type' => 'ListItem', 'position' => 3, 'name' => $metaTitle, 'item' => $url),
    ),
));
$faq = isset($post['faq']) && is_array($post['faq']) ? $post['faq'] : array();
$faqItems = array();
foreach ($faq as $item) {
    $question = is_array($item) ? bp_pick($item, 'question', $lang) : '';
    $answer = is_array($item) ? bp_pick($item, 'answer', $lang) : '';
    if ($question !== '' && $answer !== '') {
        $faqItems[] = array(
            '@type' => 'Question',
            'name' => $question,
            'acceptedAnswer' => array('@type' => 'Answer', 'text' => $answer),
        );
    }
}
if ($faqItems) {
    $head[] = bp_json_ld(array('@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => $faqItems));
}

$cover = bp_cover_url($post, $lang);
$root = '<article class="mx-auto max-w-3xl px-5 pt-24 pb-20" dir="' . ($isRtl ? 'rtl' : 'ltr') . '">';
if ($category !== '') {
    $root .= '<p class="text-[13px] font-medium text-gold-ink">' . bp_e($category) . '</p>';
}
$root .= '<h1 class="mt-4 font-display text-4xl font-semibold leading-snug text-navy md:text-5xl">' . bp_e($headline) . '</h1>';
if ($author !== '') {
    $root .= '<p class="mt-4 text-sm leading-7 text-muted-foreground">' . bp_e($author) . '</p>';
}
if ($cover !== '') {
    $root .= '<img src="' . bp_e($cover) . '" alt="' . bp_e($imageAlt) . '" width="1200" height="675" class="mt-8 aspect-[16/9] w-full rounded-[1.6rem] object-cover">';
}
if ($excerpt !== '') {
    $root .= '<p class="mt-8 text-lg leading-9 text-foreground/85">' . bp_e($excerpt) . '</p>';
}
$root .= '<div class="bp-article mt-8">' . bp_clean_article_html(bp_post_html($post, $lang), $headline, $lang) . '</div>';
$root .= '</article>';

echo bp_render($shell, $lang, $title, $head, $root);
