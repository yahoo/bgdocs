---
title: "Tutorial 2 - IO"
---

This tutorial will show how Behavior Graph interacts with real inputs and outputs to produce a working application.
In this case we will build the control system for a thermostat, the device in your house that controls the heat.

![Thermostat](/images/thermostat-ui.png)

This simplified thermostat has two buttons, __Up__ and __Down__ for raising and lowering the desired temperature.
It also periodically gets external updates of the current temperature.
If the desired temperature is above the current temperature, we will turn on the heat.
And once they are the same, the heat will turn off.

## Initial Code

We have created a starter project using [JSFiddle](https://jsfiddle.net/slevin11/k3z2uysx/11/).
You should use that for this tutorial.
It has some simple HTML/CSS to represent the Thermostat's user interface.
If you wish to use your own environment you will need to copy the HTML and CSS from this JSFiddle site into your own.

The initial setup code has been provided for you.

{{< highlight javascript "hl_lines=">}}
import * as bg from "https://cdn.skypack.dev/behavior-graph@beta";

class Thermostat extends bg.Extent {
  constructor(graph) {
    super(graph);
  }
}

let graph = new bg.Graph();
let tm = new Thermostat(graph);
tm.addToGraphWithAction();
{{< / highlight >}}

The bulk of our application will exist inside our `Thermostat` subclass of `Extent`.

## Desired Temperature

The first part of our logic will focus on setting the desired temperature.
The related elements look something like this.

![Desired Temperature](/images/thermostat-temp.svg)

First we need a state resource to track our desired temperature and a behavior to supply it.

{{< highlight javascript "hl_lines=5-10">}}
class Thermostat extends bg.Extent {
  constructor(graph) {
    super(graph);

    this.desiredTemperature = this.state(60);
    this.behavior()
      .supplies(this.desiredTemperature)
      .runs(() => {
      	// desired temperature logic will go here
      });
  }
}
{{< / highlight >}}

`desiredTemperature` is a state resource with an initial value of 60.
We want a state resource because it is information we intend to use in the future.
Our new behavior supplies this resource because we plan on calling `desiredTemperature.update()` inside the runs block.

### Button Presses

Our thermostat will need to respond to the button press events that come from our HTML buttons.

{{< highlight javascript "hl_lines=3-6">}}
    super(graph);

    this.up = this.moment();
    document.querySelector('#up').addEventListener('click', () => {
      this.up.updateWithAction();
    });

    this.desiredTemperature = this.state(60);
{{< / highlight >}}

We create an `up` moment resource to track when the Up button is pressed.
Then we use standard DOM manipulation code to respond to the HTML click event.
We call `this.up.updateWithAction()` to track this event in our moment resource.

`.updateWithAction()` is syntactic sugar for creating a new action and calling `.update()`.
It is the same as if we typed this instead:

{{< highlight javascript "hl_lines=">}}
    document.querySelector('#up').addEventListener('click', () => {
      this.graph.action(() => {
        this.up.update();
      });
    });
{{< / highlight >}}

### Responding to the Button

We need to modify our behavior to respond to this update.

{{< highlight javascript "hl_lines=4 6-8">}}
    this.desiredTemperature = this.state(60);
    this.behavior()
      .supplies(this.desiredTemperature)
      .demands(this.up)
      .runs(() => {
        if (this.up.justUpdated) {
          this.desiredTemperature.update(this.desiredTemperature.value + 1);
        }
      });
{{< / highlight >}}


We add `up` to our list of demands.
This ensures that this behavior activates whenever `up` is updated.
Inside the run block we check for `.justUpdated`.
If so, we update the `desiredTemperature` by incrementing it from its previous `.value`.

{{< alert title="Access Rules" color="primary" >}}
1. You can only access `.justUpdated` inside behaviors that demand (or supply) that resource.
Otherwise Behavior Graph will raise an error.
2. You can only access `.value` inside behaviors that demand (or supply) that resource.
Otherwise Behavior Graph will raise an error.
3. You can only call `.update()` inside a behavior that supplies that resource.
A resource can only be supplied by one behavior.
Behavior Graph will raise an error if you do this incorrectly.
{{< /alert >}}

These rules are essential to allowing Behavior Graph to ensure your resources are always in a consistent state.

### Output

At this point our `desiredTemperature` changes when you press the Up button.
But we don't update the display.
We add that here.

{{< highlight javascript "hl_lines=8-10">}}
    this.behavior()
      .supplies(this.desiredTemperature)
      .demands(this.up)
      .runs(() => {
        if (this.up.justUpdated) {
          this.desiredTemperature.update(this.desiredTemperature.value + 1);
        }
        this.sideEffect(() => {
          document.querySelector('#desiredTemperature').innerText = this.desiredTemperature.value;
        });
      });
{{< / highlight >}}

This behavior creates a __Side Effect__ block.
Inside that block we use standard DOM methods to update the temperature.
Now if you run this and click on the Up button you will see the temperature field appear and increment.

Side effects are the correct way to generate output from inside a behavior.
Although a side effect is created inside a behavior, it will only run after all other behaviors have completed running.
This ensures that all our internal state has settled before calling code that may potentially access it.

Side effects do not have a restriction on what resources they can access, unlike the behavior in which they are defined.

### Down

We can add the handling for our Down button in a similar way.

{{< highlight javascript "hl_lines=6-9">}}
    this.up = this.moment();
    document.querySelector('#up').addEventListener('click', () => {
      this.up.updateWithAction();
    });

    this.down = this.moment();
    document.querySelector('#down').addEventListener('click', () => {
      this.down.updateWithAction();
    });
{{< / highlight >}}

And modify our behavior to respond.

{{< highlight javascript "hl_lines=3 7-9">}}
    this.behavior()
      .supplies(this.desiredTemperature)
      .demands(this.up, this.down)
      .runs(() => {
        if (this.up.justUpdated) {
          this.desiredTemperature.update(this.desiredTemperature.value + 1);
        } else if (this.down.justUpdated) {
          this.desiredTemperature.update(this.desiredTemperature.value - 1);        
        }
        this.sideEffect(() => {
{{< / highlight >}}

Run the program.
Clicking on the Up and Down buttons should now move the desired temperature display up and down.

### AddedToGraph

You may have noticed that the desired temperature display doesn't show up until after we've tapped on one of the buttons.
This is because our behavior only runs when one of its demands is updated.
What we would like to do is also run it once at the beginning.

{{< highlight javascript "hl_lines=3">}}
    this.behavior()
      .supplies(this.desiredTemperature)
      .demands(this.up, this.down, this.addedToGraph)
      .runs(() => {
        if (this.up.justUpdated) {
{{< / highlight >}}

We add the `this.addedToGraph` resource to our list of demands.
Now when you run the code you will see that the temperature appears at the beginning.

`addedToGraph` is a built in state resource that is part of every Extent.
It is updated to `true` when the Extent is added to the graph.
Just like other resources you can demand it to get a behavior to run at the beginning.
And you can check it's `.justUpdated` property to specialize your logic when necessary.

## Heat

Now we need to introduce a separate bit of functionality to control the heating equipment.
This logic compares the current temperature to the desired temperature and turns on or off the heating equipment accordingly.

![Current Temperature](/images/thermostat-heat.svg)

### Current Temperature

First we need a resource to track the current temperature,

{{< highlight javascript "hl_lines=2">}}
    this.desiredTemperature = this.state(60);
    this.currentTemperature = this.state(60);
{{< / highlight >}}

and a new behavior to update the UI when that resource updates.

{{< highlight javascript "hl_lines=6-12">}}
        this.sideEffect(() => {
          document.querySelector('#desiredTemperature').innerText = this.desiredTemperature.value;
        });
      });
      
    this.behavior()
      .demands(this.currentTemperature, this.addedToGraph)
      .runs(() => {
        this.sideEffect(() => {
          document.querySelector('#currentTemperatureDisplay').innerText = this.currentTemperature.value;
        });
      });
{{< / highlight >}}

Like with `desiredTemperature` this behavior runs whenever `currentTemperature` updates as well as once at the beginning.
It uses a side effect to update our UI.

### Heat On

Next we need a resource to track if the heat is on or not.

{{< highlight javascript "hl_lines=3">}}
    this.desiredTemperature = this.state(60);
    this.currentTemperature = this.state(60);
    this.heatOn = this.state(false);
{{< / highlight >}}

By default the `heatOn` state resource is `false` indicating that it is off.

{{< highlight javascript "hl_lines=7-13">}}
      .runs(() => {
        this.sideEffect(() => {
          document.querySelector('#currentTemperatureDisplay').innerText = this.currentTemperature.value;
        });
      });

    this.behavior()
      .supplies(this.heatOn)
      .demands(this.currentTemperature, this.desiredTemperature)
      .runs(() => {
        let heatOn = this.desiredTemperature.value > this.currentTemperature.value;
        this.heatOn.update(heatOn);
      });
{{< / highlight >}}

Here we add another new behavior.
It is responsible for updating `heatOn` so we add it as a supply.
It uses both `currentTemperature` and `desiredTemperature` for its logic, so both are demands.
When it runs, it updates `heatOn` to true if our `currentTemperature` is too low.

### Heat Display

We want our display to update alongside the `heatOn`.
So we add that logic to our new behavior.

{{< highlight javascript "hl_lines=3 7-9">}}
    this.behavior()
      .supplies(this.heatOn)
      .demands(this.currentTemperature, this.desiredTemperature, this.addedToGraph)
      .runs(() => {
        let heatOn = this.desiredTemperature.value > this.currentTemperature.value;
        this.heatOn.update(heatOn);
        this.sideEffect(() => {
          document.querySelector('#heatStatus').innerText = this.heatOn.value ? "On" : "Off"
        });
      });
{{< / highlight >}}

We demand `addedToGraph` to ensure we update the display when the thermostat starts.
We also add a side effect block to update the UI.

Now when you click the Up and Down buttons you should see the heating display change based on `desiredTemperature` changes.

### Heating Equipment

In a real thermostat, whenever `heatOn` changes, we would send a signal to real heating equipment somewhere else in the house.
Since we don't have that available, we will simulate our own heat and demonstrate how we can mix in other asynchronous elements.

We'll add a new behavior.

{{< highlight javascript "hl_lines=6-14">}}
        this.sideEffect(() => {
          document.querySelector('#heatStatus').innerText = this.heatOn.value ? "On" : "Off"
        });
      });

    this.behavior()
      .demands(this.heatOn)
      .runs(() => {
        if (this.heatOn.justUpdatedTo(true)) {
        	// turn heat on
        } else if (this.heatOn.justUpdatedTo(false)) {
        	// turn heat off
        }      
      });
{{< / highlight >}}

This new behavior responds to `heatOn` updates.
It uses `.justUpdatedTo()` to differentiate changing to true or false.

At this point we want to make an important point about the way state resources work.
Even though the behavior that supplies `heatOn` calls `.update()` every time it runs, it doesn't necessarily update the state resource.
Behavior Graph uses `===` to check if the new value is different from the starting value.
If they are the same, the state resource does not actually update.
Therefore, demanding behaviors are not activated.

As an example, if `heatOn.value` is currently `false`, calling `heatOn.update(true)` will update the resource and activate demanding behaviors. However, if in the next event we also call `heatOn.update(true)`, Behavior Graph will check `true === true` and therefore will not actually update or activate demanding behaviors.

#### Turning On

We can use the built-in Javascript API `setInterval()` to simulate our heat changing over a period of time.
When on, this timer will increment our current temperature by 1 every 1.5 seconds.

{{< highlight javascript "hl_lines=2-8">}}
        if (this.heatOn.justUpdatedTo(true)) {
          	this.sideEffect(() => {
          		this.heatingIntervalId = setInterval(() => {
              	this.action(() => {
                	this.currentTemperature.update(this.currentTemperature.value + 1);
                });
              }, 1500);
            });
        } else if (this.heatOn.justUpdatedTo(false)) {
{{< / highlight >}}


This branch creates a side effect which starts the timer and saves that timer directly to a normal property `heatingIntervalId`.
We will use this to stop the timer later.
When the timer fires, we create an action to bring new information into Behavior Graph.
In this case, the new information is that `currentTemperature` has increased by 1.
Note we are accessing `currentTemperature.value` inside a side effect block which means we don't need to add it as a demand of the behavior.

`heatingIntervalId` is a normal Javascript property.
You are always welcome to use normal properties and methods inside behaviors however you like.
You just won't get the additional support from Behavior Graph for those uses.
In this case, we don't need to respond to any changes with it so we just save it to a property.


#### Turning Off

If you run this program now, the heat will start incrementing but it won't stop once the heat turns off.
We will add an additional side effect for this.

{{< highlight javascript "hl_lines=2-5">}}
        } else if (this.heatOn.justUpdatedTo(false)) {
          this.sideEffect(() => {
            clearInterval(this.heatingIntervalId);
            this.heatingIntervalId = null;
          });
        }      
{{< / highlight >}}

This side effect cancels our timer when the heat turns off.
`clearInterval()` is a built-in Javascript method to cancel the timer.
We set the property to null for cleanliness.

Now run the code and turn the desired temperature up a few degrees from the current temperature and wait.
You will see the current temperature slowly increase until they equal and the heat will turn off.

## Behavior Graph Programming

This code is typical Behavior Graph programming style.
The path we went through to get here is typical of the Behavior Graph programming process.
The important step is learning how to organize code into behaviors.

### Control Flow for Free

Behaviors are never called directly, which can feel like a lack of control.
This is a fair intuition, but also incorrect.
Behavior Graph improves our ability to express the intent of our code.
We do not think in terms of "do this now".
Instead we think, "here are the reasons why this should run".

Behavior Graph determines the behavior that should run next based on which behaviors have been activated and their dependencies.
A behavior that may influence another behavior will always run first.

Looking a the behaviors in our Thermostat program and their linked resources we can figure out exactly how things will run.
Here's the sequence of steps when we click the Up button.

1. Action: `up.update()`, activate Behavior 1
2. Behavior 1: `desiredTemperature.update(61)`, activate Behavior 2, create Side Effect 1
3. Behavior 2: `heatOn.update(true)`, activate Behavior 3, create Side Effect 2
4. Behavior 3: create Side Effect 3
5. Side Effect 1: `#desiredTemperature` HTML element changes to "61"
6. Side Effect 2: `#heatStatus` HTML element changes to "On"
7. Side Effect 3: Create simulated "heating" timer

The status quo approach of organizing around method calls leaves us open to potential errors as dependencies change.
With Behavior Graph, if we introduce a new dependency for Behavior 1, the rest of the control flow adapts.
Everything will continue to run in the correct order.
This is Behavior Graph doing the work for you.

### Incremental Adoption

Behavior Graph is not the solution to all programming problems.
It is a tool for structuring the event driven logic portion of your software.
Feel free to use it as much or as little as you like.

When introducing it incrementally to an exiting codebase, it is easiest to work back from the output.
1. Find a place were you update the UI, start an animation, or make a network call.
2. Wrap that up in a side effect inside a behavior.
3. Then figure out what new information should cause that behavior to run.
4. Turn that information into resources.
5. Either update those resources inside action blocks or write new behaviors to supply them.
6. Repeat.

## Congratulations

Congratulations! You have completed the second tutorial.
You can see the [finished tutorial code here](https://jsfiddle.net/slevin11/kfuwrmb8/268/).
