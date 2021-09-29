# Idea Backlog

## Better Runtime

### Handles

The graph currently is objects and pointers and dynamic lists of pointers.
Internally it could be all integers and linked lists which should eliminate a lot of allocating and improve cache hits.
Implemented it in ObjectiveC and the speedup was noticeable.

Would also permit value objects.

| | |
| ----- | ----- |
| Versions | all |
| Priorities | performance, native |
| Impact | High |
| Confidence | Medium-High |
| Effort | Medium-High |



### More C in ObjC version

More C in the ObjC version would make it faster.
If it were all C it could be the base of C++ and Swift versions as well.

| | |
| ----- | ----- |
| Versions | objc |
| Priorities | performance, native |
| Impact | Medium |
| Confidence | Low |
| Effort | High |

### Better Remove

Delete in bulk would reduce resorts.
Would also eliminate the need to unwind links to other removed extents.
Extent removal could be done outside of events and queued for the next event so a bunch of dealloc/finalizer calls could group removes together.

| | |
| ----- | ----- |
| Versions | all |
| Priorities | performance |
| Impact | Medium |
| Confidence | Low |
| Effort | Low |

### Group together dynamic relinking behaviors

Each dynamic behavior creates its own relinking behavior but there is likely several dynamic behaviors that relink on the same switching resources. The code could combine those for possibly some performance benefit.

* Impact: Medium-Low
* Effort: Medium-Low

### Incomplete Remove in Kotlin

Kotlin has the prior implementation of extent removal code which can leave some links leading to some retained objects.

* Impact: Medium-Low
* Effort: Low

### Lazy Resource name Loading

All versions do some form of creating debug names for the resources using reflection. This happens once when the extent is created so its not particularly slow but in production these names aren't needed so the reflection could be reserved until needed.

* Impact: Medium-Low
* Effort: Medium-Low

### Events as Value Types

Could compact sequence numbers by having internal reference counting of events as value types and then periodically resequence them if we thought sequence numbers would run out.

## Better API / Usability

### Change Behavior API to supplies then demands

Because supplies are unique to behaviors they better uniquely identify the behavior and are therefore could make the code easier to scan.

Because its a difference in THE primary API call it would be better to do before open sourcing.

* Impact: Medium
* Confidence: Medium-Low
* Effort: Medium (easy to change, lots of migration work)

### Kotlin needs Added API

Typescript and Objc have a resource that updates when extent is added. This resource can be used to run behaviors when extent is added.

Ideally done before Open Sourcing.

### Remove behavior autorun

Behaviors should only run when their demanded resources update for consistency. Objc and Kotlin still have autorun on.

* Platforms: Kotlin, Objc

### traceValue to startValue

startValue is a more intuitive name

* Platforms: all

### Dynamic behavior API

Port Objc dynamicBehavior method

* Platforms: typescipt, kotlin

### Missing demand checks

Objc has a check for missing demands that can be turned off in production because it comes with some performance cost.
It doesn't exist in typescript or kotlin but its very useful.

* Platforms: typescript, kotlin

### Improve Unit Testability

Automated tests could be more focused if tests were able to test just a subset of behaviors.
This could be done by:

1) Enabling tests to update resources directly
2) Enable tests to check resources and events before they are cleared at the end of the event (for things like justUpdated).

### Tiered Demands

Could improve performance and precision by allowing developers to say a demanded resource is just an ordering resource which means updates don't activate the demanding behavior.

### Nested Lifetimes

Ability to specify when extents have a lifetime that is strictly bounded by a parent extent.
Then when the parent is removed all the children are removed.

This would possibly improve performance with bulk removals.
Also could eliminate some extra work from developer.
Also would allow 

### Incompatible lifetime checks

If a behavior links to a resource that doesn't have the same or longer lifetime then it needs to be a dynamic link.
So resources in the same or parent extents (see Nested Lifetimes) would be static.

This would ensure resources don't disappear on the behavior.
Might also eliminate some work while removing extents.

### Graph lifecycle hooks

eventBegin, eventEnd, sideEffectsBegin, sideEffectsEnd

These could be useful for integrating with existing code or frameworks.

### setDynamicDemands/Supplies

Right now setDemands/Supplies overwrites all demands/supplies. setDynamicDemands/Supplies could overwrite just the dynamic ones and leave the static ones.
This would be for dynamicBehaviors.

### Pluggable Events

Events currently have a sequence and a datetime.
Its possible the developer would like to thread other information or multiple datetimes into the events.

### Optional BG Debug Strings 

Objc version has defines for removing debug strings in production builds (to some degree).
Would be nice to have this information compile out entirely in production.

Kotlin and typescript have no options in this regard.
Objc compiles out resource names but does include impulse names.

### Dynamic debug info with extents

Extents capture abstractions in the model.
We should be able to provide them with dynamic debug information to capture what they are abstracting during debug.

### Catch leaked side effects

Objc has code to catch actions that are created during behaviors.
This is usually a mistake.
Kotlin and Typescript should catch this as well.

### Type support for how Resources can be used

Right now invalid use of Resources happens at runtime when the graph is built.
Via a richer set of types we could enforce some checks at compile time.
An IDE or compiler could highlight some mistakes sooner.
The additional abstractions would come with additional work and understanding from developers to maintain these like any other type abstraction.

There could be readonly and readwrite versions of resources. The latter extending the former with `update` functionality.
This way an extent could expose several resources as readonly and the typesystem could enforce that they were not used as supplies or called with `update`.

Another enhancement could distinguish resources that were meant to be supplied by a behavior vs ones that could be updated inside actions.

## Project Management

### Open Source Behavior Graph

This is necessary to get enough feedback on areas for improvement.

### Swift version

New development for iOS is almost exclusively in Swift.
People will expect a Swift version over a wrapped ObjectiveC version.

### Contributing guide

People will need ideas and know how to contribute.

## Documentation

### API Documentation

Although the API is relatively small and is covered by the reference guide, it is a format that people expect.
We should have that API documentation in a format that people expect and compatible with their tooling/IDEs.

### Glossary and Communication Guide

Developers need the ability to write and speak about their ideas clearly.
The documentation uses the correct language; however developers should be able to glance at the terms quickly to refresh their memories while learning them.

### Patterns Guide

There are an evolving set of patterns for effective ways to model problems using Behavior Graph.
There should be documentation that demonstrates these.

### Explainer Video

A quick 5 minute video with animations could go a long way towards helping developers get the general idea with a miniumum investment of time.

### Tutorials

A very basic step by step tutorial that focuses on getting a real app working on the different platforms would help some users get started.

### Document Dynamic Behaviors

The new API isn't documented yet

### Document Added resource

Not documented yet

### Antora

Docs are written in Asciidoc.
We could use Antora to generate the complete documentation set.

### Automated Documentation

Right now the docs are hand generated from the commandline but that could be part of CI.

### Doc on what we mean by Interactive Software

### Detailed Doc on Benefits of Behavior Graph

## Tooling

### Improved Intellij Integration

* Intellij could probably navigate the graph across resources and behaviors
* Intellij debugger could probably display useful information as the behaviors run

### Improved Xcode Integration

Xcode has a way to create custom presentations of variables in the watch window.
We could use that to give the developer a quick understanding of the current behavior and linked resources (like debugHere).

### Chrome/Safari/Firefox Debug Tools

Same idea

### debugHere for Kotlin/Typescript

debugHere is a useful debugging command in Objc.

### BG Serializer

Being able to serialize all the BG Activity so it could be played back on different platforms or implementations would allow us to have some standard graphs to test performance on.

Currently it is difficult to test performance on a typical Behavior Graph app because we have no large apps in Typescript/Kotlin to test on.

### Conceptual Debugger

Could make an entire debugging/visualizing tool that could use a serialized output of the behavior graph to give a live view into resources and behaviors and focus in on specific areas.

### Behavior Graph Diagrams Tool

Being able to quickly generate a visual diagram of a handful of behaviors would be useful documentation for explaining certain areas of functionality.

### Logging

Could have a default logger that spits out all behavior graph activity including resource updates.

## Other

### Better Tests

Right now Objc tests have evolved through different versions of Behavior Graph and the code it was built for so they do not get to the heart of modern Behavior Graph functionality effectively. There's likely many redundant tests.

Typescript tests are a good mode with excellent coverage.

Kotlin tests are slightly behind Typescript and need updating.

### Better Way to Organize Behaviors

Search and navigation tools work better for behaviors similar to how Google better organizes the web than old Yahoo hierarchies.

However, developers are used to organizing code in hierarchies so we should find better ways to accommodate that.
