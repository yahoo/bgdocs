# Idea Backlog

## Better Runtime

### Handles

The graph currently is objects and pointers and dynamic lists of pointers.
Internally it could be all integers and linked lists which should eliminate a lot of allocating and improve cache hits.
Implemented it in ObjectiveC and the speedup was noticeable.

Would also permit value objects.

Do it? Probably

### More C in ObjC version

More C in the ObjC version would make it faster.
If it were all C it could be the base of C++ and Swift versions as well.

Do it? Maybe

### Better Remove

Delete in bulk would reduce resorts.
Would also eliminate the need to unwind links to other removed extents.
Extent removal could be done outside of events and queued for the next event so a bunch of dealloc/finalizer calls could group removes together.

Partially implemented with lifetimes in ts and kotlin versions.
Could still do removals outside events.

Do it? Probably

### Group together dynamic relinking behaviors

Each dynamic behavior creates its own relinking behavior but there is likely several dynamic behaviors that relink on the same switching resources. The code could combine those for possibly some performance benefit.

Do it? Yes
To do: Swift, Kotlin, TS
Done: Objc

### Lazy Resource name Loading

All versions do some form of creating debug names for the resources using reflection. This happens once when the extent is created so its not particularly slow but in production these names aren't needed so the reflection could be reserved until needed.

Do it? Probably

### Events as Value Types

Could compact sequence numbers by having internal reference counting of events as value types and then periodically resequence them if we thought sequence numbers would run out.

Do it? Maybe

### Multithreading

Swift handles mutlithreading fairly well.
But it needs a few refinements: run tasks on behavior graph queue to get stable state, specify side effect queue, ability to check current state on background threads

Port this to kotlin as well. Maybe objective c.

Do it? Probably
To do: Kotlin, Swift

## Better API / Usability

### BehaviorBuilder API

Swift should use builder API for behaviors. Kotlin & Typescript use it.
Ojbc might need a different approach.

Do it? Yes
To do: Swift, objc?
Done: kotlin, TS

### Ability to Turn off Naming

Need a switch for disabling automatic resource debug names in production.

Do it? Yes
To Do: kotlin, TS, Swift 

### Improve Unit Testability

Automated tests could be more focused if tests were able to test just a subset of behaviors.
This could be done by:

1) Enabling tests to update resources directly
2) Enable tests to check resources and events before they are cleared at the end of the event (for things like justUpdated).

### Subsequent Relinking

Do it? Yes
To do: Objc
Done: swift, kotlin, TS

### Ordering Demands

Do it? Yes
To do: Swift
Done: Objc, swift, kotlin

### Nested Lifetimes

Ability to specify when extents have a lifetime that is strictly bounded by a parent extent.
Then when the parent is removed all the children are removed.

If a behavior links to a resource that doesn't have the same or longer lifetime then it needs to be a dynamic link.
So resources in the same or parent extents (see Nested Lifetimes) would be static.

This would ensure resources don't disappear on the behavior.
Might also eliminate some work while removing extents.

Do it? Probably
To do: Swift, objc
Done: TS, kotlin

### Graph lifecycle hooks

eventBegin, eventEnd, sideEffectsBegin, sideEffectsEnd

These could be useful for integrating with existing code or frameworks.

Do it? Maybe

### setDynamicDemands/Supplies

Right now setDemands/Supplies overwrites all demands/supplies. setDynamicDemands/Supplies could overwrite just the dynamic ones and leave the static ones.
This would be for dynamicBehaviors.

Do it? Yes
To do: Swift, objc
Done: TS, kotlin

### Pluggable Events

Events currently have a sequence and a datetime.
Its possible the developer would like to thread other information or multiple datetimes into the events.

Do it? Maybe

### Dynamic debug info with extents

Extents capture abstractions in the model.
We should be able to provide them with dynamic debug information to capture what they are abstracting during debug.

For example an extent would abstract a single participant in a chat in general.
And a specific extent instance would model a particular participant, so we should be able to see thatn in debug messages.

Do it? Probably

### Type support for how Resources can be used

Right now invalid use of Resources happens at runtime when the graph is built.
Via a richer set of types we could enforce some checks at compile time.
An IDE or compiler could highlight some mistakes sooner.
The additional abstractions would come with additional work and understanding from developers to maintain these like any other type abstraction.

There could be readonly and readwrite versions of resources. The latter extending the former with `update` functionality.
This way an extent could expose several resources as readonly and the typesystem could enforce that they were not used as supplies or called with `update`.

Another enhancement could distinguish resources that were meant to be supplied by a behavior vs ones that could be updated inside actions.

Do it? Maybe

### Aggregate Aware resources

Does it make sense to have resources that understand maps and arrays and sets?
EG They have built in moments like `somethingAdded`, `somethingRemoved`, `contentUpdated(element)`

Tracking sub elements as individual resources does conflict with extents being the language of lifetimes.
 
### What does a recursive behavior look like?

Perhaps a subsection could be rerun to express a loop if we knew it had a specific set of dependencies?

### nil aware updatedTo/From methods

It's often the case that we check if something updated to or from nil: `updatedToSomething`, `updatedToNothing`

`updatedFromSomethingElse` means changed and previous wasn't nil

etc



### Combinators

if its common to take the value from any one of several resources or some boolean combination of several then maybe a built in behavior for that is interesting.

### Restrict demand changing to a single behavior

Right now there's no native understanding that demands/supplies change in particular places.
The graph doesn't enforce any rules around what can change the shape of the graph.
Would it help to be explicit? Would that prevent errors by allowing changing demands from only one other behavior?


## Project Management

### Swift version

New development for iOS is almost exclusively in Swift.
People will expect a Swift version over a wrapped ObjectiveC version.

### Contributing guide

People will need ideas and know how to contribute.

## Documentation

Update Docs to newest versions.
API, Tutorials

Do it? Yes
To do: Objc, Swift, Kotlin
Done: TS

### Glossary and Communication Guide

Developers need the ability to write and speak about their ideas clearly.
The documentation uses the correct language; however developers should be able to glance at the terms quickly to refresh their memories while learning them.

### Patterns Guide

There are an evolving set of patterns for effective ways to model problems using Behavior Graph.
There should be documentation that demonstrates these.

### Explainer Video

A quick 5 minute video with animations could go a long way towards helping developers get the general idea with a miniumum investment of time.

### Document Dynamic Behaviors

The new API isn't documented yet

### Document Added resource

Not documented yet

### Automated Documentation

Right now the docs are hand generated from the commandline but that could be part of CI.

### Game that teaches BG fundamentals

A set of puzzles that guide the user through the core concepts.
Inspiration: Rocky's Boots, Robot Odyssey, Advent of Code

### Way to explain BG in a non-computer way

Fundamentally about providing a language for describing how separate tasks are related.
That should be describable with some animations on a web site that one could show to people on a phone.
Or drawings on a napkin.


### Needed Patterns Examples

* didAdd & baking in state (state's initial value shouldn't precalculate work done by behaviors?)
* mixing state and moment resources

### Needed Guides

* dynamic behaviors and extents
* migrating: working back from site effects
* fixing cycles
* error messages and how to fix them

### Needed Tutorials

* errors and debugging
* swift playgrounds



## Tooling

### Improved Intellij Integration

* Intellij could probably navigate the graph across resources and behaviors
* Intellij debugger could probably display useful information as the behaviors run
* filter out BG internals frames

### Improved Xcode Integration

Xcode has a way to create custom presentations of variables in the watch window.
We could use that to give the developer a quick understanding of the current behavior and linked resources (like debugHere).

### Chrome/Safari/Firefox Debug Tools

Same idea

### debugHere for Kotlin/Typescript

debug console debug printing (debugHere)

Do it? Yes
To do: TS, Kotlin, Swift
Done: objc

### BG Serializer

Being able to serialize all the BG Activity so it could be played back on different platforms or implementations would allow us to have some standard graphs to test performance on.

Currently it is difficult to test performance on a typical Behavior Graph app because we have no large apps in Typescript/Kotlin to test on.

Do it? Probably

### Conceptual Debugger

Could make an entire debugging/visualizing tool that could use a serialized output of the behavior graph to give a live view into resources and behaviors and focus in on specific areas.

A way to step through behaviors.

Do it? Probably

### Behavior Graph Diagrams Tool

Being able to quickly generate a visual diagram of a handful of behaviors would be useful documentation for explaining certain areas of functionality.

Do it? Maybe

### Logging

Could have a default logger that spits out all behavior graph activity including resource updates.

Do it? Probably

### Custom Instruments for Apple Instruments

Could analyze most common behaviors and performance bottlenecks

[Custom Instruments (WWDC Video)](https://developer.apple.com/videos/play/wwdc2018/410)

### Better retain cycle visibility

### Log analysis for Antipatterns

If there were standard logging then we could provide tooling for looking at those logs and say things like: "this looks suspicious" or "there's a bottleneck right here".

## Other

### Better Tests

Right now Objc tests have evolved through different versions of Behavior Graph and the code it was built for so they do not get to the heart of modern Behavior Graph functionality effectively. There's likely many redundant tests.

Do it? Yes
To do: Objc
Done: Kotlin, Swift, TS

### Better Way to Organize Behaviors

Search and navigation tools work better for behaviors similar to how Google better organizes the web than old Yahoo hierarchies.

However, developers are used to organizing code in hierarchies so we should find better ways to accommodate that.

### Static graphs

If a graph doesn't change shape, in theory we could compile it down to code that doesn't need a graph run time.

For partially dynamic graphs we might be able to improve performance of just the static parts.

### Performance hints?
Are there ways of saying that we sort of know the shape of the graph? Perhaps we made room between existing ordering so extents coming and going don't necessarily force a reorder of some common demanding behavior. Seems likely.

### Track trace demands

Right now we can just leave trace demands out of demands lists.
This is fine for runtime but it doesn't provide visibility into relationships with other tooling.

### Hungarian-like notation for moments and state resources

Sometimes its hard to tell if we are talking about a moment or a state because of English ambiguity.
 
### Other languages

c++, c#, D, Python, Clojure, etc

### Database style resources

Design is oriented towards extents as structures of resources.
But resources could all live in database like data structure with concurrency guarantees or snapshotting or rolling back.

If we used handles this could be compatible with existing resources.

### Does it make an interesting Unity library

Games may be a good audience

### What does a language native BG API look like?

Could use Graal to add to existing language



