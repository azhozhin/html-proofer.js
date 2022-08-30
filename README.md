# html-proofer.js

JavaScript port of [gjtorikian/html-proofer](https://github.com/gjtorikian/html-proofer) (Hash: `93ba616eb45b7ba844197fc29824995e8fcd2279`, Version: `4.0.1`) 

Currently, the library is fully working and I'm using it internally for my projects.

## Motivation

I've used an original html-proofer for many projects to check static documentation link integrity.
I was running it with locally installed ruby, locally with ruby in docker, on CI runner and it was working fine.

But in some cases, I had a requirement to create a custom set of checks with pretty complex logic including integration
with non-public services. Ruby is not a wide-spread programming language in my working environment it was pretty hard to find
someone who either know Ruby or was willing to learn a new language just to maintain or occasionally write new checks.

I've decided to port html-proofer from Ruby to JavaScript as JavaScript was already a part of the stack I was using and
it perfectly complements other automated tests for static sites. JavaScript is a mainstream language and well known withing
the dev community, so it is not a problem anymore to find developers with the required skills.

I've tried to keep the original html-proofer API as much as possible, but some APIs I had to change to be better consumed from
JavaScript world.

## Usage

Disregard the method of usage the library should be installed first.

Install in current folder
```bash
npm install html-proofer.js
```
or install globally (it would be available in any folder)
```bash
npm install -g html-proofer.js
```

### Use as CLI

Running for current folder:
```bash
npx htmlproofer .
```

Output would look like the following (if there are no issues detected):
```bash
Running 3 checks (Links, Images, Scripts) in . on *.html files...

Ran on X files!

HTML-Proofer finished successfully.
```


### Use as Library

You can import library and implement custom checks or just run default set of checks on desired file/folder. 

Let's assume we want to check that our html files does not contain mailto links to octocat@github.com

mailto_octocat.html
```html 
<h1>Hello</h1>

<a href="mailto:octocat@github.com">hey!</a>

<a href="mailto:someoneelse@github.com">ho!</a>
```

You can create custom check class
```javascript
const {HTMLProofer, Check, DummyReporter} = require('html-proofer.js')

class MailToOctocat extends Check {
  internalRun() {
    for (const node of this.html.css('a')) {
      const link = this.createElement(node)

      if (link.isIgnore()) {
        continue
      }

      if (this.isMailtoOctocat(link)) {
        this.addFailure(`Don't email the Octocat directly!`, link.line)
      }
    }
  }

  isMailtoOctocat(link) {
    return link.url.rawAttribute === 'mailto:octocat@github.com'
  }
}
```

Now we are ready to submit our custom check to HTMLProofer
```javascript
const reporter = new DummyReporter()

const options = {
  checks: [MailToOctocat],
}

const path = '<directory>'

main = async () => {
  const proofer = HTMLProofer.checkDirectory(path, options, reporter)
  await proofer.run()
  console.log(proofer.failedChecks)
}

main()
```

as a result it should report something like that:
```bash
Running 1 check (MailToOctocat) in <directory> on *.html files...

Ran on 1 file!

HTML-Proofer found 1 failure!

[
  Failure {
    path: '<directory>/mailto_octocat.html',
    checkName: 'MailToOctocat',
    description: "Don't email the Octocat directly!",
    line: 3,
    status: null,
    content: null
  }
]
```

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
| `ancestors_ignorable`  | Check ancestor elements for `data-proofer-ignore` attribute, this could cause performance degradation for large sites (disable it if not required)  | `true`                 | 
