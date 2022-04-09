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


## Going Deeper: Functions and Dependencies

Here's the problem. As humans we need to break things down in order to think about things.
We can't get into the weeds. For example if I click a login button I want to say, "ok, validate the form first, then try making a login API call over the network and then update the ui to indicate that we are actively logging in. (Although here I'm doing a lot of functional thinking, do this then this).

So we'd like to be able to think in chunks like "validate form", "login API call", "and update the UI".
The tool our programming language provides for this task is the function.
The challenge is that these different tasks actually depend on each other.
We want to make a login api call if the user hits the button but only if the form passes validation.
And we want to update the ui if either we validation fails or we start logging in (to indicate it is in process).

So using functions, how do we indicate these dependency relationships between different parts of our code?
Function definitions don't determine when they should be called.
That happens somewhere else, at the call site.
So at best these dependency relationships exist elsewhere.

And even then we are limited with what we can do.
Functions allow us to pass parameters and return values.
So if we stay in the realm of pure functions we can do some indication of relationships by using parameters and return values.
This is the approach strongly advocated by functional programmers.
We might end up with something like this.
```
onButtonClick() {
    let formState = getFormFields();
    let validationResults = validateForm(formState);
    let loginResults = loginAPICall(validationResults);
    updateUI(validationResults, loginResults);
}
```

Something like that. Its difficult to be purely functional without the full support of a functional language.
So it is more difficult to get things wrong because you'd have to get the paramters correct.
If your types are suitably rich it could be a workable solution, but it does take some time.

But even then its not enough to just get parameters right.
We still need to get the sequencing right. 
Functions still need to be called and they nee dto be called in the correct order.
And there's not enough information in those function definitions to do it for us.
That doesn't happen for free.
And in many cases its not even obvious how to get the sequencing rigtht.
Dependencies could span multiple levels of calls and we need to work it out at the right level
(for example)

And the problem is that this leads to work and effort and bugs
I could articulate more of the problems which I have in the past.

Our alternative is a different unit of organization.
One that has more accurate information about the things it depends on.
Then in theory we can do away with the calls and parameters and return values and just let the compiler figure it out.

We can look at functions and their data access patterns to show how we can take advantage of already available information.
So if `validateForm` is responsible for some piece of data we call `validationResults` and `updateUI` accesses this data to do its work we know there is some dependency relationship there.
And we can say well if validationResults changes from what it was before than updateUI needs to run as well to match.
And this is essentially reactive programming and observers.

And this works in a number of scenarios but it doesn't work everywhere.
For example, `loginAPICall` depends on the validationResults (ie don't make the call if they fail) but we don't want it to run whenever the resultsChange, (maybe we call it periodically while the user is typign also). So here we have a dependency but we only want it to run when we click the login button.
So here we need to be explicit about what type of dependency things are or a way of checking what just happened. So we need some enhanced data (just passing in the results only isn't good enough).

But now that we've removed the "calling" from validateForma dn updateUI and loginAPICall, what do they depend on to get called in the first place. We know their relation to each other but how about to the button press.
There's no state to check against.
so we need to be able to depend on some internal event that tracks the button press.
This is similar but different than reactive state.

Behavior Graph lets us define different dependency types.
It lets us specify reactive state and reactive events (moments).
And it lets us query what changed about these reactive data from different blocks of code.

All of this means we can structure more of the apps logic


then there is transactions
side effects
dynamic behaviors



And monads
And then all we can do is make sure we get the dependency relationships correctly by proper sequencing of function calls.
Our logic with the login button requires that we first call validateForm(), then loginAPICall(), then updateUI().









Let's take a deeper look at why functions don't express dependency relationships well and how that makes our lives as programmers more difficult.

The vast majority of our codebases are organized into functions.
We use functions because they are the primary tool our programming languages give us for this task.
And inherent to the nature of functions is that we need to _call_ them from somewhere else.

We can look at a typical Login Form as an example.
One feature would be for our program to validate the user inputs when the user clicks the login button.
If the validation fails we should update the UI to provide feedback to the user.
We might implement it like this.

```javascript
function onLoginButtonClick() {
  validateInputs();
}

function validateInputs() {
  // validation code here...
  updateUI();
}

function updateUI(validationResults) {
  // UI code here...
}
```

We've subdivided our code into three functions.
But they don't independently define their role in the program.
It would be nice to define `validateInputs` to say "run this when the Login Button is clicked".
But that is not possible with functions.
Instead we must insert an explicit call to `validateInputs()` inside the definition of `onLoginButtonClick`.

This separation is only a minor inconvenience in such a tiny program.
But it does add up.. meh

Now a form like this
Now if we introduce some additional to make a login API call if the validation result


The definition of `validateInputs` tells us what it does, but it doesn't tell us when it runs.
That is somewhere else, inside `onLoginButtonClick`.
`updateUI` is define


as a programmer we need to inject these explicit control flow statements somewhere else
And we are doing this to validateInputs cannot say `I run when button click happens`
these functions have their definitions spread out






When the describing this feature, there's a natural set of dependencies that stand out.
* Validation depends on the button being clicked.
* The UI depends on validation results.

As humans, its trivial to think in terms


In response to a user clicking on a button, the computer will run these three functions.
They perform the work which gives our program value.
Their author determined that this particular organization was a reasonable approach.
But just looking at these lines of code doesn't give us all the information we need.
These functions are defined somewhere else.
it would take investigating to understand what they do and what information they depend on.

We need dependency information so we can property order our function calls.
Order matters.
Our `updateUI()` function makes changes to the interface to indicate to the user what they should do next.
To do so, it depends on information that the other two functions are responsible for: determining if there is user error and starting an asynchronous network login call.
If we call `updateUI()` before the other two we will miss out on this functionality.
As programmers, it is our job is to discern the dependency relationships between these functions and order our function calls accordingly.

Dependencies are closer to the problem domain.
As humans, we think, "what I see in user interface depends on if I have entered a valid email and password".
And "the user interace also depends on whether or not I am waiting while the system logs me in".
But we can't say that with function calls.
All we can do is call them in the correct order to implicitly capture that dependency information.

What if we _could_ keep that dependency information around instead?
Let's sketch out a _new_ type of function that lets us do this, we will call it `behavior`:

```javascript

behavior.demands(validInputs, activelyLoggingIn)
        .runs(() => {
          // updateUI code goes here
        })

behavior dependsOn(validInputs, activelyLoggingIn) {
  // updateUI code here
}

behavior responsibleFor(validInputs) 
         dependsOn(loginButtonClicked) {
  // validateInputs code here
}

behavior responsibleFor(activelyLoggingIn)
         dependsOn(loginButtonClicked) {
  // makeLoginAPICall code goes here
}
```

Here we have an alternate version of functions that are explicit about what information they work with.


Order matters, but dependencies are closer to the problem.




All day long, we mentally translate between dependency relationships and the order of function calls.
We do this so much that it's second nature for most developers.
The problem is that it is often difficult.
And that difficulty scales with the size of a codebase.
And we frequently get it wrong.
All of which means we expend a lot of effort on this translating.



```javascript
function onButtonClick() {
  validateInputs();
}

function validateInputs() {
  // validation code here...
  updateUI();
}

function updateUI() {
  // UI update code here
}
```

## Analysis

There is a pathway that begins with the button press code.
It meanders through various functions, in and out, line by line, until all the relevant work has been performed.
The chain of explicit function calls that makes up this pathway is the control flow we are interested in.

We will build on a common example to demonstrate the problem.
Imagine a typical household thermostat that sits on the wall and controls the temperature.
It will have:
 1. Up and Down buttons to set the Desired Temperature
 2. A display which shows the Desired and Current Temperatures
 3. An ability to read in the Current Temperature
 4. An ability to turn on and off the Heating Equipment
Our program to implement the thermostat will need to implement a few features
 1. Pressing the Up and Down buttons change the Desired Temperature and the display updates in response.
 2. Reading in a new Current Temperature should also update the display in response.
 3. If the Desired Temperature is below the Current Temperature, the Heating Equipment should turn on (or off otherwise).

We make procedure calls because there is some relationship between 

The problem
Explicit control flow gives us one tool, "do this now"



One challenge is that control flow can be correctly implemented any number of ways.
And the more features we add the more valid paths through the code.
Here is one way we might implement the control flow in response to pressing the Up button.

```javascript
function upButtonPressed() {
  updateDesiredTemperature(+1); // increment
  updateUI();
  updateHeatingState();
  updateHeatingEquipment();
}
```

## Seriously, another library?!

If you remain unconvinced, we still encourage you look for some patterns in your own code.
Over time you will become aware of the added programmer effort that comes with keeping function calls properly sequenced.

* Do you see where you've 

update state, now ru this function to possibly do stuff with it

functions that specify



For now, pay close attention to the control flow logic in your own code.
Do you see where it is?
Do you see when you are maintaining it?
Pay attention to when dependency changes lead to bugs in your control flow logic.
When you start to see a pattern, come back and give Behavior Graph a closer look.





. __mind sized chunks__  https://twitter.com/KentBeck/status/1354418068869398538?s=20&t=GPGbxTQInhXtLW6arDjQ3w



It would be a disservice not to share it with the rest of the programming community.


