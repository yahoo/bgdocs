#!/bin/bash
asciidoctor -a bg-doc-version=objc -o docs/objc/intro.html intro.adoc
asciidoctor -a bg-doc-version=objc -o docs/objc/guide.html guide.adoc
asciidoctor -a bg-doc-version=typescript -o docs/typescript/intro.html intro.adoc
asciidoctor -a bg-doc-version=typescript -o docs/typescript/guide.html guide.adoc
asciidoctor -a bg-doc-version=kotlin -o docs/kotlin/intro.html intro.adoc
asciidoctor -a bg-doc-version=kotlin -o docs/kotlin/guide.html guide.adoc
