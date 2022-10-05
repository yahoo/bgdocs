---
title: "Tutorial 3 - Extents"
---

In this tutorial we will create a simple todo list.

![Todo List]({{< static "images/todolist.png" >}})

A todo list is interesting because it has user interface elements with __independent lifetimes__.
When we start, our list is empty.
The visible interface elements are the header for adding new items and a footer for the remaining items.
After we click Save, a new item will appear with a checkbox for completing it, and a button for deleting it.
The list as a whole has a longer lifetime than the individual items.

We will implement this by adding and removing Extents from the graph as we add and remove items from our list.
This is a powerful and practical technique that gives Behavior Graph a unique expressiveness in the state management realm.

## Initial Code

The recommended way to get started is to use our [preconfigured tutorial site](https://replit.com/@slevin1/Behavior-Graph-Java-Tutorial-3?v=1).

It has some simple Swing code to represent the Todo List's user interface.
If you wish to use your own environment you will need to copy the java files from this project to your environment.

`Main.java` sets up the project, creates the Graph, ListExtent, and UI objects.

`ListUI.java` and `ItemUI.java` contain the majority of the Swing code we will use to interact with the UI.

`ListExtent.java` will contain the logic for the whole list. We've created the stub for you. It uses the Extent subclass pattern.

`ItemExtent.java` will contain logic for each item.

## Adding Items

_New code for you to add or modify will always be highlighted._

We'll start off by adding logic for adding a new item inside `ListExtent.java`

{{< highlight java "hl_lines=3 8-10 12-16">}}
public class ListExtent extends Extent<ListExtent> {
  
  TypedMoment<String> save = typedMoment();
  
  public ListExtent(Graph graph, ListUI listUI) {
    super(graph);

    listUI.save.addActionListener(actionEvent -> {
      save.updateWithAction(listUI.newItemText.getText());
    });

    behavior()
      .demands(save)
      .runs(ext -> {
        // add item here
      });
  }
}
{{< / highlight >}}

We create a `save` moment resource to model the interaction of clicking on the Save button after typing in something into the input box.
This moment is a `TypedMoment`, however.
These model the same temporary interactions as moments, but they carry additional information.
Our `save` moment will have a `String` value in which we will store the text of the new todo list item.

We use a normal Swing action listener logic to call `save.updateWithAction()` when the button it pressed.
Into it we pass the contents of the input field.

Next we create an empty behavior, demanding the `save` resource.
When `save` is updated, we want this behavior to create a list item and update the UI.

### What is an Item?

A typical way to represent a list item is to create a data structure or object with the relevant data.
We can do something similar with a second Extent subclass, `ItemExtent` which we will define in `ItemExtent.java`.

{{< highlight java "hl_lines=11">}}
public class ItemExtent extends Extent<ItemExtent> {
  ListExtent list;
  ItemUI itemUI;
  State<String> itemText;
  
  public ItemExtent(Graph g, String inText, ListExtent inList) {
    super(g);

    list = inList;
    itemUI = new ItemUI();
    itemText = state(inText);

  }
}
{{< / highlight >}}

The starter template contains much of this already.

We define a new `ItemExtent` subclass and pass in some information into its constructor.
1. A required `Graph` instance
2. A pointer to the parent `ListExtent` instance which we will use later
3. The text of the new todo list item which we will store in an `itemText` state resource using the initial value

### Creating an ItemExtent

Now that we have a basic `ItemExtent` defined, we can create one back in our `ListExtent`.

{{< highlight java "hl_lines=4-8">}}
behavior()
    .demands(save)
    .runs(ext -> {
      if (save.justUpdated()) {
        var item = new ItemExtent(graph, save.value(), this);
        addChildLifetime(item);
        item.addToGraph();
      }
    });
{{< / highlight >}}

We check if the `save` button was clicked via `save.justUpdated()`.
If so, we create the new item with the contents of the text field, `save.value()`.
Then we call `.addChildLifetime(item)`.
This lets Behavior Graph know that our `ListExtent` instance will always be around longer than any individual `ItemExtent`.
We will see more on lifetimes later.

Next we call `item.addToGraph()`.
Adding an extent to the graph is a necessary step.
Until we do this, any behaviors or resources in that extent will not perform their expected roles.

### Collecting the Items

We also need a way to keep track of these items as they are added.
First we add a state resource to hold these individual items.

{{< highlight java "hl_lines=4">}}
public class ListExtent extends Extent<ListExtent> {

  TypedMoment<String> save = typedMoment();
  State<ArrayList<ItemExtent>> allItems = state(new ArrayList<>());
{{< / highlight >}}

`allItems` is a state resource initialized with an empty ArrayList.

Next we modify our saving behavior to update this list.

{{< highlight java "hl_lines=2 9 10">}}
    behavior()
        .supplies(allItems)
        .demands(save)
        .runs(ext -> {
          if (save.justUpdated()) {
            var item = new ItemExtent(graph, save.value(), this);
            addChildLifetime(item);
            item.addToGraph();
            allItems.value().add(item);
            allItems.updateForce(allItems.value());
          }
        });
{{< / highlight >}}

We add a `.supplies()` clause which includes `allItems` because we will be updating it inside this behavior.
Whenever we create a new item we will append that `ItemExtent` instance to the end of its ArrayList via its `.value()` property and the built in `.add()` method.
It is typical when working with extents that come and go to store them in a state resource or a collection inside a state resource.

Lastly, we call `.updateForce()` with the same array list instance.
`.updateForce()` says, I don't care if what I'm putting in here is the same as it was before, I still want you to notify any demanding behaviors.

We cannot just call `.update()` because even though the contents of the array list have changed, it is still the same array list instance.
`.update()` automatically filters out updates when the old value `.equals()` the new value.
This is usually what we want, but sometimes we need something different.
`.updateForce()` works identically but ignores this equality check.
This is a common pattern when storing mutable collections inside a resource.

### Updating the UI

Adding an item still doesn't update the UI to match.
Inside our `ItemExtent` we already created an instance `ItemUI` which contains the Swing code for an individual item.

So now we need to tell our list ui object about this new component.

{{< highlight java "hl_lines=4-7">}}
  item.addToGraph();
  allItems.value().add(item);
  allItems.updateForce(allItems.value());
  sideEffect(ext1 -> {
    listUI.addItem(item.itemUI);
    listUI.newItemText.setText("");
  });
{{< / highlight >}}

We create a side effect because we are making external changes.
This side effect calls `.addItem()` which just inserts the item into the correct place in the view heirarchy.
It also clears the text field so we can add additional items.

Run it.
Try adding some items by typing in the box and clicking Save.
It seems to add items but we only see empty text.

We can fix that by using a `getDidAdd()` built in resource.

Inside `ItemExtent.java` we create a new behavior.

{{< highlight java "hl_lines=4-10">}}
    itemUI = new ItemUI();
    itemText = state(inText);

    behavior()
      .demands(itemText, getDidAdd())
      .runs(ext -> {
        sideEffect(ext1 -> {
          itemUI.itemText.setText(itemText.value());
        });
      });
{{< / highlight >}}

Looking at the `demands()` clause we can see this behavior will run when the `ItemExtent` is added to the graph and whenever `itemText` changes.
The side effect tells the UI label to update to the correct text.
Now running our code and adding a few items will show our list correctly.

### Completing Items

There's a checkbox to complete a todo list item.
Checking it at this point does nothing.
Let's fix that.

Inside `ItemExtent` we'll add a new state resource to track if an item is completed.

{{< highlight java "hl_lines=3">}}
  ItemUI itemUI;
  State<String> itemText;
  State<Boolean> completed;

  public ItemExtent(Graph g, String inText, ListExtent inList) {
{{< / highlight >}}

Then inside our constructor

{{< highlight java "hl_lines=3 5-7">}}
    itemUI = new ItemUI();
    itemText = state(inText);
    completed = state(false);
    
    itemUI.completedCheckbox.addItemListener(itemEvent -> {
      completed.updateWithAction(itemEvent.getStateChange() == ItemEvent.SELECTED);
    });
{{< / highlight >}}

We initialize our `completed` state resource which defaults to false.
We also use standard Swing API to connect the checkbox element to an action which will update our state resource.

(Note, you may prefer to design your UI classes with more or less encapsulation.
There are many approaches.
Our goal here is to keep behavior graph related functionality together so it is easier to see.)

And we add an additional behavior inside `ItemExtent`

{{< highlight java "hl_lines=5-11">}}
          itemUI.itemText.setText(itemText.value());
        });
      });

    behavior()
      .demands(completed, getDidAdd())
      .runs(ext -> {
        sideEffect(ext1 -> {
          itemUI.setCompleted(completed.value());
        });
      });
{{< / highlight >}}

This behavior creates a side effect which updates the UI with our completed state.
This uses the Swing API's to strike-through a completed todo item.
We also include `getDidAdd()` as an additional demand.
It is not strictly necessary at this point because all todo items start off as not completed.
However, it is good practice to use it in behaviors that generate side effects to reflect the current state.
If we were to introduce functionality later for saving and restoring todo lists, we may have items that start in a completed state.

Running this and checking/unchecking todo list items should update the UI accordingly.

## Dynamic Behaviors

We will now introduce functionality that takes advantage of Behavior Graph's ability to dynamically adjust demands and supplies.

### Remaining Items

The "Remaining Items" footer of the UI does not update currently.
First we need it to respond when adding items.

Inside `ListExtent` we add a new behavior.

{{< highlight javascript "hl_lines=1-8">}}
    behavior()
        .demands(allItems, getDidAdd())
        .runs(ext -> {
          sideEffect(ext1 -> {
            long count = allItems.value().stream().filter(itemExtent -> !itemExtent.completed.value()).count();
            listUI.setRemainingCount(count);
          });
        });
{{< / highlight >}}

This behavior will create a side effect to update the remaining items text at the bottome to match the current number of non-completed items in the list.
`allItems` is a demand because we want to run it whenever we add a new item to the list.
`getDidAdd()` is also a demand because we want it to run once at the beginning.
Inside the side effect we use some logic to count the items whose `.value` of their `completed` state resource is true.

Now try adding a few items to the list and you will see the remaining items count increment.

### Updating Remaining Items

If you try to complete an item however our remaining items count does not change.
This is because our new behavior does not demand the `completed` resource from our `ItemExtent` instances.
So it won't run when they change.
However, we cannot just add it inside the list of demands because the set of `ItemExtent` instances changes over time.

Behaviors have another clause for handling these situations.

{{< highlight java "hl_lines=3-7">}}
    behavior()
        .demands(allItems, getDidAdd())
        .dynamicDemands(new Demandable[] { allItems }, (ctx, demands) -> {
          for (ItemExtent item : allItems.value()) {
            demands.add(item.completed);
          }
        })
        .runs(ext -> {
          sideEffect(ext1 -> {
            long count = allItems.value().stream().filter(itemExtent -> !itemExtent.completed.value()).count();
            listUI.setRemainingCount(count);
          });
        });
{{< / highlight >}}

`.dynamicDemands()` is another clause when creating a behavior that lets you specify an additional list of demands that can change.
It takes two parameters.
The first is an array of resources (Specifically `Demandable` which is an interface resources implement).
Whenever any of those update, it will run the anonymous function in the second parameter.
That function includes a `demands` ArrayList parameter to which we can add any additional demands this behavior should have.

Here our dynamic demands clause will add the `completed` resource from each `ItemExtent` instance.
So each time we add a new item, our behavior will adapt so that it will run when the `completed` resource for that item updates.

Now try running the code.
You will see that adding new items updates the remaining items count.
And you will see that checking and unchecking the box on those items affects the remaining count as well.

### Remaining Items Revisited

Its worth a little extra effort to consider what we just did.
The _entire_ remaining items feature is defined by this single behavior.

Let's compare this with a status quo implementation: methods, properties, and objects.
First we might have a method similar to our run block to update the UI

```java
// Hypothetical Code -- Don't type this in
void updateRemainingCount() {
  long count = allItems.value().stream().filter(itemExtent -> !itemExtent.completed.value()).count();
  listUI.setRemainingCount(count);
}
```

That seems reasonable, but its not enough.
We need to go inside another method somewhere else in this same class to ensure this gets called when we add a new item.
Perhaps it might look like this:

```java
// Hypothetical Code -- Don't type this in
void saveButtonPressed(text) {
  var save = new Item(text);
  this.allItems.add(save);
  this.updateRemainingCount();
}
```

Ok, so the "Remaining Count" feature is in two places.
That's manageable.
Unfortunately, to handle completing, we still need to call in from another place in the code inside the Item class.

```java
// Hypothetical Code -- Don't type this in
void completeChecked(checked) {
  this.completed = checked;
  this.list.updateRemainingCount();
}
```

Now our feature is spread across multiple classes.
And when we add a way to remove items we will need to involve another code-path.
This type of spread out logic is a real challenge for developers.
It is incredibly easy to miss a case.
Most developers are swimming in control flows like this.

But, as we said above, the Behavior Graph implementation combines the remaining count functionality into a single block of code.
Behavior Graph lets us collect the "what" _and_ the "why" together in the same behavior.

## Deleting Items

We also have a Delete button on each list item which does nothing currently.
We will fix that now.

Inside `ItemExtent` we add some button click handling.

{{< highlight java "hl_lines=4-6">}}
      completed.updateWithAction(itemEvent.getStateChange() == ItemEvent.SELECTED);
    });

    itemUI.itemDelete.addActionListener(actionEvent -> {
      list.removeItem.updateWithAction(this);
    });

    behavior()
      .demands(itemText, getDidAdd())
{{< / highlight >}}

This handles a Swing event and updates the `removeItem` resource on `ListExtent` (which we haven't added yet).
It is common to interact with resources on other extents.
Here we are saying, "this list item is requesting to be removed."

Note that each `ItemExtent`'s Delete button updates the same `list.removeItem` resource.
We are allowed to update resources from multiple actions because only one action will happen during a single event.

Now, inside `ListExtent` we add our `removeItem` resource,

{{< highlight java "hl_lines=2">}}
  State<ArrayList<ItemExtent>> allItems = state(new ArrayList<>());
  TypedMoment<ItemExtent> removeItem = typedMoment();

  public ListExtent(Graph graph, ListUI listUI) {
    super(graph);
{{< / highlight >}}

It is a `TypedMoment` because it models something happening once (a button press) and we want to transmit which `ItemExtent` we want to remove.

And next we will modify the behavior that maintains `allItems`.

{{< highlight java "hl_lines=3 15-23">}}
    behavior()
        .supplies(allItems)
        .demands(save, removeItem)
        .runs(ext -> {
          if (save.justUpdated()) {
            var item = new ItemExtent(graph, save.value(), this);
            addChildLifetime(item);
            item.addToGraph();
            allItems.value().add(item);
            allItems.updateForce(allItems.value());
            sideEffect(ext1 -> {
              listUI.addItem(item.itemUI);
              listUI.newItemText.setText("");
            });
          } else if (removeItem.justUpdated()) {
            var item = removeItem.value();
            item.removeFromGraph();
            allItems.value().remove(item);
            allItems.updateForce(allItems.value());
            sideEffect(ctx1 -> {
              listUI.removeItem(item.itemUI);
            });
          }
        });
{{< / highlight >}}

First we add `removeItem` as an additional demand on our `allItems` behavior.
This causes the behavior to run when a user clicks on a Delete button.

It is common to refer to behaviors by the resources they supply.
This is because a behavior uniquely supplies those resources.
In this case we call this the `allItems` behavior.

We are modifying this behavior because removing an item affects the list in `allItems`.
We could not put this logic in another behavior because a resource can only be supplied by one behavior.
Updating a resource can only happen in the one behavior that supplies it.

Inside the runs block we add a new check for `removeItem.justUpdated()`.
It is a common pattern to iterate through `.justUpdated()` checks of the various demands to determine what happened.

Then we get the `ItemExtent` we want removed and remove it from our `allItems` list.
We need to call `.forceUpdate()` again because we are mutating the same instance of our list.
Also note that we call`.removeFromGraph()` on the removed `ItemExtent`.
Extents should always be removed from the graph if they are no longer needed otherwise their behaviors will continue to run.
Lastly our side effect ensures that the UI updates as well.


### Remaining Items Re-revisited

You may also notice that the remaining items count now goes down if you remove an item that hasn't been completed yet.
We get this for free because we defined the remaining items on the `allItems` list.
If we were just using method calls to implement delete, we very likely would have removed the item from our list directly and then had to remember to call some `updateRemainingCount()` which could have easily been forgotten.

This ability to make changes without introducing additional complexity is a hallmark of programming with Behavior Graph.
Once you've experienced it a few times you will find it difficult to give up.

## Editing

Now we will introduce some editing functionality.
This will cover some additional uses of dynamic behaviors.
We will allow the user to click on a particular todo list item to select it.
While selected, the user can edit the text inside the main text field.

### Selecting

The first step is to use a Swing event to identify when we have selected a particular item.

Inside `ItemExtent` add another handler.

{{< highlight java "hl_lines=5-10">}}
    itemUI.itemDelete.addActionListener(actionEvent -> {
      list.removeItem.updateWithAction(this);
    });

    itemUI.addMouseListener(new MouseAdapter() {
      @Override
      public void mouseClicked(MouseEvent e) {
        list.selectRequest.updateWithAction(ItemExtent.this);
      }
    });
{{< / highlight >}}

`selectRequest` (which is a resource we haven't yet added on our `ListExtent`) updates with the list item that was clicked as its `.value()`. (`ItemExtent.this` let's us point to the outer `this`, not the `MouseAdapter` `this`.)

Inside `ListExtent` we add the related resources and a corresponding behavior.

{{< highlight java "hl_lines=3-4">}}
  State<ArrayList<ItemExtent>> allItems = state(new ArrayList<>());
  TypedMoment<ItemExtent> removeItem = typedMoment();
  TypedMoment<ItemExtent> selectRequest = typedMoment();
  State<ItemExtent> selected = state(null);
{{< / highlight >}}

We have two resrouces. `selectRequest` was the list item we clicked on.
`selected` is the list item that is currently selected.
`null` means we have no selected item.

Next we add a behavior that updates `selected` based on which item we clicked on.

{{< highlight java "hl_lines=4-11">}}
          });
        });

    behavior()
        .supplies(selected)
        .demands(selectRequest)
        .runs(ext -> {
          if (selectRequest.justUpdated()) {
            selected.update(selectRequest.value());
          }
        });
{{< / highlight >}}

Clicking on an item sets our new `selected` resource as the item that was just clicked.
Although we can't tell it is working yet.

### Selected

Now we want our items to visually reflect when they are selected.
We can do this by demanding this resource in a behavior in each item.
Add the following code inside `ItemExtent`.

{{< highlight java "hl_lines=5-12">}}
          itemUI.setCompleted(completed.value());
        });
      });

    behavior()
      .demands(list.selected, getDidAdd())
      .runs(ext -> {
        var selected = list.selected.value() == this;
        sideEffect(ext1 -> {
          itemUI.setSelected(selected);
        });
      });
{{< / highlight >}}

When the `selected` state resource inside `ListExtent` updates, this behavior on every item will run.
They each demand `list.selected`.
Each one will check to see if it is the one selected and we change the UI accordingly.

We want to refer back to the beginning where we called `.addChildLifetime(item)` inside `ListExtent`.

{{< highlight javascript "hl_lines=2">}}
            var item = new ItemExtent(graph, save.value(), this);
            addChildLifetime(item);
            item.addToGraph();
{{< / highlight >}}

This line says that the list will always be around when the item is.
This gives us permission to add `list.selected`, a resource in `ListExtent`, as a demand on the behavior inside each `ItemExtent`.
Behavior Graph ensures that we don't link to resources that may no longer be part of the graph and it uses lifetimes as a way to manage that.

You can now try out this code by clicking on different items.

Notice that we can take a list of many items and click on different ones and watch it switch.
Each time, one of those behaviors calls the Swing UI logic to change the background color.

### Deselect

Its easy enough to introduce deselecting by clicking on the already selected element.

Inside `ListExtent` we modify our `selected` behavior.

{{< highlight java "hl_lines=6-8 10">}}
    behavior()
        .supplies(selected)
        .demands(selectRequest)
        .runs(ext -> {
          if (selectRequest.justUpdated()) {
            if (selected.value() == selectRequest.value()) {
              selected.update(null);
            } else {
              selected.update(selectRequest.value());
            }
          }
        });
{{< / highlight >}}

We check if the currently selected item is the one that was just clicked on and set it to `null` in that case.
This communicates that nothing should be selected.
Try running now and clicking on an item multiple times.

That was too easy.
You don't need to make space for new control flow.
This is because of the way behavior Behavior Graph functionality composes.

### Updating The Text Field

Now we want to introduce editing.
Let's try updating the main text field when we select an item so we can edit it.
Continuing to edit our `selected` behavior in `ListExtent`

{{< highlight java "hl_lines=13-17">}}
    behavior()
        .supplies(selected)
        .demands(selectRequest)
        .runs(ext -> {
          if (selectRequest.justUpdated()) {
            if (selected.value() == selectRequest.value()) {
              selected.update(null);
            } else {
              selected.update(selectRequest.value());
            }
          }

          if (selected.justUpdated()) {
            sideEffect(ext1 -> {
              listUI.setSelected(selected.value());
            });
          }
        });
{{< / highlight >}}

Whenever `selected` updates, we run this new side effect.
It copies over the text of the item into the text field.
It also updates the UI to indicate that we are editing and not adding.
Conversely, when `selected` updates to `null`, it puts our UI state back to an Add mode.

In many reactive libraries, a reactive block of code can only output the new state.
Any downstream effects need to be somewhere else.
With Behavior Graph we can mutate our state and create any related side effects in the same block of code.

Run the program and you will see how selecting an item updates the header to an editing mode.

### Preventing Adding

When we are in editing mode, the save button should cause the text in our item to update.
However right now it will still create a new item.
We want to prevent that from happening when we are in editing mode.

{{< highlight java "hl_lines=5">}}
    behavior()
        .supplies(allItems)
        .demands(save, removeItem)
        .runs(ext -> {
          if (save.justUpdated() && selected.traceValue() == null) {
            var item = new ItemExtent(graph, save.value(), this);
            addChildLifetime(item);
            item.addToGraph();
            allItems.value().add(item);
{{< / highlight >}}

At the time we click the Save button, we want to know if we are in editing mode or not.
We could check `selected.value()` to see if it is null (ie not editing).
However, here we use `selected.traceValue()` instead.
`.traceValue()` is the value of the resource _at the beginning of the graph event_ (the instant the action started).
So if `selected` updates this event, `.traceValue()` will still return what it was before it changed.

This also removes the requirement that we demand `selected` in this behavior.
Here we care if an item is "already selected", not that something was "just selected".
So we don't need it as a demand.
`.traceValue()` of any resource is always accessible by any behavior without demanding (or supplying) it.

The `if` check ignores the `save` click when there's something already selected.

### Making Changes

Now we can add a new behavior inside `ListExtent` that responds to our save and updates the text of the selected item.

{{< highlight java "hl_lines=8-19">}}
          if (selected.justUpdated()) {
            sideEffect(ctx1 -> {
              listUI.setSelected(selected.value());
            });
          }
        });

    behavior()
        .dynamicSupplies(new Demandable[] { allItems }, (ctx, supplies) -> {
          for (ItemExtent item : allItems.value()) {
            supplies.add(item.itemText);
          }
        })
        .demands(save)
        .runs(ctx -> {
          if (save.justUpdated() && selected.traceValue() != null) {
            selected.traceValue().itemText.update(save.value());
          }
        });
{{< / highlight >}}

This new behavior uses `.dyanmicSupplies()`.
This is a clause we haven't seen before.
It works similarly to `.dynamicDemands()`.
In this behavior, we update our supplies to be the `itemText` resource from each `ItemExtent` instance.
Whenever we add our remove an item, this behavior will adjust to include or remove the corresponding `itemText` state resource.

We will supply all of them because any one of them might become selected.
When the user clicks the Save button, this behavior will update the `itemText` on the selected item to whats inside the text field.

Notice that we use `selected.traceValue()` again here, so it is not part of the demands.
We want which item was selected at the time `save` was updated (as opposed to after we're done saving).
We also do not need this behavior to run when `selected` updates.

Notice that all we do is update `itemText`.
We already have a behavior that knows how to change that UI when we change the text.
It is common to make these kinds of changes and see everything work as expected.

Run the code and you will see your working todo list.

## Challenge

After saving our changes, the item remains selected.
It might be a better user experience to exit editing mode after saving.
Can you implement this?

Try your best before looking at the answer.

Hints:
1. You can do this by modifying a single behavior.
2. Which behavior is responsible for `selected`?
3. Which resource updates when we click the Save button?

### Answer: Clearing Post Save

We can modify our `selected` behavior inside `ListExtent`.

{{< highlight java "hl_lines=3 11-13">}}
    behavior()
        .supplies(selected)
        .demands(selectRequest, save)
        .runs(ctx -> {
          if (selectRequest.justUpdated()) {
            if (selected.value() == selectRequest.value()) {
              selected.update(null);
            } else {
              selected.update(selectRequest.value());
            }
          } else if (save.justUpdated()) {
            selected.update(null);
          }

          if (selected.justUpdated()) {
            sideEffect(ctx1 -> {
{{< / highlight >}}

Now our `selected` behavior also runs and deselects the current item when the Save button is pressed.
Here see again the common pattern of checking various resources' `.justUpdated()` inside a behavior.

Just before adding this feature we used `selected.traceValue` in a few behaviors.
This change here is an additional motivation for that.
If we used `selected.value` in those behaviors it means they would demand `selected` which is supplied by this behavior.
Which means they would run _after_ this behavior.
Which means by they time they ran, `selected.value` would be null.
We don't want what `selected` changes to, we want what it was at the start.
This is what `traceValue` provides.

## Congratulations

Congratulations! You have completed the third tutorial.
You can see the [finished tutorial code here](https://replit.com/@slevin1/Behavior-Graph-JVM-Tutorial-3#Completed/ListExtent.java_completed).
