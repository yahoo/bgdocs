---
title: "Code Example"
language: "typescript"
weight: 30
---

_This is a walk-through, please see the [tutorials]({{< ref tutorial-1 >}}) for a complete guide to learning Behavior Graph._

Let's see how Behavior Graph code looks like by implementing functionality from a typical login screen.

![Login Page]({{< static "images/login-ui-2.svg" >}})

## Form Validation

As a first feature, we would like the Login button to remain disabled until the user has entered both a reasonable email and password.
If the user types in some password but an invalid email address (missing the '@' character, for example) the Login button will remain disabled.
Once she corrects the email address by adding an '@' character, the Login button should immediately enable.

Here is Behavior Graph code for this functionality.

{{< highlight javascript>}}
import * as bg from "https://cdn.skypack.dev/behavior-graph";

class LoginForm extends bg.Extent {
  constructor(graph) {
    super(graph)

    this.loginEnabled = this.state(false);
    this.email = this.state("");
    this.password = this.state("");
    
    this.behavior()
      .supplies(this.loginEnabled)
      .demands(this.email, this.password)
      .runs(() => {
        const emailValid = validateEmail(this.email.value);
        const passwordValid = this.password.value.length > 0;
        const enabled = emailValid && passwordValid;
        this.loginEnabled.update(enabled);
    });

  }
}

let graph = new bg.Graph();
let loginForm = new LoginForm(graph);
loginForm.addToGraphWithAction();
{{< /highlight >}}

First we import Behavior Graph to have access to its primary interface objects: `Graph` and `Extent`.

Next we subclass `Extent` which needs to be initialized with an instance of `Graph`.
__Extents__ are containers of Behavior Graph elements.
They also provide convenient API for creating these elements.

### Resources

Inside the constructor we create 3 __resources__ using the `state()` factory method: `loginEnabled`, `email`, and `password`.
Resources are special containers of information.
For example, the `loginEnabled` resource will say if our Login button should be enabled or not.
We initialize it with `false` because it will be disabled by default.

### Validation Behavior

After those we define a __behavior__.
It will determine if the Login Button should be enabled based on the contents of the `email` and `password` resources.
They appear as parameters to the `demands()` clause of our `behavior()` factory method.
This list of resources is called the behavior's __demands__.
They contain the information the behavior depends on.

As stated before, behaviors are never called directly.
In specifying a behavior's demands, we are saying, _"whenever any of these resources updates (changes), then this behavior needs to run"._
In our example, when either `email` or `password` (or both) update, this behavior will run in response.

The block of code specified in the `runs()` clause is the code that will run.
A typical behavior uses normal, imperative code to perform its work.
We check the validity of the email with a normal function call.
We use normal Boolean logic to determine if the Login button should be enabled.

`email` and `password` are a specific type of resource called a __state resource__. 
State resources are designed for saving and retrieving information.
The contents of a state resource is available via its `value` property.
A behavior must include a resources in its list of demands in order to access its `value`.
Note in the code above how we use `.value` to access what the Email resource contains in order to validate it.

### Supplies

This behavior is responsible for the enabled state of the Login button.
We store this information in another state resource called `loginEnabled`.
We list this resource in the `supplies()` clause of our `behavior()`.
This list is called the behavior's __supplies__.
A behavior can read and write the contents of these resources.
We write to a state resource by calling its `{{< term "update-method" >}}` method.

## Logging In

We continue to develop our Login page by adding a second feature.
When the user clicks the Login button and we are not already logging in, then we would like to enter into a logging in state.
In order to prevent mistakes, when we are in a logging in state, we would also like the Login button to be disabled.

To implement this new feature we introduce a second behavior and make a small change to our existing behavior.

{{< highlight javascript "hl_lines=1-11 15 19">}}
this.loginClick = this.moment()
this.loggingIn = this.state(false)

this.behavior()
    .supplies(this.loggingIn)
    .demands(this.loginClick)
    .runs(() => {
        if (this.loginClick.justUpdated && !this.loggingIn.value) {
            this.loggingIn.update(true);
        }
    });

this.behavior()
    .supplies(this.loginEnabled)
    .demands(this.email, this.password, this.loggingIn)
    .runs(() => {
        const emailValid = this.validEmailAddress(this.email.value);
        const passwordValid = this.password.value.length > 0;
        const enabled = emailValid && passwordValid & !this.loggingIn.value;
        this.loginEnabled.update(enabled);
    })
{{< /highlight >}}

Our new behavior has one demand, `loginClick`.
This is a second type of resource called a __moment resource__.
Moments are designed to track momentary happenings such as a button click or network call returning.
We can check if a moment has just happened by accessing its `{{< term "momentjustupdated-method" >}}` property.

When the user clicks on the button, `loginClick` will update, and this new behavior will run.
It performs a simple Boolean check to determine if the `loggingIn` state resource needs to update to `{{< term "true-bool" >}}`.
It is allowed to update this resource because `loggingIn` is part of its supplies.

We also modified our previous behavior to include `loggingIn` as one of its demands.
This means it will also run when the `loggingIn` resource updates.
Now the state of `loginEnabled` depends on all three pieces of information: `email`, `password`, and `loggingIn`.

## Actions

![Login Behavior Graph]({{< static "images/login-intro-graph.svg" >}})

Information comes into our system via __actions__.
A typical UI library will provide some type of callback or event system to capture user inputs.
In this example we will listen to a click handler to create a new action which updates the `loginClick` moment resource.

{{< highlight javascript >}}
this.loginButton.onClick = () => {
    this.action(() => {
        this.loginClick.update();
    });
};
{{< /highlight >}}

We would similarly connect `email` and `password` to their respective text fields.

Once the user has entered a valid email and password, the Login button will enable.
When the user subsequently clicks on the Login button, the behavior that supplies `loggingIn` will run.
It will update the `loggingIn` resource to `{{< term "true-bool" >}}`.
This in turn will cause the behavior that supplies `loginEnabled` to run.
It will update the `loginEnabled` resource to `{{< term "false-bool" >}}` (because we are logging in).

## Side Effects

In order to perform real output to the UI library, we need to create a __side effect__.

{{< highlight javascript "hl_lines=10-12">}}
this.behavior()
    .supplies(this.loginEnabled)
    .demands(this.email, this.password, this.loggingIn)
    .runs(() => {
        const emailValid = this.validEmailAddress(this.email.value);
        const passwordValid = this.password.value.length > 0;
        const enabled = emailValid && passwordValid & !this.loggingIn.value;
        this.loginEnabled.update(enabled);

        this.sideEffect(() => {
            this.loginButton.enabled = this.loginEnabled.value;
        });
    })
{{< /highlight >}}

Side effects are created directly inside behaviors.
Inside are are allowed to do anything we like.
This side effect updates the `enabled` state of the `loginButton` based on the state of the `loginEnabled` resource.
It does not run immediately, however.
Behavior Graph defers the running of side effects until after all behaviors have run.
Side effects are a practical way for Behavior Graph to create output while ensuring access to consistent state.

## Learning More

Congratulations, you have just learned all the important concepts for using Behavior Graph in your code.

Please don't be discouraged by the number of new abstractions.
This walk-through is intentionally brief.
But from here on out, it's mostly just nuance.

To learn more, please take a look at our [tutorials]({{< ref tutorial-1 >}}).
