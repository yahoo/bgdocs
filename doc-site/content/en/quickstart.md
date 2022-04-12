---
title: "Getting Started"
weight: 10
---

Using Behavior Graph is as simple as downloading it via your preferred format and importing it into your source.

## Downloading

### NPM

Behavior Graph is hosted on NPM @ [behavior-graph](https://www.npmjs.com/package/behavior-graph).

You may add it as a dependency in your project's __package.json__ manually or install it via the shell
It supports both CommonJS and module imports.

```sh
npm install behavior-graph
```

Please search the web for any help using `npm`.

### GitHub
Behavior Graph is available in source form via Github @ [yahoo/bgjs](https://www.github.com/yahoo/bgjs).

### Javascript CDNs

Behavior Graph is also available via a number of popular CDN Services.
You may prefer to use these when importing directly into the browser.

* [Skypack.dev](https://www.skypack.dev/view/behavior-graph)
* [JSDelivr](https://www.jsdelivr.com/package/npm/behavior-graph)


## Importing

Javascript imports require some knowledge of your environment which is beyond the scope of this guide.

For modern environments:

Node: `import * as bg from behavior-graph`

or

Browser: `import * as bg from "https://cdn.skypack.dev/behavior-graph";`

Behavior Graph is also available as an IIFE which you can include as a script tag directly into the browser.

`<script src="https://cdn.jsdelivr.net/npm/behavior-graph/lib/behavior-graph.min.js"></script>`

The default export name is `bg` when using this method.

## Quicker Start

To start exploring feel free to use any of the following which have been preconfigured to use Behavior Graph.

* [JSFiddle](https://jsfiddle.net/slevin11/akevq4hm/)
* [CodePen](https://codepen.io/slevin11/pen/XWzbMWZ)

## Typescript or Javascript

Behavior-Graph is written in Typescript. 
It is usable directly from Javascript or Typescript code.
Type declaration files are provided for all APIs.

## Tutorials

It is unlikely you will get very far with Behavior Graph without working through a [tutorial]({{< ref "tutorials/tutorial-1" >}}).
Please spend some time with them to practice writing Behavior Graph code.
They don't take very long. We promise you will be mentally stimulated and spiritually rewarded for your time.

