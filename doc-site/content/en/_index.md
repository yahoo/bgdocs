---
title: "Behavior Graph"
linkTitle: "Documentation"
weight: 20
type: "docs"

cascade:
- type: "blog"
  # set to false to include a blog section in the section nav along with docs
  toc_root: true
  _target:
    path: "/blog/**"
- type: "docs"
  _target:
    path: "/**"
    kind: "page"
- type: "docs"
  _target:
    path: "/**"
    kind: "section"
---

Behavior Graph is a software architecture and state management library. It greatly enhances your ability to write complex user facing software and control systems. Broadly speaking, it belongs to the category of libraries which includes Redux, MobX, Rx (Reactive Extensions), and XState. It works by providing a new unit of composition which we call the __behavior__. Behaviors are simple blocks of code together with their dependency relationships.

## Highlights

* Minimial boilerplate
* Scales from the simple to the very complex
* Incremental adoption: works alongside existing code and frameworks
* Handles state, events, and side effects all in one
* Multi-platform: what you learn applies everywhere

We developed Behavior Graph to address our own complexity challenges while building an iOS video playing library which is used internally throughout the suite of native Yahoo mobile apps. After years of development and production usage, it has proven to be incredibly competent at scale. We have since ported it to multiple languages including Javascript/Typescript. It is less than 1500 lines of code and contains no external dependencies.

Behavior Graph will appeal to anyone with an interest in software architectures and willingness to rethink how we write software applications.

## What does it look like?

This block of code defines the elements that control a counter.
It can increment the counter or reset it back to zero.

About 70% of the concepts you need to work with Behavior Graph are contained in this one example.

<!-- Intro-1 -->
{{< highlight javascript >}}
this.increment = this.moment();
this.reset = this.moment();
this.counter = this.state(0);

this.behavior()
    .demands(this.increment, this.reset)
    .supplies(this.counter)
    .runs(ext => {
        if (ext.increment.justUpdated) {
            ext.counter.update(ext.counter.value + 1);
        } else if (ext.reset.justUpdated) {
            ext.counter.update(0);
        }
    });
{{< /highlight >}}

A typical Behavior Graph program consists of dozens or hundreds of behaviors each with its own responsibilities.
The real power comes with our ability to focus on small units of functionality while the computer ensures each behavior is run at the correct time and in the correct order.

## Learning Behavior Graph

While there are only a handful of basic concepts in Behavior Graph, it does require a shift in thinking.

We recommend you start with the Quick Start then work through the Tutorials. They will help you understand how the pieces fit together.

There are a number of Guides to help you delve deeper into various topics.

There is the Complete API for reference.

Explore the TodoMVC implementation which uses only Behavior Graph and vanilla Javascript.

