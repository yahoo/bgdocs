---
title: "Code Example"
mylang: "java"
language: "typescript"
---

We can illustrate how Behavior Graph code works in detail through another example application, a typical login screen.

![Login Page](/images/login-ui-2.svg)

As a first feature, we would like the Login button to remain disabled until the user has entered both a reasonable email and password.
If the user types in some password but an invalid email address (missing the '@' character, for example) the Login button will remain disabled.
Once she corrects the email address by adding an '@' character, the Login button should immediately enable.

In Behavior Graph, this unit of functionality constitutes a typical *behavior*.
It looks like this

{{< highlight javascript >}}
this.behavior()
    .supplies(this.loginEnabled)
    .demands(this.email, this.password)
    .runs(() => {
        const emailValid = this.validEmailAddress(this.email.value);
        const passwordValid = this.password.value.length > 0;
        const enabled = emailValid && passwordValid;
        this.loginEnabled.update(enabled);
    });
{{< /highlight >}}

Behaviors have dependencies on units of information called *resources*.
This behavior depends on two resources, `email` and `password`.
They appear as a list in the first parameter to `makeBehavior`.
This list is called the behavior's *demands*.
Our behavior has read only access to these resources.

As stated before, behaviors are never called directly.
In specifying a behavior's demands, we are saying, _"whenever any of these resources updates (changes), then this behavior needs to run"._
In our example, when either `email` or `password` (or both) update, this behavior will run in response.

`email` and `password` are a specific type of resource called a *state resource* which is designed for saving and retreiving information.
The contents of these state resources is available via their `value` property.

The block of code specified in the behavior is the code that will run.
A typical behavior uses normal code to perform its work.
Here we check the validity of the email with a normal function.
We determine if the Login button should be enabled using normal boolean logic.

This behavior is responsible for the enabled state of the Login button.
This information is stored in another state resource called `loginEnabled`.
We specify a behavior's responsibilites as a list in the second parameter to `makeBehavior`.
This list is called the behavior's *supplies*.
A behavior can read and write the contents of its supplies.
The contents of a state resource can be written to by calling its `{{< term "update-method" >}}` method.

We can continue to develop our Login page by adding a second feature.
When the user clicks the Login button and we are not already logging in, then we would like to enter into a logging in state.
In order to prevent mistakes, when we are in a logging in state, we would also like the Login button to be disabled.

To implement this new feature we introduce a second behavior and make a small change to our existing behavior.

{{< highlight javascript >}}
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

The new behavior has one demand, `loginClick`.
This is a second type of resource called a *moment resource*.
Moments are designed to track momentary happenings such as a button click or network call returning.
We can check if a moment has just happened by accessing its `{{< term "momentjustupdated-method" >}}` property.

When the user clicks on the button, `loginClick` will update, and this new behavior will run.
It performs a simple boolean check to determine if the `loggingIn` state resource needs to update to `{{< term "true-bool" >}}`.
It is allowed to update this resource because `loggingIn` is part of its supplies.

We also modified our previous behavior to include `loggingIn` as one of its demands.
This means it will run when the `loggingIn` resource updates as well as have permission to access the boolean `value` of `loggingIn`.
Now the state of `loginEnabled` depends on all three pieces of information: `email`, `password`, and `loggingIn`.

![Login Behavior Graph](/images/login-intro-graph.svg)

Information comes into our system via *actions*.
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
It will update the `loggingIn` resource to `{{ term "true-bool" >}}`.
This in turn will cause the behavior that supplies `loginEnabled` behavior to run.
It will update the `loginEnabled` resource to `{{< term "false-bool" >}}`.

In order to perform real output to the UI library, we need to create a *side effect*.

{{< highlight javascript >}}
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
This side effect updates the `enabled` state of the `loginButton` based on the state of the `loginEnabled` resource.
It does not run immediately, however.
Behavior Graph defers the running of side effects until after all behaviors have run.
Side effects are a practical way for Behavior Graph to create output while ensuring access to consistent state.

This example covers the primary concepts when developing with Behavior Graph.
There are, however, additional features that make Behavior Graph a practical software library.
