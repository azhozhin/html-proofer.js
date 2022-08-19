# html-proofer.js

JavaScript port of [gjtorikian/html-proofer](https://github.com/gjtorikian/html-proofer). 

Snapshot state: `93ba616eb45b7ba844197fc29824995e8fcd2279`
Version: `4.0.1` 

![](https://img.shields.io/github/checks-status/azhozhin/html-proofer.js/main)

## Configuration

The `HTMLProofer` constructor takes an optional hash of additional options:

| Option                 | Description                                                                                                                                         | Default                |
|:-----------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------|:-----------------------|
| `allow_hash_href`      | If `true`, assumes `href="#"` anchors are valid                                                                                                     | `true`                 |
| `allow_missing_href`   | If `true`, does not flag `a` tags missing `href`. In HTML5, this is technically allowed, but could also be human error.                             | `false`                |
| `assume_extension`     | Automatically add specified extension to files for internal links, to allow extensionless URLs (as supported by most servers)                       | `.html`                |
| `checks`               | An array of Strings indicating which checks you want to run                                                                                         | `Links,Images,Scripts` | 
| `check_external_hash`  | Checks whether external hashes exist (even if the webpage exists)                                                                                   | `true`                 |
| `check_sri`            | Check that `<link>` and `<script>` external resources use SRI                                                                                       | `false`                |
| `directory_index_file` | Sets the file to look for when a link refers to a directory.                                                                                        | `index.html`           |
| `disable_external`     | If `true`, does not run the external link checker                                                                                                   | `false`                |
| `enforce_https`        | Fails a link if it's not marked as `https`.                                                                                                         | `true`                 |
| `extensions`           | An array of Strings indicating the file extensions you would like to check (including the dot)                                                      | `['.html']`            |
| `ignore_empty_alt`     | If `true`, ignores images with empty/missing alt tags (in other words, `<img alt>` and `<img alt="">` are valid; set this to `false` to flag those) | `true`                 |
| `ignore_files`         | An array of Strings or RegExps containing file paths that are safe to ignore.                                                                       | `[]`                   |
| `ignore_empty_mailto`  | If `true`, allows `mailto:` `href`s which do not contain an email address.                                                                          | `false`                |
| `ignore_missing_alt`   | If `true`, ignores images with missing alt tags                                                                                                     | `false`                |
| `ignore_status_codes`  | An array of numbers representing status codes to ignore.                                                                                            | `[]`                   |
| `ignore_urls`          | An array of Strings or RegExps containing URLs that are safe to ignore. This affects all HTML attributes, such as `alt` tags on images.             | `[]`                   |
| `log_level`            | Sets the logging level. One of `debug`, `info`, `warn`, or `error`                                                                                  | `info`                 |
| `only_4xx`             | Only reports errors for links that fall within the 4xx status code range.                                                                           | `false`                |
| `root_dir`             | The absolute path to the directory serving your html-files.                                                                                         | `""`                   |
| `swap_attributes`      | JSON-formatted config that maps element names to the preferred attribute to check                                                                   | `{}`                   |
| `swap_urls`            | A hash containing key-value pairs of `RegExp => String`. It transforms URLs that match `RegExp` into `String` via `gsub`.                           | `{}`                   |
