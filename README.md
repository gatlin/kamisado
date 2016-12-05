# alm-template

This is a project template for quickly starting [Alm][alm] apps and the
associated project infrastructure.

Note: this template assumes that you'll be writing TypeScript files in `src`
and that at least one of them will be called `app.ts`.

# Usage

It is assumed that you have gulp installed.

After you have cloned this repository run the following in your command line:

    $> cp -r alm-template mynewapp
    $> cd mynewapp
    $> sh init.sh
    $> npm install

When you run `sh init.sh` you'll be prompted for a few questions to start your
`package.json` file. `init.sh` and `package.json.sample` will be added to the
included `.gitignore` file for you as well so if you forget to delete them
no worries.

You'll have a few gulp tasks created for you as well:

- `make` - creates a bundle file in `static/js` which the default `index.html`
already refers to.

- `dist` - takes the file created by `make`, uglifies it, and puts it in the
`dist` directory. It also concatenates all JavaScript files in `static/vendor`
and creates a `dist/vendor.js` file.

- `clean` - deletes build artifacts.

- `serve` - serves the top-level directory at `localhost:3000`.

# Project structure

    alm-template/
    |
    +- .gitignore           # prepopulated with useful entries
    |
    +- dist/                # where uglified scripts go
    |
    +- gulpfile.js
    |
    +- index.html           # your project's index.html page
    |
    +- static/              # where static assets go during development
    |  |
    |  +- css/
    |  |  |
    |  |  +- main.css       # edit your CSS however you like
    |  |  |
    |  |  +- reset.css
    |  |
    |  +- js/               # your code bundle will go here
    |  |
    |  +- vendor/           # vendor stuff will go here
    |
    +- tmp/                 # used while making stuff

# Todo

- Handling CSS tasks as well
- Some way for `gulp dist` to rewrite the important parts of `index.html` and
produce a standalone static site in `dist`.

[alm]: http://niltag.net/Alm
