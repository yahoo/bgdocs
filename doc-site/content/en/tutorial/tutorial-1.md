---
title: "Tutorial 1 - Basics"
---

Here we will introduce the essentials to get you started quickly using Behavior Graph.

You can immediately get started using our [preconfigured tutorial](https://stackblitz.com/edit/js-hajxuw?file=index.js) page on __Stackblitz__. At the time of writing, this only works with Google Chrome browser.
Go there. Select the `index.js` file on the left. 
Then click on `Console` in the bottom right of the screen to open the Javascript console.
You will type your code into the editor in the middle.

_Do tutorial video for stack blitz_

Alternatively, if you know how to get a Javascript or Typescript environment up and running, Behavior Graph is a single import away. Check the [Quick Start]() Documentation for where you can access Behavior Graph. [Codepen]() and [JSFiddle]() will also work.

## Hello, World!

Type in the following into the editor.
You will gain more by typing it, as it forces you to think about each line more.


{{< highlight javascript >}}
import * as bg from "https://cdn.skypack.dev/behavior-graph@beta";

let g = new bg.Graph();

class HelloExtent extends bg.Extent {
  constructor(graph) {
    super(graph);
    
    this.person = this.state("Nobody");
    this.behavior()
      .demands(this.person)
      .runs(ext => {
        console.log("Hello, " + this.person.value + "!");
      });
  }
}

let e = new HelloExtent(g);

e.addToGraphWithAction();

g.action(() => {
  e.person.update("World");
});
{{< / highlight >}}

Let's review this in pieces

{{< highlight javascript >}}
import * as bg from "https://cdn.skypack.dev/behavior-graph@beta";
{{< / highlight >}}

This is a standard Javascript import.
You may need to adjust it depending on your Javascript environment which is beyond the scope of this tutorial.
Behavior Graph is distributed though [NPM](https://www.npmjs.com/package/behavior-graph) and is available through a number of downstream CDNs.
See the [Quick Start Guide]() for more information.
Note that Behavior Graph is imported as `bg` here.
We will reference that in a few places in the tutorial.
Your import name may be different.


{{< highlight javascript >}}
let g = new bg.Graph();
{{< / highlight >}}

You must create an instance of a Graph.
You may have more than one instance, but all Behavior Graph elements are associated with a specific instance.

{{< highlight javascript >}}
class HelloExtent extends bg.Extent {
  constructor(graph) {
    super(graph);
{{< / highlight >}}

You will modularize your Behavior Graph code into Extents.
You do this by extending the built in Extent class and passing it your Graph instance in the constructor.
Extents collect Behaviors and Resources together with the same lifetime.

{{< highlight javascript >}}
    this.person = this.state("Nobody");
{{< / highlight >}}

`person` is a Resource.
Resources are containers for information.
This specifically is a State resource.
State resources contain information that should persist.
You will define state resources as properties on your Extent subclass and create them with the `.state()` factory method.
State resources always have an initial value.
Our `person` resource has an intial value of "Nobody".

{{< highlight javascript >}}
    this.behavior()
      .demands(this.person)
      .runs(ext => {
        console.log("Hello, " + this.person.value + "!");
      });
{{< / highlight >}}

This is a Behavior.
Behaviors are units of functionality.
We create them with the `.behavior()` factory method that uses a fluent BehaviorBuilder API.

This behavior has two parts.
The `.demands()` clause states that this behavior depends on the resource `person`.

The `.runs()` clause is the code that gets run whenever one (or more) of the demands is updated (has new information).
This one prints our greeting using `this.person.value`.
The `.value` property returns the contents of our `person` state resource.
A behavior must demand a resource in order to access its `.value` property.
(It can also access it if it supplies the resource as well.)

{{< highlight javascript >}}
let e = new HelloExtent(g);
e.addToGraphWithAction();
{{< / highlight >}}

We will need to create an instance of our `HelloExtent` in order to add it to the graph.
Then we call `.addToGraphWithAction()` which adds the `HelloExtent`'s resource and behavior to our graph.
They will not perform any work until their extent has been added.

{{< highlight javascript >}}
g.action(() => {
  e.person.update("World");
});
{{< / highlight >}}

Here we create a new Action using `.action()` on our Graph instance.
Action blocks are how we introduce new information from the outside.
In this case, we are providing the person's name by calling `.update()` on our `person` state resource.

## How it works

This call to `.action()` will start a series of steps.

1. It will run the anonymous function given as a parameter.
2. `e.person.update()` will tell the graph to mark any demanding behaviors as activated.
In this case there is the only one demanding behavior.
3. The anonymous function will complete.
4. The graph will call the runs block on the one activated behavior.
5. That runs block prints out "Hello, World!" by accessing the `.value` of `person` which is the value we passed into the `.update()` method.
6. The `.action()` method completes and the program continues.

## Doing More

While this may seem like a tedious implementation of "Hello, World", we have already established the set of rules that will let this program grow to arbitrary complexity while having the computer support us the entire way.

Let's introduce a second reason why we may need to print our greeting.

{{< highlight javascript "hl_lines=2 4 6" >}}
    this.person = this.state("Nobody");
    this.greeting = this.state("Greetings");
    this.behavior()
      .demands(this.person, this.greeting)
      .runs(() => {
        console.log(this.greeting.value + ", " + this.person.value + "!");
      });
{{< / highlight >}}

First we create a second state, `greeting`.
Then we add `greeting` as an additional demand.
Finally we modify our message to use `greeting` as well.

If we run our program now it should produce

```
"Greetings, World!"
```

If we want to get back to our original message we can add more to our action.

{{< highlight javascript "hl_lines=3">}}
g.action(() => {
  e.person.update("World");
  e.greeting.update("Hello");
});
{{< / highlight >}}

Now we have

```
"Hello, World!"
```

This illustrates an important distinction between Behavior Graph and many reactive libraries.
Our behavior demands multiple resources.
That means when either `person` or `greeting` __or both__ update our behavior will run.
But it will only run after the action block completes.
We can update multiple resources (our equivalent of an observable property), but it doesn't immediately run downstream subscribers.
All updates inside a single action are treated as if they happend at the same time.
So we still only print our message once.

But we aren't required to provide both.
State resources persist their value from action to action.
So we could add an additional step.

{{< highlight javascript "hl_lines=5-7">}}
g.action(() => {
  e.person.update("World");
  e.greeting.update("Hello");
});
g.action(() => {
  e.greeting.update("Goodbye");
});
{{< / highlight >}}

Now in our console it should print

```
"Hello, World!"
"Goodbye, World!"
```

## Change

Not all information is "stateful".
Sometimes things just happen.
A button press is a typical example.
We can model this information with Moment resources.

{{< highlight javascript "hl_lines=3 5 7-9">}}
    this.person = this.state("Nobody");
    this.greeting = this.state("Greetings");
    this.button = this.moment();
    this.behavior()
      .demands(this.person, this.greeting, this.button)
      .runs(() => {
        if (this.button.justUpdated) {
          console.log(this.greeting.value + ", " + this.person.value + "!");
        }
      });
{{< / highlight >}}

First we create a new type of resource called a Moment resource.
You create them with a `.moment()` factory method on your Extent subclass.
Then we add it to our behavior's list of demands.

In our runs block we've now gated our log statement by checking `button.justUpdated`.
This will be true only if some other part of our code called "button.update()".
The result is that our program no longer outputs anything because we only update the `person` and `greeting` resources.

So lets add some additional lines.

{{< highlight javascript "hl_lines=8-10">}}
g.action(() => {
  e.person.update("World");
  e.greeting.update("Hello");
});
g.action(() => {
  e.greeting.update("Goodbye");
});
g.action(() => {
  e.button.update();
});
{{< / highlight >}}

Now our program outputs:

```
"Goodbye, World!"
```

The first two actions only update the state resources.
Our behavior is run but the `if (this.button.justUpdated)` check prevents anything from happening.
The third action causes the behavior to run as well, this time passing the `if` check and printing the message based on prior updates.

Of course they don't need to be in separate actions.

{{< highlight javascript "hl_lines=3">}}
g.action(() => {
  e.button.update();
  e.greeting.update("Nevermind");
});
{{< / highlight >}}

Will ouput:

```
"Nevermind, World!"
```

Because both `button` updated as well as `greeting` in that same action, regardless of the order in which they were updated.

## A Graph

With only one behavior, it is difficult to call it a behavior graph.
The real power of Behavior Graph comes with the ability to incrementally introduce dependent functionality.
Behaviors will often depend on the information compiled in other behaviors.

Imagine, for security sake, that we would like to introduce logging into our "Hello, World" printer.

{{< highlight javascript "hl_lines=2 4 7 9">}}
    this.button = this.moment();
    this.message = this.state(null);
    this.behavior()
      .supplies(this.message)
      .demands(this.person, this.greeting, this.button)
      .runs(() => {
        this.message.update(this.greeting.value + ", " + this.person.value + "!");
        if (this.button.justUpdated) {
          console.log(this.message.value);
        }
      });
{{< / highlight >}}

We add a new state resource to save the current message.
This time, we add this resource to the supplies clause of our behavior definition with `.supplies()`.
Supplies are resources that this behavior is solely responsible for.
It means that behavior can both read a resource's `.value` and `.update()` it.

A resource can only be supplied by one behavior.
Although a behavior can supply multiple resources.

{{< highlight javascript "hl_lines=6-10">}}
        if (this.button.justUpdated) {
          console.log(this.message.value);
        }
      });
      
    this.behavior()
      .demands(this.message)
      .runs(() => {
        console.log("Message changed to: " + this.message.value);
      });
{{< / highlight >}}

We've added another behavior here that demands `message`.
This means it will run whenever `message` updates.
Our output shows this result:

```
"Message changed to: Hello, World!"
"Message changed to: Goodbye, World!"
"Nevermind, World!"
"Message changed to: Nevermind, World!"
```
We log the message change once each time we update either `person` or `greeting`.
When they change, the first behavior runs which updates `message`.
This causes the second behavior to run and log `"Message changed to:...`.

We can also log when we send the message.

{{< highlight javascript "hl_lines=2 4 10 15 17-22">}}
    this.message = this.state(null);
    this.sentMessage = this.moment();
    this.behavior()
      .supplies(this.message, this.sentMessage)
      .demands(this.person, this.greeting, this.button)
      .runs(() => {
        this.message.update(this.greeting.value + ", " + this.person.value + "!");
        if (this.button.justUpdated) {
          console.log(this.message.value);
          this.sentMessage.update();
        }
      });
      
    this.behavior()
      .demands(this.message, this.sentMessage)
      .runs(() => {
        if (this.message.justUpdated) {
          console.log("Message changed to: " + this.message.value);      
        }
        if (this.sentMessage.justUpdated) {
          console.log("Message sent: " + this.message.value);
        }
      });
{{< / highlight >}}

First we create a moment resource for `sentMessage`.
Sending the message is a one off action, so we keep track of that with a moment.
We will be calling `.update()` on `sentMessage` so we need to add it to the list of supplies.
We call `this.sentMessage.update()` right after the `console.log` call to track when we actually print out our message.

Then we modify our logging behavior.
This behavior now demands `sentMessage` which means it will run whenever that resource is updated.
Inside our run block we check to see which resource was updated and generate the correct log message.
It may be the case that either one or both is updated.
The ability to reconstruct this "what just happened" information inside a block of code makes it easy to group related functionality together.

Our output now looks like this:

```
"Message changed to: Hello, World!"
"Message changed to: Goodbye, World!"
"Nevermind, World!"
"Message changed to: Nevermind, World!"
"Message sent: Nevermind, World!"
```

This completes our first tutorial.

## Challenge

Can you introduce a single resource that turns on or off our newly added logging?

Here's some hints:
* A state resource is easiest, but its also possible with a moment resource.
* You'll need to demand it in a behavior and introduce some additional logic.

### Answer

{{< highlight javascript "hl_lines=2 15 17 24">}}
    this.sentMessage = this.moment();
    this.loggingEnabled = this.state(true);
    this.behavior()
      .supplies(this.message, this.sentMessage)
      .demands(this.person, this.greeting, this.button)
      .runs(() => {
        this.message.update(this.greeting.value + ", " + this.person.value + "!");
        if (this.button.justUpdated) {
          console.log(this.message.value);
          this.sentMessage.update();
        }
      });
      
    this.behavior()
      .demands(this.message, this.sentMessage, this.loggingEnabled)
      .runs(() => {
        if (this.loggingEnabled.value) {
          if (this.message.justUpdated) {
            console.log("Message changed to: " + this.message.value);      
          }
          if (this.sentMessage.justUpdated) {
            console.log("Message sent: " + this.message.value);
          }
        }
      });
{{< / highlight >}}
