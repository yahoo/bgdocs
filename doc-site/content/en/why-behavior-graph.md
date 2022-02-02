---
title: "Why Behavior Graph?"
weight: 20
---

**Behavior Graph**  is a software library that greatly enhances our ability to program **user facing software** and **control systems**. Programs of this type quickly scale up in complexity as features are added. Behavior Graph directly addresses this complexity by shifting more of the burden to the computer. 
It works by offering the programmer a new unit of code organization called a **behavior**. 
Behaviors are blocks of code enriched with additional information about their stateful relationships. 
Using this information, Behavior Graph enforces _safe use of mutable state_, arguably the primary source of complexity in this class of software. 
It does this by taking on the responsibility of control flow between behaviors, ensuring they are are _run at the correct time and in the correct order_.

## Interactive Systems

It helps to understand why user facing software, control systems, and similar programs present a particular challenge.

We define these systems by three primary characteristics:

1. *Asynchronous*: inputs can happen over a period of time and at any time
2. *Event-driven*: outputs occur over time in response to inputs
3. *Stateful*: outputs depend on a history of prior inputs

A thermostat controlling the temperature in a house is an example:

![Thermostat]({{< static "images/thermostat-wall.svg" >}})

1. It runs continuously, responding to temperature changes as well as button presses in order to operate the heating equipment.
2. Button presses will result in changes to the display.
3. Button presses which set the desired temperature will determine when the heating equipment turns on in the future.

The challenge comes from the large number of different inputs where order and history matter.
A sequence of 10 presses on our Up and Down buttons can occur in over 1000 different ways.
An interface that accepts 10 different types of input over a sequence of 10 events means we are facing 10 billion possible arrangements.
And that is a tiny fraction of what a real user facing application is typically up against.

The solution comes from the fact that we only need to remember just enough information to make decisions in the future.
Instead of remembering each button press, we simply remember a desired temperature and update it as inputs happen.
We don't care which sequence of button presses gets us to 68 degrees.
To our program they are all the same.
We call this compressed historical information *state.*
With state we can compress 10 billion button presses into a single number.

Inputs lead to state changes.
Pressing the Up and Down button changes the desired temperature state.
State changes lead to outputs.
Changing the desired temperature means the display will change.
State changes also often lead to other state changes as our program grows in features.
When the desired temperature changes, the desired state of the heating equipment may change.
(And when that desired state of the heating equipment changes, our program will output to turn on or off the heating equipment.)

A correctly functioning program will have a natural dependency graph between inputs, internal states, and outputs.
Unfortunately, status quo programming techniques have no way of expressing this dependency graph directly.
Programmers must implicitly build this graph out of the correct sequencing of method calls and state updates.
In so doing, they throw away this valuable dependency information and the computer can no longer help us.
**That is the root of the problem.**

## Behavior Graph

With Behavior Graph, we build our programs out of units of functionality called *behaviors*.
Behaviors manage state via components called *resources*.
Behaviors are simple, easily understood blocks of code paired with any relationships to these resources.
Resources are objects which encapsulate both state and how that state changes.
A behavior for our thermostat would be "_when the user presses the *Up* or *Down* buttons, increase or decrease the desired temperature by one degree_."
The _desired temperature_ is the resource that this behavior manages.

![Desired Temperature]({{< static "images/thermostat-temp.svg" >}})

An entire thermostat program would be built out of many of these behaviors.
So we add a second behavior, "_when the current temperature is below the desired temperature, turn on the heating equipment_."
Our behaviors will collaborate to implement the complete thermostat functionality without knowing about each other directly.
Instead, behaviors compose via resources, in this case _desired temperature_.
The first behavior declares that it is responsible for setting the _desired temperature_.
The second behavior declares that it uses the _desired temperature_ to know if it needs to turn on the heat.

![Heating]({{< static "images/thermostat-heat.svg" >}})

We never run behaviors directly by calling them like we do with methods.
Instead Behavior Graph uses the dependencies between behaviors and resources to determine which behaviors need to run and in which order.
If the user presses the Up button to raise the desired temperature above the current temperature, the heating behavior will automatically run after the temperature behavior updates the _desired temperature_ resource.

Here we can see the contrast to the status quo approach of nesting chains of method calls.
In order to ensure the heat can be turned on when the up button is pressed, the button press method needs to call the desired temperature setting method.
And that method in turn needs to call the heating equipment method.
Because no method runs unless another method calls it, we must explicitly weave these threads of control flow throughout our code.
In large programs, separately maintaining control flow to ensure our dependency graph is respected is both difficult and error prone.

Fred Brooks [famously pointed out](https://en.wikipedia.org/wiki/No_Silver_Bullet) that software is necessarily complex because the problems themselves are complex.
With Behavior Graph we overcome our human complexity limits by delegating more of that work to the computer itself.
As programmers, we focus on individual behaviors and their immediate relationships.
The computer in turn handles the complex chore of sorting through hundreds or thousands of those behaviors to ensure a working program. 

__Behavior Graph gives us control flow for free.__

Behavior Graph is a compact and mature library with no external dependencies.
It is used in production applications with millions of daily users.
It is available for multiple languages and platforms (Objective C/Swift, Typescript/Javascript, Kotlin).
