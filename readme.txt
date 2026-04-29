=== SmartFrame Images ===
Contributors: SmartFrame, Albano Toska
Tags: images, image library, image search, image embed, publishers
Requires at least: 5.9
Stable tag: 1.3.0
Tested up to: 6.9
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Replace all of your images with SmartFrame Image, a free and fast alternative for embedding images.

### Third-Party Service Reliance ###
This plugin relies on the SmartFrame Cloud service to fetch and embed images.
External services communicating with this plugin include:
- api2.smartframe.io (For API search queries)
- static.smartframe.io (For delivering the embed script)
- smartframe.com / smartframe.io / sfio.xyz (For image delivery and routing)
[Terms and Conditions](https://smartframe.io/terms/)
[Privacy Policy](https://smartframe.io/privacy-policy/)

== Installation ==
1. Install and activate the plugin from the WordPress plugin directory.
2. Navigate to Dashboard > Settings > SmartFrame Library.
3. Hit “Click here to generate an API key.” Log in to your SmartFrame account when prompted – you will be redirected to the Integration section where your API key is displayed.
4. In the Integration section, optionally name your API, then click “Generate new API access token.” Copy the token from the confirmation pop-up.
5. Return to the plugin settings page, paste the API key into the field, and click Save Changes.
6. Open any post or page, add a SmartFrame block using the block inserter, and search for an image to embed.

If you run into any issues, please contact the [SmartFrame support team](mailto:support@smartframe.io).

== Description ==
Search, embed, and publish from a library of over 55 million free-to-embed images – without leaving WordPress. Built for publishers who need speed, protection, and SEO integrity.

== SmartFrame Images: Embed editorial images for free in WordPress ==
SmartFrame Images gives your editorial team access to over 55 million images, searchable and embeddable directly from inside the WordPress editor.
No downloads. No uploads. No switching between platforms. Search for an image, click to embed, and publish – the entire workflow happens inside the CMS your team already uses.
The plugin integrates the SmartFrame Images library and secure embed technology into WordPress, replacing the slow default workflow of sourcing images on external platforms, downloading files, and re-uploading them to your site.
For publishers managing high volumes of editorial content, that means faster turnaround, a cleaner workflow, and images that are protected the moment they go live.

== Embed over 55 million images – at no cost ==
The SmartFrame Images library contains over 55 million images spanning news, sports, entertainment, lifestyle, and more – all available for publishers to embed at no cost.
Your team can search the full library from inside any post or page and embed directly into any article. A free SmartFrame account is all that is required to get started.

== Built for editorial teams publishing at scale ==
SmartFrame is designed for the realities of newsroom publishing – speed, volume, and accuracy. The plugin is used by news organizations, sports publishers, media platforms, and content networks that need a reliable image workflow that does not slow down their teams.

== Image protection as standard ==
SmartFrame securely embeds streamed images in its proprietary format, rather than exposing original files. Images published on your site cannot be easily downloaded, scraped, or reused without authorization – an important safeguard for publishers working with premium visual content.
This protection applies automatically. There are no additional steps for your editorial team and no change to the publishing process.

== Maintain SEO and syndication integrity ==
SmartFrame handles the technical complexity of image delivery across different environments automatically. SmartFrame serves standard image previews to search engines and aggregators where required. This means your content is indexed correctly by Google, with no loss of SEO value and no manual configuration required.

== Enterprise infrastructure, built for high-traffic publishing ==
The SmartFrame Cloud delivers images through a globally distributed, high-availability infrastructure built on a scalable AWS-based platform. It features autoscaling, load balancing, global delivery, and 99.9% uptime – designed specifically for the demands of high-traffic publishing environments. SmartFrame Images is trusted by major international publishers across news and sports.

== Works inside your existing WordPress workflow ==
SmartFrame Images integrates natively with both the Gutenberg block editor and the Classic Editor. The plugin includes a dedicated SmartFrame image block, featured image support, built-in search with history tracking, and improved filtering and sorting. There is nothing new for your editorial team to learn – the plugin fits directly into the workflow they already have.

== Getting started takes minutes ==
Install and activate the plugin, connect your free SmartFrame account via your API key, and your team can start embedding images immediately. Once connected, there is no ongoing configuration required. SmartFrame Technologies Ltd is a GDPR-compliant company based in Europe – your data is never sold or shared with third parties.


### COMPATIBILITY NOTES ###


== Frequently Asked Questions ==

= Do I need a SmartFrame account to use this plugin? =

Yes, a free SmartFrame account is required. You can register at [smartframe.com](https://smartframe.com/). Your SmartFrame account will remain free forever – there are no hidden costs or subscription fees to unlock additional functionality.

= How many images are available? =

The SmartFrame library contains over 55 million images covering news, sports, entertainment, lifestyle, and more – all searchable directly from inside the WordPress editor. The library is updated on a daily basis.

= Will the plugin damage my SEO? =

No. SmartFrame is designed with the publisher’s SEO requirements in mind. The plugin automatically detects search engine crawlers and serves standard image previews, ensuring your content is indexed correctly by Google. There is no loss of SEO value and no manual configuration needed. In fact, SmartFrame’s built-in metadata, alt text, and tags improve discoverability for search and generative engines.

= Does this work with high-traffic publishing environments? =
Yes. The SmartFrame Cloud is purpose-built for large-scale publishing. The infrastructure features global delivery, autoscaling, load balancing, and 99.9% uptime, and is used by major international news and sports publishers.

= Does the plugin work with Gutenberg and Classic Editor? =

Yes. SmartFrame Images works natively with both the Gutenberg block editor and the Classic Editor, with no additional configuration required.

= How is this different from just uploading images to WordPress? =

Standard WordPress image uploads expose the full image file, which can be downloaded, scraped, or reused without authorization. SmartFrame delivers images as secure embedded images, protecting content from unauthorized reuse. Images also benefit from global cloud delivery rather than your server’s own resources, and your team never needs to leave the CMS to source images in the first place.

= Is SmartFrame GDPR compliant? =

Yes. SmartFrame Technologies Ltd is a GDPR-compliant business based in Europe. Your personal data and registration details are never sold or shared with third parties. See the SmartFrame privacy policy at [https://smartframe.io/privacy-policy/](https://smartframe.io/privacy-policy/) for full details.


== Development and Source Code ==

This plugin uses modern JavaScript (React/Gutenberg blocks) and Tailwind CSS. The files located in the `build/` folder are compiled and minified.

The uncompiled, human-readable source code is located in the `src/` folder of this plugin. The full development repository can also be found publicly at:
https://github.com/smartframe-wordpress/smartframe-images

### How to Build from Source
To compile the source code yourself, you will need Node.js and npm installed.

1. Open your terminal and navigate to the root directory of this plugin.
2. Install the necessary development dependencies by running:
   `npm install`
3. To compile and minify the assets into the `build/` directory, run:
   `npm run build`
4. To create an installable plugin zip file run:
    `npm run plugin-zip`
5. For active development (which watches for changes and recompiles automatically), run:
   `npm run start`


== Changelog ==

= 1.0.0 =
* Initial stable release

= 1.0.1 =
* General bug fixes

= 1.1.0 =
* Introduced search history
* Added option to disable captions
* Refined settings page

= 1.2.0 =
* Introduced improved sort and search filtering
* Widget enabled for all user roles with access to the editor

= 1.2.1 =
* General performance enhancements
* Improved thumbnail management for featured images

= 1.2.2 =
* General visual style fixes

= 1.2.3 =
* Tested up to WordPress 6.9
* Cleanup and shortcode mode improvements for featured image

= 1.2.4 =
* Fixed an issue where SmartFrame embed attributes were stripped for certain user roles

= 1.2.5 =
* Fixed an issue where manually inserted embed codes triggered a validation error
* General layout fixes in Classic Editor

= 1.2.6 =
* General performance enhancements and bug fixes in Gutenberg

= 1.2.7 =
* Improved search history retention management

= 1.2.8 =
* Enhanced frontend rendering with a custom class on the SmartFrame embed element
* Cleaned up shortcode embedding mode

= 1.2.9 =
* Updated featured image thumbnail URL handling
* Added support for bot and aggregator detection

= 1.3.0 =
* Added support for RSS feeds and aggregators – standard image thumbnails are now served in place of interactive embeds for feed readers and content aggregators
* Migrated Classic Editor shortcode handling to native WordPress TinyMCE view modules for improved compatibility and stability