---
title: "API"
weight: 40
---

You can view the API docs in [Javadoc format here](https://javadoc.io/doc/com.yahoo.behaviorgraph/bgjvm/latest/index.html)

# Types

## Behavior

A behavior is a block of code together with its dependency relationships (links).
They are one of the two node types in a behavior graph.
You define behaviors using the `behavior()` factory method of an Extent.

Behaviors have both static and dynamic links.
You provide static links when you create the behavior.
Behavior Graph will update dynamic links per special methods on BehaviorBuilder or you can update them directly on a behavior.

### `getDemands()`

* Kotlin: `demands`
* returns: `Set<Resource>?`
* _read only property_

The current set of all Resources which the behavior demands.

### `getExtent()`

* Kotlin: `extent`
* returns: `Extent`
* _read only property_

A behavior always has an Extent with which it is created.

### `setDynamicDemands()`

* param: `newDemands: Demandable...`
* or param: `newDemands: List<? extends Demandable>?`

Provide an array of Demandables.
The complete set of demands for this behavior will be the ones it is defined with (static demands) plus this additional set. Calling this multiple times will replace the set of dynamic demands, it will not continue to add demands.

Providing `null` or no demands is equivalent to saying there are only static demands.

### `setDynamicSupplies()`

* param: `newSupplies: Resource...`
* or param: `newSupplies: List<Resource>?`

Provide an array of Resources to supply.
The complete set of supplies for this behavior will be the ones it is defined with (static supplies) plus this additional set. CAlling this multiple times will replace the set of dynamic supplies, it will not continue to add supplies.

Providing `null` or no supplies is equivalent to saying there are only static supplies.

### `getSupplies()`

* Kotlin: `supplies`
* returns: `Set<Resource>?`
* _read only property_

The current set of all Resources which the behavior supplies.


## `BehaviorBuilder<T>`

BehaviorBuilder provides fluent API for constructing instances of a Behavior.
You create an instance of a BehaviorBuilder using the `behavior()` method on Extent.
All methods except `runs()` return the same instance of BehaviorBuilder so you can chain multiple optional clauses.

Generic type T is the Extent subtype BehaviorBuilder is created with.

<!-- Behavior-1 -->
{{< highlight java >}}
// Create a single behavior with one demand and one supply.
var moment1 = moment();
var moment2 = moment();
var moment3 = moment();
behavior()
    .demands(moment1, moment2)
    .supplies(moment3)
    .runs(ext -> {
        if (moment1.justUpdated() || moment2.justUpdatedTo(false)) {
            moment3.update();
        }
    });
{{< /highlight >}}

### `demands()`

* param: `demands: Demandable...`
* or param: `demands: List<? extends Demandable>`
* returns: `BehaviorBuilder<T>`

Provide a list of static demands this behavior will link to.

### `dynamicDemands()`

* param: `switches: Demandable[]` or `switches: List<? extends Demandable>`
* optional param: `relinkingOrder: RelinkingOrder`
* param: `links: (ext: T, demands: MutableList<? extends Demandable?>) -> void`
* returns: `BehaviorBuilder<T>`

This clause updates the dynamicDemands of this behavior based on the updating of other resources, the switches.
When the switches update, the links parameter will be called. The provided code should add any additional resources to the `demands` MutableList.

We permit `nulls` in the list to make for easier logic and they will be filtered out. Adding nothing to the demands list is equivalent to saying there are no dynamicDemands.

`relinkingOrder` parameter can optionally be set to `RelinkingOrder.relinkingOrderSubsequent` which will update the demands _after_ the runs block is run. The default is `RelinkingOrder.relinkingOrderPrior`.

<!-- Behavior-2 -->
{{< highlight java >}}
// This behavior will automatically demand the deleteButton resource of
// the currentChild extent whenever it changes.
var currentChild = state(null);
behavior()
    .dynamicDemands(new Demandable[] { this.currentChild }, (ext, demands) -> {
        if (ext.currentChild.value()) {
            demands.add(ext.currentChild.value().deleteButton));
        }
    })
    .runs(ext -> {
        if (ext.currentChild.value()) {
            if (ext.currentChild.value().deleteButton.justUpdated()) {
                // do something in response
            }
        }
    });
{{< /highlight >}}

### `dynamicSupplies()`

* param: `switches: Demandable[]` or `switches: List<? extends Demandable>`
* optional param: `relinkingOrder: RelinkingOrder`
* param: `links: (ext: T, supplies: MutableList<Resource>) -> void`
* returns: `BehaviorBuilder<T>`

This clause updates the dynamicSupplies. Please see `dynamicDemands()` for additional details and example.

### `runs()`

* param: `block: (ext: T) -> void`
* returns: `Behavior`

This clause sets the block of code which will run at some point after this behavior is activated.
The parameter `ext` will be the instance of the Extent's generic type this behavior was created on.

`runs()` will return the created behavior which will typically be ignored.

### `supplies()`

* param: `supplies: Resource...`
* or param: `supplies: List<Resource>?`
* returns: `BehaviorBuilder<T>`

Provide a list of static supplies this behavior will link to.

## `Extent<T>`

Extents are collections of resources and behaviors.
You will create your own Extent subclasses to define your Behavior Graph functionality.

<!-- Extent-1 -->
{{< highlight java >}}
// Define extent that toggles state on a switch
class MyExtent extends Extent<MyExtent> {
    Moment toggleSwitch = moment();
    State<Boolean> currentState = state(false);

    MyExtent(graph) {
        super(graph);

        behavior()
            .demands(toggleSwitch)
            .supplies(currentState)
            .runs(ext -> {
                currentState.update(!this.currentState.value());
            });
    }
}

// Create instance of MyExtent and add it to the graph
var myGraph = new Graph();
var myExtent = new MyExtent(myGraph);
myExtent.addToGraphWithAction();
{{< /highlight >}}

### `action()`

* optional param: `debugName: String`
* param: `action: (ext: T) -> void`

Calls the `action()` method on the underlying Graph object.
Contains an additional `ext` parameter which will be the Extent's generic type T instance.

### `actionAsync()`

* optional param: `debugName: String`
* param: `action: (ext: T) -> void`

Calls the `actionAsync()` method on the underlying Graph object.
Contains an additional `ext` parameter which will be the Extent's generic type T instance.

### `addChildLifetime()`

* param: `extent: Extent`

Adds the parameter to list of child lifetimes.
An extent with child lifetimes is guaranteed to be part of the graph for at least as long as the child is.
Behaviors in child extents are permitted to have static links to resources in the parent.

### `getDidAdd()`

* Kotlin: `didAdd`
* returns `State<Boolean>`
* _read only_ property

Every extent comes with this state resource.
It updates to `true` during the event the extent is added to the graph.
Behaviors can demand it to ensure they are activated when they are added.

### `addToGraph()`

Adds this extent to the graph.
Behavior Graph will only interact with resources and behaviors after their extent has been added.

### `addToGraphWithAction()`

* optional param: `debugName: String`

Syntactic sugar for creating a new action and calling `addToGraph()`.
`debugName` is passed to the action.

### `behavior()`

Creates a BehaviorBuilder instance.

### `getDebugName()`

* Kotlin: `debugName`
* returns: `String?`
* _read write_ property

You can define a runtime debugName for your instances to aid in debugging.
It defaults to the name of your Extent subclass.

### `setDebugName()`

* Kotlin: `debugName`
* param: `debugName: String?`
* _read write_ property

Overrides default subclass name.

### `new Extent()`

* param: `graph: Graph`
* constructor

An Extent must be initialized with a Graph. 
You must call super() with the graph in your overridden constructor.

### `getGraph()`

* Kotlin: `graph`
* returns `Graph`
* _read only_ property

The graph on which this extent was created.

### `moment()`

* optional param: `debugName: String?`

Factory method to create a moment resource.
By default the `debugName` will be the name of the property that points to this resource.

### `removeFromGraph()`

* optional param: `strategy: ExtentRemoveStrategy`

Default is `ExtentRemoveStrategy.ExtentOnly`

After an extent is removed from the graph its resource and behaviors will no longer interact with other extents in the graph.

Extents must be removed in a manner that is consistent with their lifetimes.
* All extents with a unified lifetime must be removed during the same event.
* All extents that have a parent lifetime must not remain in the graph longer than their parent.

The default value `ExtentOnly` will just try to remove the receiver extent.

Providing `ExtentRemoveStrategy.removeContainedLifetimes` as the strategy parameter will automatically remove all extents with the unified or child lifetimes.

### `removeFromGraphWithAction()`

* optional param: `strategy: ExtentRemoveStrategy`
* optional param: `debugName: string`

Syntactic sugar for creating a new action and calling `removeFromGraph()`.
`debugName` is passed to the action. `strategy` is passed to `removeFromGraph()`.

### `resource()`

* optional param: `debugName: String?`

Factory method to create a resource.
By default the `debugName` will be the name of the property that points to this resource.

In general, you should prefer `state()`, `moment()`, or `typedMoment()`. This "abstract" resource is typically only useful for ensuring proper ordering between two behaviors.

### `setContext()`

* Kotlin: `context`
* param: `context: T`
* _read write property_

The generic type parameter T on Extent is typically an Extent subclass. This is the easiest option. 
However, it is not strictly necessary.

We can define our separate type and call `setContext()` to pair our extent with an instance of this separate type.
This "context" object will be provided in the various lambdas provided by Extent.

### `sideEffect()`

* optional param: `debugName: String?`
* param: `block: (ext: T) -> void`

Calls the `sideEffect()` method on the underlying Graph object.
Contains an additional `ext` parameter

### `state<T>()`

* param: `initialState: T`
* optional param: `debugName: String?`

Factory method to create a state resource.
By default the `debugName` will be the name of the property that points to this resource.

### `typedMoment<T>()`

* optional param: `debugName: String?`

Creates a `TypedMoment` instance similar to `Moment` except that it contains additional data of type `T`.

### `unifyLifetime()`

* param: `extent: Extent`

Combines the lifetime of this extent with that of the parameter.
Extents with unified lifetimes are guaranteed to be part of the graph for the same period of time.
They are permitted to have static links between them.

## Graph

The core construct that represents the graph of behavior and resource nodes. As many graphs can exist in the same program as you like; however nodes in one graph cannot directly link to nodes in another graph.

### `action()`

* optional param: `debugName: String`
* param: `thunk: () -> void`

Creates a synchronous action on the graph.
This means that all behaviors and side effects which will run because of this action will necessarily complete before the completion of this method call.

By default the debugName will be derived from the set of resources that are updated inside the action block.

### `actionAsync()`

* optional param: `debugName: String`
* param: `block: () -> void`

Creates an action that will run asynchronously.
This means that the behaviors and side effects which will run because of this action _may not_ necessarily complete before the completion of this method call.

### `getCurrentBehavior()`

* Kotlin: `currentBehavior`
* returns `Behavior?`
* _read only_ property

Returns the currently running behavior or null if otherwise.

### `getCurrentEvent()`

* Kotlin: `currentEvent`
* returns `Event?`
* _read only_ property

Returns the current Event if the graph is running an event or null otherwise.

### `dateProvider`

* returns: `GraphDateProvider`
* _read write_ property

The default dateProvider returns `Date.now()` which is the source of `timestamp` on GraphEvent instances.
Overriding is primarily useful for controlling values during testing.

### `debugCycleForBehavior()`

* param: `behavior: Behavior`
* returns: `List≤Resource>`

Used during debugging as an aid when there are dependency cycles.
The returned list contains the sequence of Resource objects which will result in a dependency cycle including this behavior.
The array will be empty if there is not a cycle.

### `getLastEvent()`

* Kotlin: `lastEvent`
* returns `Event`
* _read only_ property

Returns the last Event that completed.
It starts as `Event.InitialEvent`.

### `new Graph()

* optional param: `dateProvider: DateProvider`

Graph uses the platform default to get the current timestamp when creating new Events.
We can provide an optional dateProvider object which will return a user defined timestamp.
This is particularly useful for automated testing.

### `sideEffect()`

* optional param: `debugName: String`
* param: `thunk: () => void`

Creates a block of code that will run during the side effect phase of the event.
Side effects are run in the order they are created.
Side effects do not run until after all behaviors have been run.

### `setValidateDependencies()`

* Kotlin: `validateDependencies`
* param: `validate: boolean`

True by default. This will ensure that a code inside a behavior only accesses resources specified in its demands and supplies clauses.

Validating dependencies is a runtime check that is useful during development and debugging but does incur some runtime costs. It can be practical to disable this for production builds.

### `setValidateLifetimes()`

* Kotlin: `validateLifetimes`
* param: `validate: boolean`

True by default. This will ensure that behaviors are not linked to resources that may no longer be part of the graph (and vice versa).

Validating lifetimes is a runtime check that is useful during development and debugging but does incur some runtime costs. It can be practical to disable this for production builds.

## Event

### `getSequence()`

* Kotlin: `sequence`
* returns: `long`
* _read only_ property

Each Event is assigned a monotonically increasing number for each event run on the graph.
You can use this information to quickly determine the order resources update.

### `getTimestamp()`

* Kotlin: `timestamp`
* returns: `long`
* _read only_ property

Each Event is given a timestamp according to the registered DateProvider given to a graph instance.
It defaults to `currentTimeMillis()`.

## Moment and TypedMoment<T>

_extends Resource_

A Moment is a type of Resource for tracking information that exists at a moment in time.
Button presses are examples of Moments.

TypedMoments are moments that have values associated with them.
A network call return would be a TypedMoment. The data returned from that call is a possible value.

### `event()`

* Kotlin: `event`
* returns `Event?`
* _read only_ property

Returns the Event of the most recent time the moment was updated.
It is `null` if it has never been updated.

### `justUpdated()`

* Kotlin: `justUpdated`
* returns: `boolean`
* _read only_ property

Returns true if the moment updated during this event.

### `justUpdatedTo()`

* _TypedMoment only_
* param `value: T`
* returns `boolean`

Returns true if the moment was justUpdated and the value `.equals()` the parameter.
If you wish to use something different than `.equals()` you can implement your own check as this method is syntactic sugar.

### `update()`

* _TypedMoment only_ param `value: T`

Marks the moment as justUpdated.
If a value is provided, it will be set on the moment for reading.

### `updateWithAction()`

* _TypedMoment only_ param `value: T | undefined`
* optional param `debugName : String?`

Syntactic sugar for calling `action()` on the underlying graph and calling `update()` on the moment.

### `value()`

* _TypedMoment only_
* Kotlin: `value`
* returns `T`
* _read only_ property

Returns the value stored in the TypedMoment if it was updated during this event.
Throws exception if the moment was not updated this event.

## Resource

The base class for State, Moment, and TypedMoment.
Prefer those types in almost all circumstances.
Wherever you see "resource" in this document, assume we are referring to instances of State and Moment and TypedMoment as well.

Resource has minimal functionality.
Using instances of this base class directly is useful when forcing a certain ordering relationship between behaviors.

### `getDebugName()`

* Kotlin: `debugName`
* returns `String?`
* _read write_ property

Assignable name for use during debugging.

### `getExtent()`

* Kotlin: `extent`
* returns `Extent`
* _read only_ property

All resources belong to an Extent.

### `getGraph()`

* Kotlin: `graph`
* returns `Graph`
* _read only_ property

All resources belong to a Graph.

### `order()`

* Kotlin: `order`
* returns `Demandable`
* _read only_ property

A behavior can also demand `resource.order()` which tells the behavior not to activate when the resource updates.
All resource subclasses have this option as well.

### `getSuppliedBy()`

* Kotlin: `suppliedBy`
* returns `Behavior?`
* _read only_ property

If the resource is supplied by a behavior it will be returned, null otherwise.

## State<T>

_extends Resource_

A State is a type of resource for storing information over a period of time.
Its value will persist into the future until it is updated.

All States must be given an initial value when created.

### `getEvent()`

* Kotlin `event`
* returns `Event`
* _read only_ property

The last time the State was updated.
Will return `Event.InitialEvent` for its initial value before it has been updated.

A behavior must demand or supply a state resource to access this property.

### `justUpdated()`

* Kotlin `justUpdated`
* returns `boolean`
* _read only_ property

Returns true if the state was updated during this event.

A behavior must demand or supply a state resource to access this property.

### `justUpdatedTo()`

* param: `toState: T`
* returns: `boolean`

Returns true if the state was updated during this event and toState parameter `.equals()` value.

A behavior must demand or supply a state resource to access this property.

### `justUpdatedFrom()`

* param: `fromState: T`
* returns: `boolean`

Returns true if the state was updated during this event and the fromState parameter `.equals()` the value it had before updating.

A behavior must demand or supply a state resource to access this property.

### `justUpdatedToFrom()`

* param: `toState: T`
* param: `fromState: T`
* returns: `boolean`

A combination of `justUpdatedTo()` and `justUpdatedFrom()`

A behavior must demand or supply a state resource to access this property.

### `traceEvent()`

* Kotlin: `traceEvent`
* returns: `Event`
* _read only_ property

What was the value of the `event` property at the beginning of the current event.

A behavior __does not__ need to demand or supply a resource to access this property.

### `traceValue()`

* Kotlin: `traceValue`
* returns: `T`
* _read only_ property

What was the value of the `value` property at the beginning of the current event.

A behavior __does not__ need to demand or supply a resource to access this property.

### `updateWithAction()`

* param: `newValue: T`
* optional param: `debugName: String`

Equivalent to calling `action()` on the underlying Graph instance and `update()` on the State object.

### `update()`

* param: `newValue: T`

Checks to see if the newValue parameter `!equals()` the current value, and if so updates it to that new value.

A behavior must supply this resource in order to call this method.

State resources may also be updated inside an action if they are not supplied by any behavior.

### `updateForce()`

* param: `newValue: T`

Updates value to the newValue even if they are `.equals()`.
This means that any demanding behaviors will be activated.

### `value()`

* Kotlin: `value`
* returns: `T`
* _read only_ property

The current underlying value.

# Interfaces

## Demandable

What a behavior can demand. A sealed opaque type which includes:
* Instances of Resource and its subclasses State and Moment
* The object returned by `.order` on an instance of Resource

There are no other Demandable types and it is not open for extension.

## DateProvider

Optional override for default `dateProvier` on Graph instance.

Implement a type with a single method:

`now(): long`

The default implementation returns `currentTimeMillis()`


