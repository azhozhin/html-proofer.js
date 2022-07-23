#!/usr/bin/env node

import {program} from 'commander'
import {VERSION} from '../lib/html-proofer/version.js'
import {isDirectory} from '../lib/html-proofer/utils.js'
import {HTMLProofer} from '../lib/html-proofer.js'
import {all_checks} from '../lib/html-proofer/checks.js'

program.
    version(VERSION).
    description(`Test your rendered HTML files to make sure they're accurate.\n` +
        `Runs the HTML-Proofer suite on the files in PATH. For more details, see the README.`).
    option(
        '--allow-hash-href',
        'If `true`, assumes `href="#"` anchors are valid',
        true).
    option(
        '--allow-missing-href',
        'If `true`, does not flag `a` tags missing `href`. In HTML5, this is technically allowed, but could also be human error.',
        false).
    option(
        '--as-links [links]',
        'Assumes that `PATH` is a comma-separated array of links to check.',
        false).
    option(
        '--assume-extension [ext]',
        'Automatically add specified extension to files for internal links, to allow extensionless URLs (as supported by most servers) (default: `.html`).',
        '.html').
    option(
        '--checks [checks]',
        'A comma-separated list of Strings indicating which checks you want to run (default: \'Links,Images,Scripts\')',
        '\'Links,Images,Scripts\'').
    option(
        '--check-external-hash',
        'Checks whether external hashes exist (even if the webpage exists) (default: `true`).',
        true).
    option(
        '--check-sri',
        'Check that "<link>" and "<script>" external resources use SRI (default: "false").',
        false).
    option(
        '--directory-index-file [filename]',
        'Sets the file to look for when a link refers to a directory. (default: `index.html`)',
        'index.html').
    option(
        '--disable-external',
        'If `true`, does not run the external link checker (default: `false`)',
        false).
    option(
        '--enforce-https',
        'Fails a link if it\'s not marked as `https` (default: `true`).',
        true).
    option(
        '--extensions [extensions]',
        'A comma-separated list of Strings indicating the file extensions you would like to check (including the dot)',
        ['.html']).
    option(
        '--ignore-empty-alt',
        'If `true`, ignores images with empty/missing alt tags (in other words, `<img alt>` and `<img alt="">` are valid; set this to `false` to flag those)',
        true).
    option(
        '--ignore-files file1,[file2,...]',
        'A comma-separated list of Strings or RegExps containing file paths that are safe to ignore',
        []).
    option(
        '--ignore-empty-mailto',
        'If `true`, allows `mailto:` `href`s which do not contain an email address',
        false).
    option(
        '--ignore-missing-alt',
        'If `true`, ignores images with missing alt tags',
        false).
    option(
        '--ignore-status-codes [123, xxx, ...]',
        'A comma-separated list of numbers representing status codes to ignore.',
        []).
    option(
        '--ignore-urls [link1, link2,...]',
        'A comma-separated list of Strings or RegExps containing URLs that are safe to ignore. This affects all HTML attributes, such as `alt` tags on images.',
        []).
    option(
        '--log-level [level]',
        'Sets the logging level, as determined by Yell. One of `debug`, `info`, `warn`, or `error`.',
        'info').
    option(
        '--only-4xx',
        'Only reports errors for links that fall within the 4xx status code range',
        false).
    option(
        '--root-dir [path]',
        'The absolute path to the directory serving your html-files.',
        '').
    option(
        '--swap-attributes [config]',
        'JSON-formatted config that maps element names to the preferred attribute to check.',
        '{}').
    option(
        '--swap-urls [re:string, ...]',
        'A comma-separated list containing key-value pairs of `RegExp => String`. It transforms URLs that match `RegExp` into `String` via `gsub`. The escape sequences `\\:` should be used to produce literal `:`s.',
        '{}').
    option(
        '--typhoeus [config]',
        'JSON-formatted string of Typhoeus config. Will override the html-proofer defaults.').
    option(
        '--hydra [config]',
        'JSON-formatted string of Hydra config. Will override the html-proofer defaults.').
    option(
        '--parallel [config]',
        'JSON-formatted string of Parallel config. Will override the html-proofer defaults.').
    option(
        '--cache [config]',
        'JSON-formatted string of cache config. Will override the html-proofer defaults.').
    command('scan [path]', {isDefault: true}).
    action(async () => {
      //console.log('action')
      const options = program.opts()
      const path = program.args.length === 0 ? '.' : program.args[0]
      //console.debug(options)

      const checks = []
      if (options.checks){
        let checks_str = options.checks
        checks_str = checks_str.startsWith('\'') || checks_str.startsWith('\"') ? options.checks.slice(1) : checks_str
        checks_str = checks_str.endsWith('\'') || checks_str.endsWith('\"') ? checks_str.slice(0, -1) : checks_str
        for (const checkName of checks_str.split(',')){
          if (all_checks[checkName]== null){
            throw new Error(`Unknown check ${checkName}`)
          }
          checks.push(all_checks[checkName])
        }
        options.checks = checks
      }

      if (options.extensions){
        if (options.extensions.constructor.name === 'String'){
          options.extensions = options.extensions.split(',')
        }
      }

      const paths = path.split(',')
      if (options.asLinks) {
        const links = options.asLinks.split(',').flatMap(e=>e.split(',')).map(e => e.trim())
        await HTMLProofer.check_links(links, options).run()
      } else if (isDirectory(paths.first)) {
        await HTMLProofer.check_directories(paths, options).run()
      } else {
        await HTMLProofer.check_file(path, options).run()
      }
    })


await program.parseAsync(process.argv)