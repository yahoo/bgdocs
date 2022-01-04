---
title: "API"
---
# Types

## Behavior

A behavior is a block of code together with its dependency relationships (links).
They are one of the two node types in a behavior graph.
You define behaviors using the `behavior()` factory method of an Extent.

Behaviors have both static and dynamic links.
You provide static links when you create the behavior.
Behavior Graph will update dynamic links per special methods on BehaviorBuilder or you can update them directly on a behavior.

### `demands`

* returns: `Set<Resource> | null`
* _read only property_

The current set of all Resources which the behavior demands.

### `extent`

* returns: `Extent`
* _read only property_

A behavior always has an Extent with which it is created.

### `setDynamicDemands()`

* param: `newDemands: (Demandable | undefined)[] | null)`

Provide an array of Demandables.
`undefined` is also an element type to make for easier use of optional chaining.
Providing `null` is equivalent to saying there are no dynamic demands.

### `setDynamicSupplies()`

* param: `newSupplies: (Resource | undefined)[] | null)`

Provide an array of Resources to supply.
`undefined` is also an element type to make for easier use of optional chaining.
Providing `null` is equivalent to saying there are no dynamic supplies.

### `supplies`

* returns: `Set<Resource> | null`
* _read only property_

The current set of all Resources which the behavior supplies.


## BehaviorBuilder<T>

BehaviorBuilder provides fluent API for constructing instances of a Behavior.
You create an instance of a BehaviorBuilder using the `behavior()` method on Extent.
All methods except `runs()` return the same instance of BehaviorBuilder so you can chain multiple optional clauses.

Generic type T is the Extent subtype BehaviorBuilder is created with.

<!-- Behavior-1 -->
{{< highlight javascript >}}
// Create a single behavior with one demand and one supply.
this.moment1 = this.moment();
this.moment2 = this.moment();
this.moment3 = this.moment();
this.behavior()
    .demands(this.moment1, this.moment2)
    .supplies(this.moment3)
    .runs(ext => {
        if (ext.moment1.justUpdated || ext.moment2.justUpdatedTo(false)) {
            ext.moment3.update();
        }
    });
{{< /highlight >}}

### `demands()`

* params: `...demands: Demandable[]`
* returns: `BehaviorBuilder<T>`

Provide a list of static demands this behavior will link to.

### `dynamicDemands()`

* param: `switches: Demandable[]`
* param: `links: ((ext: T) => (Demandable | undefined)[] | null)`
* param: `relinkingOrder?: RelinkingOrder`
* returns: `BehaviorBuilder<T>`

This clause updates the dynamicDemands of this behavior based on the updating of other resources, the switches.
When the switches update, the links parameter will be called which should return the list of new resources.

We permit `undefined` in the list to make for easier optional chaining.
Returning `null` is equivalent to setting no dynamicDemands.

`relinkingOrder` parameter can optionally be set to `Extent.relinkingOrderSubsequent` which will update the demands _after_ the runs block is run.

<!-- Behavior-2 -->
{{< highlight javascript >}}
// This behavior will automatically demand the deleteButton resource of
// the currentChild extent whenever it changes.
this.currentChild = this.state(null);
this.behavior()
    .dynamicDemands([this.currentChild], ext => {
        return [ext.currentChild.value?.deleteButton];
    })
    .runs(ext => {
        if (ext.currentChild.value?.deleteButton.justUpdated) {
            // do something in response
        }
    });
{{< /highlight >}}

### `dynamicSupplies()`

* param: `switches: Demandable[]`
* param: `links: ((ext: T) => (Resource | undefined)[] | null)`
* returns: `BehaviorBuilder<T>`

This clause updates the dynamicSupplies similarly to the dynamicDemands clause.

### `runs()`

* param: `block: (ext: T) => void`
* returns: `Behavior`

This clause sets the block of code which will run when the behavior is activated.
The parameter `ext` will be the instance of the Extent this behavior was created on.

`runs()` will return the created behavior which will typically be ignored.

### `supplies()`

* params: `...supplies: Resource[]`
* returns: `BehaviorBuilder<T>`

Provide a list of static supplies this behavior will link to.

## Extent

Extents are collections of resources and behaviors.
You will create your own Extent subclasses to define your Behavior Graph functionality.

<!-- Extent-1 -->
{{< highlight javascript >}}
// Define extent that toggles state on a switch
class MyExtent extends Extent {
    constructor(graph) {
        super(graph);

        this.toggleSwitch = this.moment();
        this.currentState = this.state(false);

        this.behavior()
            .demands(this.toggleSwitch)
            .supplies(this.currentState)
            .runs(ext => {
                this.currentState.update(!this.currentState.value);
            });
    }
}

// Create instance of MyExtent and add it to the graph
let myGraph = new Graph();
let main = new MyExtent(myGraph);
main.addToGraphWithAction();
{{< /highlight >}}

### `action()`

* param `action: (ext: this) => void`
* param `debugName?: string`

Calls the `action()` method on the underlying Graph object.
Contains an additional `ext` parameter which will be this Extent instance.

### `async actionAsync()`

* param `action: (ext: this) => void`
* param `debugName?: string`
* returns: `Promise`

Calls the `actionAsync()` method on the underlying Graph object.
Contains an additional `ext` parameter which will be this Extent instance.

### `addChildLifetime()`

* param: `extent: Extent`

Adds the parameter to list of child lifetimes.
An extent with child lifetimes is guaranteed to be part of the graph while the child is.
Behaviors in child extents are permitted to have static links to resources in the parent.

### `addedToGraph`

* returns `State<boolean>`
* _read only_ property

Every extent comes with this state resource.
It updates to `true` when the extent is added to the graph.

### `addedToGraphWhen`

* returns `number | null`
* _read only_ property

The sequence number of the event the Extent was added to the Graph.
It is null if it has not been added or once it is removed.

### `addToGraph()`

Adds this extent to the graph.
Behavior Graph will only interact with resources and behaviors after their extent has been added.

### `addToGraphWithAction()`

* param: `debugName?: string`

Syntactic sugar for creating a new action and calling `addToGraph()`.
`debugName` is passed to the action.

### `behavior()`

Creates a BehaviorBuilder instance.

### `debugName`

* returns `string | null`
* _read write_ property

You can define a runtime debugName for your instances to aid in debugging.
It defaults to the name of your Extent subclass.

### `new Extent()`

* param: `graph: Graph`
* constructor

An Extent must be initialized with a Graph. 
You must call super() with the graph in your overridden constructor.

### `graph`

* returns `Graph`
* _read only_ property

The graph on which this extent was created.

### `moment<T>()`

* param `debugName?: string`

Factory method to create a moment resource.
By default the `debugName` will be the name of the property that points to this resource.

### `removeFromGraph()`

* param `strategy?: ExtentRemoveStrategy`

After an extent is removed from the graph its resource and behaviors will no longer interact with other extents in the graph.

Extents must be removed in a manner that is consistent with their lifetimes.
* All extents with a unified lifetime must be removed during the same event.
* All extents that have a parent lifetime must not remain in the graph longer than their parent.

Providing `Extent.removeContainedLifetimes` as the strategy parameter will automatically remove all extents with the unified or child lifetimes.

### `removeFromGraphWithAction()`

* param: `strategy?: ExtentRemoveStrategy`
* param: `debugName?: string`

Syntactic sugar for creating a new action and calling `removeFromGraph()`.
`debugName` is passed to the action.

### `resource()`

* param `debugName?: string`

Factory method to create a resource.
By default the `debugName` will be the name of the property that points to this resource.

### `sideEffect()`

* param `block: (ext: this) => void`
* param `debugName?: string`

Calls the `sideEffect()` method on the underlying Graph object.
Contains an additional `ext` parameter

### `state<T>()`

* param `initialState: T`
* param `debugName?: string`

Factory method to create a state resource.
By default the `debugName` will be the name of the property that points to this resource.

### `unifyLifetime()`

* param: `extent: Extent`

Combines the lifetime of this extent with that of the parameter.
Extents with unified lifetimes are guaranteed to be part of the graph for the same period of time.
They are permitted to have static links between them.

## Graph

### `action()`

* param `block: () => void`
* param `debugName?: string`

Creates a synchronous action on the graph.
By default the debugName will be derived from the set of resources that are updated inside the action block.

### `async actionAsync()`

* param `block: () => void`
* param `debugName?: string`
* returns: `Promise`

Creates an action that will run asynchronously.

### `currentBehavior`

* returns `Behavior | null`
* _read only_ property

Returns the currently running behavior or null if otherwise.

### `currentEvent`

* returns `GraphEvent | null`
* _read only_ property

Returns the current GraphEvent if the graph is running an event or null otherwise.

### `dateProvider`

* returns: `GraphDateProvider`
* _read write_ property

The default dateProvider returns `Date.now()` which is the source of `timestamp` on GraphEvent instances.
Overriding is primarily useful for controlling values during testing.

### `debugCycleForBehavior()`

* param `behavior: Behavior`
* returns: `Resource[]`

Used during debugging as an aid when there are dependency cycles.
The returned array contains the sequence of Resource objects which will result in a dependency cycle including this behavior.
The array will be empty if there is not a cycle.

### `lastEvent`

* returns `GraphEvent`
* _read only_ property

Returns the last GraphEvent that completed.
It starts as `GraphEvent.initialEvent`.

### `sideEffect()`

* param: `block: () => void`
* param: `debugName?: string`

Creates a block of code that will run during the side effect phase of the event.

## GraphEvent

### `sequence`

* returns: `number`
* _read only_ property

Each GraphEvent is assigned a monotonically increasing number for each event run on the graph.

### `timestamp`

* returns: `Date`
* _read only_ property

Each GraphEvent is given a timestamp according to the registered DateProvider given to a graph instance.
It defaults to `Date.now()`.

## Moment<T>

_extends Resource_

A Moment is a type of Resource for tracking information that exists at a moment in time.
Button presses or network call returns are examples of Moments.

Moments optionally have values associated with them.
The payload of a network call return is a possible value for a moment.
Those values are reset to `undefined` at the end of the event.

### `event`

* returns `GraphEvent | null`
* _read only_ property

Returns the GraphEvent of the most recent time the moment was updated.
It is `null` if it has never been updated.

### `justUpdated`

* returns: `boolean`
* _read only_ property

Returns true if the moment updated during this event.

### `justUpdatedTo()`

* param `value: T`
* returns `boolean`

Returns true if the moment was justUpdated and the value `==` the parameter.
If you wish to use something different than `==` you can implement your own check as this method is syntactic sugar.

### `update()`

* param `value: T | undefined`

Marks the moment as justUpdated.
If a value is provided, it will be set on the moment for reading.

### `updateWithAction()`

* param `value: T | undefined`
* param `debugName? : string`

Syntactic sugar for calling `action()` on the underlying graph and calling `update()` on the moment.

### `value`

* returns `T`
* _read only_ property

Returns the value stored in the moment if it was updated during this event.
It is `undefined` if it was not updated or outside of an event.

Moments do not necessarily have a value.
They will not if they were not given one in their `update()` method.

## Resource

The base class for State and Moment.
Prefer those types in almost all circumstances.
Wherever you see "resource" in this document, assume we are referring to instances of State and Moment.

Resource has minimial functionality.
Using instances of this base class directly is useful when forcing a certain ordering relationship between behaviors.

### `debugName`

* returns `string | null`
* _read write_ property

Assignable name for use during debugging.

### `extent`

* returns `Extent`
* _read only_ property

All resources belong to an Extent.

### `graph`

* returns `Graph`
* _read only_ property

All resources belong to a Graph.

### `order`

* returns `Demandable`
* _read only_ property

A behavior can also demand `resource.order` which tells the behavior not to activate when the resource updates.

### `suppliedBy`

* returns `Behavior | null`
* _read only_ property

If the resource is supplied by a behavior it will be returned, null otherwise.

## State<T>

_extends Resource_

A State is a type of resource for storing information over a period of time.
Its value will persist into the future until it is updated.

All States must be given an initial value when created.

### `event`

* returns `GraphEvent`
* _read only_ property

The last time the State was updated.
Will return `GraphEvent.initialEvent` for its initial value before it has been updated.

### `justUpdated`

* returns `boolean`
* _read only_ property

Returns true if the state was updated during this event.

### `justUpdatedTo()`

* param: `toState: T`
* returns: `boolean`

Returns true if the state was updated during this event and toState parameter `==` value.

### `justUpdatedFrom()`

* param: `fromState: T`
* returns: `boolean`

Returns true if the state was updated during this event and the fromState parameter `==` the value it had before updating.

### `justUpdatedToFrom()`

* param: `toState: T`
* param: `fromState: T`
* returns: `boolean`

A combination of `justUpdatedTo()` and `justUpdatedFrom()`

### `traceEvent`

* returns: `GraphEvent`
* _read only_ property

What was the value of the `event` property at the beginning of the current event.

### `traceValue`

* returns: `T`
* _read only_ property

What was the value of the `value` property at the beginning of the current event.

### `updateWithAction()`

* param: `newValue: T`
* param: `debugName?: string`

Equivalent to calling `action()` on the underlying Graph instance and `update()` on the State object.

### `update()`

* param: `newValue: T`

Checks to see if the newValue parameter `!=` the current value, and if so updates it to that new value.

### `updateForce()`

* param: `newValue: T`

Updates value to the newValue even if they are the same.

### `value`

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

`now(): Date`


