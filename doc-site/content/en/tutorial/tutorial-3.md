---
title: "Tutorial 3 - A Dynamic Graph"
---

In this tutorial we will create a simple todo list.

![Todo List](/images/todolist.png)

A todo list is interesting because it has user interface elements with independent lifetimes.
When we start, our list is empty.
The visible interface elements are the header for adding new items and a footer for the remaining items.
After we add an item, we now see that item, a checkbox for completing it, and a button for deleting it.
There is a changing collection of those items that can come and go.

We will implement this by adding and removing Extents from the graph as we add and remove items from our list.
This is a powerful and practical technique that gives Behavior Graph a unique expressiveness in the state management realm.

## Initial Code

We have created a starter project using [JSFiddle](https://jsfiddle.net/slevin11/kuw2h1no/4).
You should use that for this tutorial.
It has some simple HTML/CSS to represent the Todo List's user interface.

We first want to set up the initial structure.

{{< highlight javascript "hl_lines=">}}
import * as bg from "https://cdn.skypack.dev/behavior-graph@beta";

class ListExtent extends bg.Extent {
  constructor(graph) {
    super(graph);

  }
}

let graph = new bg.Graph();
let list = new ListExtent(graph);
list.addToGraphWithAction();
{{< / highlight >}}

## Adding Items

We first want to handle adding an item.

{{< highlight javascript "hl_lines=5-16">}}
class ListExtent extends bg.Extent {
  constructor(graph) {
    super(graph);

    this.save = this.moment();
    document.querySelector('#add-new-item').addEventListener('click', () => {
      this.save.updateWithAction(document.querySelector('#new-item-text').value);
    });

    this.behavior()
      .demands(this.save)
      .runs(() => {
      	// do adding here
      });
{{< / highlight >}}

We create a `save` moment to model the interaction of clicking on the __Save__ button after typing in a new todo.
We use a normal DOM event to call `save.updateWithAction()` when the button it pressed.

Unlike in previous tutorials, with this moment resource we are passing our update method a parameter which contains the value of the text field.
Moments often cary information along with them, in this case we would like to know the contents of the text field at the time the button was pressed.

Next we create an empty behavior, demanding the `save` resource.
When the `save` is updated, this behavior will create a list item and update the UI.

### What is an Item?

A typical way to represent a list item might be to create a data structure or object with the relevant data.
We can do something similar with an Extent subclass.

{{< highlight javascript "hl_lines=4-10">}}
  }
}

class ItemExtent extends bg.Extent {
  constructor(graph, text, list) {
    super(graph);
    this.list = list;
    this.itemText = this.state(text);
  }
}

let graph = new bg.Graph();
let list = new ListExtent(graph);
list.addToGraphWithAction();
{{< / highlight >}}

We add a new `ItemExtent` subclass and pass in some information into its constructor.
1. A required `Graph` instance.
2. The test of the new todo list item which we store in an `itemText` state resource.
3. A pointer to the parent `ListExtent` instance which we will use later.

### Creating an ItemExtent

Back in our `ListExtent` inside our behavior we can create an ItemExtent and add it to the graph.

{{< highlight javascript "hl_lines=5-6">}}
    this.behavior()
      .demands(this.save)
      .runs(() => {
        if (this.save.justUpdated) {
          let item = new ItemExtent(this.graph, this.save.value, this);
          item.addToGraph();
        }
      });
{{< / highlight >}}

Adding an extent to the graph is a necessary step.
Until we do this, any behaviors or resources in that extent will not perform their expected roles.

### Collecting the Items

We also need a way to reference these items as they are added.

{{< highlight javascript "hl_lines=1 4 10-11">}}
    this.allItems = this.state([]);

    this.behavior()
      .supplies(this.allItems)
      .demands(this.save)
      .runs(() => {
        if (this.save.justUpdated) {
          let item = new ItemExtent(this.graph, this.save.value, this);
          item.addToGraph();
          this.allItems.value.push(item);
          this.allItems.updateForce(ext.allItems.value);
        }
      });
{{< / highlight >}}

`allItems` is a state resource initialized with an empty array.
We supply it because we will be updating it inside this behavior.
Whenever we create a new item we will append that `ItemExtent` instance to the end of that array via it's `.value` property and the built in `Array.push()` method.
It is typical when working with dynamic extents to store them in a state resource or a collection inside a state resource.

Lastly, just changing the contents of a collection is not equivalent to calling `.update()` on the owning resource.
We must update the resource so any demanding behaviors will be notified.
To do this we update the resource with its own contents.
We do this with `.updateForce()`.
We cannot just call `.update()` because the contents are still the same array.
`.update()` automatically filters out updates when the old value `===` the new value.
`.updateForce()` works identically but ignores this check.

### Updating the UI

Adding an item still doesn't update the UI to match.
Inside our `ItemExtent` we add some code to create a DOM node.

{{< highlight javascript "hl_lines=6">}}
class ItemExtent extends bg.Extent {
  constructor(graph, text, list) {
    super(graph);
    this.list = list;
    this.itemText = this.state(text);
    this.itemElement = document.querySelector('#templates .list-item').cloneNode(true);
  }
}
{{< / highlight >}}

This is a normal property that points to a DOM element we create by cloning some template content inside the existing HTML document.
Then inside our `ListExtent` behavior we can add our list item UI.

{{< highlight javascript "hl_lines=7-10">}}
      .runs(() => {
        if (this.save.justUpdated) {
          let item = new ItemExtent(this.graph, this.save.value, this);
          item.addToGraph();
          this.allItems.value.push(item);
          this.allItems.updateForce(ext.allItems.value);
          this.sideEffect(() => {
            document.querySelector('#list').appendChild(item.itemElement);
            document.querySelector('#new-item-text').value = '';
          });
        }
{{< / highlight >}}

This side effect adds the DOM element that our new `ListExtent` instance points to.
It also clears the text field so we can add additional items.

Try adding some items by typing in the box and clicking __Save__.
It seems to add items but we just see empty text.
We can fix that by using our `addedToGraph` built in resource.

Inside `ItemExtent` add another behavior.

{{< highlight javascript "hl_lines=4-10">}}
    this.itemText = this.state(text);
    this.itemElement = document.querySelector('#templates .list-item').cloneNode(true);

    this.behavior()
      .demands(this.addedToGraph)
      .runs(() => {
        this.sideEffect(() => {
          this.itemElement.querySelector('.item-text').innerText = this.itemText.value;
        });
      });
{{< / highlight >}}

Now running our code and adding a few items will show our list correctly.

### Completing Items

There's a checkbox to complete a todo list item.
Checking it at this point does nothing.

Inside `ItemExtent`

{{< highlight javascript "hl_lines=4-7">}}
    this.list = list;
    this.itemText = this.state(text);
    this.itemElement = document.querySelector('#templates .list-item').cloneNode(true);
    this.completed = this.state(false);
    this.itemElement.querySelector('.completed-checkbox').addEventListener('change', () => {
      this.completed.updateWithAction(!this.completed.value);
    });
{{< / highlight >}}

We add a new `completed` state resource that defaults to false.
We also add a DOM event for when a checkbox is checked so we can update `completed`.

And we add an additional behavior inside `ItemExtent`

{{< highlight javascript "hl_lines=1-12">}}
    this.behavior()
      .demands(this.completed, this.addedToGraph)
      .runs(() => {
        this.sideEffect(() => {
          let completedClass = 'completed';
          if (this.completed.value) {
            this.itemElement.classList.add(completedClass);
          } else {
            this.itemElement.classList.remove(completedClass);
          }
        });
      });
{{< / highlight >}}

This behavior creates a side effect which adds a "completed" class to our HTML item.
This uses the existing CSS to strikethrough a completed todo item.
We also include `addedToGraph` as an additional demand.
It is not strictly necessary at this point because all todo items start off as not completed.
However, it is good practice to use it in behaviors that generate side effects to reflect the current state.
If we were to introduce functionality later for saving and restoring todo lists we may have items that start in a completed state.

Running this and checking/unchecking todo list items should update the UI accordingly.

## Dynamic Behaviors

We will now introduce functionality that takes advantage of Behavior Graph's ability to dynamically adjust its demands.

### Remaining Items

The "Remaining Items" footer of the UI does not update currently.
First we need it to respond when adding items.

Inside `ListExtent` we add a new behavior.

{{< highlight javascript "hl_lines=1-8">}}
    this.behavior()
      .demands(this.allItems, this.added)
      .runs(() => {
        this.sideEffect(() => {
          let count = this.allItems.value.filter(item => !item.completed.value).length;
          document.querySelector('#remaining-count').textContent = count;
        });
      });
{{< / highlight >}}

This behavior will create a side effect to update the remaining items text to match the current number of non-completed items in the list.
`allItems` is a demand because we want to run it whenever we add a new item to the list.
`allItems` updates whenever that happens.
Inside the side effect we are able to iterate over the array of `ItemExtent` instances to check the `.value` of their `completed` state resource.
`addedToGraph` ensures we have the correct starting value in there since it starts out empty.

Now try adding a few items to the list and you will see the remaining items count increment.

### Updating Remaining Items

If you try to complete an item however our remaining items count does not change.
This is because that new behavior does not demand the `completed` resource from our `ItemExtent` instances.
However, we cannot just add it inside the list of demands because the set of `ItemExtent` instances changes over time.

Behaviors have another clause for handling these situations.

{{< highlight javascript "hl_lines=3-5">}}
    this.behavior()
      .demands(this.allItems, this.added)
      .dynamicDemands([this.allItems], () => {
        return this.allItems.value.map(item => item.completed);
      })
      .runs(() => {
        this.sideEffect(() => {
          let count = this.allItems.value.filter(item => !item.completed.value).length;
          document.querySelector('#remaining-count').textContent = count;
        });
      });
{{< / highlight >}}

`.dynamicDemands()` is another clause when creating a behavior that lets you specify an additional list of dyanmic demands.
It takes two parameters.
The first is an array of resources.
Whenever any of those updates it will run the anonymous function in the second parameter.
That function returns a list of additional demands this behavior should have.

Here our dynamic demands clause will return an array containing the `completed` resource from each `ItemExtent` instance inside `allItems`.
So each time we add a new item our behavior will also run when `completed` for that item updates.

Now try running the code.
You will see that adding new items updates the remaining items count.
And you will see that checking and unchecking the box on those items affects the remaning count as well.

### Remaining Items Revisited

Its worth a little extra effort to consider what we just did.
The _entire_ remaining items feature is defined by this single behavior.

Let's compare this with a status quo implementation: methods, properties, and objects.
First we might have a method similar to our run block to update the UI

```
updateRemainingCount() {
  let count = this.allItems.filter(item => !item.completed).length;
  document.querySelector('#remaining-count').textContent = count;
}
```

That seems reasonable, but its not enough.
We need to go inside another method somewhere else in this same class to ensure this gets called when we add a new item.
Perhaps it might look like this:

```
saveButtonPressed(text) {
  let save = new Item(text);
  this.allItems.push(save);
  this.updateRemainingCount();
}
```

Our "add item" code needs to be involved in order to make this feature work.
Even worse we also need to loop in some code from the Item object.

```
completeChecked(checked) {
  this.completed = checked;
  this.updateRemainingCount();
}
```

Now our feature is spread across multiple classes.
And when we add a way to remove items we will need to involve another codepath.
And this todo list is actually a very simple program.
Production software is significantly more complex!
When developing Behavior Graph we take a different perspective.
You focus on one small unit of functionality at a time, figure out what information it needs and write a behavior.
Your development process becomes incrementally adding behaviors and linking them together.

## Deleting Items

We also have a __Delete__ button on each list item which does nothing.
We will change that now.

Inside `ItemExtent` we will add some button click handling.

{{< highlight javascript "hl_lines=6-8">}}
    this.itemElement = document.querySelector('#templates .list-item').cloneNode(true);
    this.completed = this.state(false);
    this.itemElement.querySelector('.completed-checkbox').addEventListener('change', () => {
      this.completed.updateWithAction(!this.completed.value);
    });
    this.itemElement.querySelector('.item-delete').addEventListener('click', () => {
      this.list.removeItem.updateWithAction(this);
    });
{{< / highlight >}}

This takes a DOM event and updates the `removeItem` resource on `ListExtent` (which we haven't added yet).
It is common to interact with resources on other extents and a source of conceptual power.
Here we are conceptually saying, "This list item is requesting to be removed."

Inside `ListExtent`,

{{< highlight javascript "hl_lines=2 6 17-24">}}
    this.allItems = this.state([]);
    this.removeItem = this.moment();

    this.behavior()
      .supplies(this.allItems)
      .demands(this.save, this.removeItem)
      .runs(() => {
        if (this.save.justUpdated) {
          let item = new ItemExtent(this.graph, this.save.value, this);
          item.addToGraph();
          this.allItems.value.push(item);
          this.allItems.updateForce(this.allItems.value);
          this.sideEffect(() => {
            document.querySelector('#list').appendChild(item.itemElement);
            document.querySelector('#new-item-text').value = '';
          });
        } else if (this.removeItem.justUpdated) {
          let item = this.removeItem.value;
          item.removeFromGraph();
          this.allItems.update(this.allItems.value.filter(listItem => listItem !== item));
          this.sideEffect(() => {
            document.querySelector('#list').removeChild(item.itemElement);
          });
        }
      });
{{< / highlight >}}

These changes make up the remove item feature.
`removeItem` is a moment resource that models the concept of "a request to be removed happened".
Then we add `removeItem` as an additional demand in our `allItems` behavior.
This causes the behavior to run when a user clicks on a Delete button.

It is common to refer to behaviors by what resource they supply.
This is because a behvior uniquely supplies those resources.
In this case we call this the `allItems` behavior.

We are modifying this behavior because removing an item affects the list in `allItems`.
Updating a resource can only happen in the one behavior that supplies it.
Additionally a resource can be updated in any number of actions as long as it is not supplied by any behavior.
These two rules give us safe mutable state.

Inside the runs block we add an if check for `removeItem.justUpdated`.
It is a common pattern to iterate through `.justUpdated` checks of the various demands to determine what happened.
In this case we remove the item from the list by building a new list without the item to remove.
So we do not have to call `.forceUpdate()` like before.
Our side effect ensures that the UI updates as well.

Also note that we call`.removeFromGraph()` on the removed `ItemExtent`.
Extents should always be removed from the graph if they are no longer needed otherwise their behaviors will continue to run.

### Remaining Items Re-revisited

You may also notice that the remaining items count now goes down if you remove an item that hasn't been completed yet.
We get this for free because we defined the remaining items on the `allItems` list.
If we were just using method calls to implement delete, we very likely would have removed the item from our list directly and then had to remember to call `updateRemainingCount()` which could easily be forgotten.

This effortless composition is a hallmark of programming with Behavior Graph.
Once you've experienced it a few times you will find it difficult to go back.

## Editing

Now we will introduce some editing functionality.
This will cover some additional uses of dynamic behaviors.
We will allow the user to click on a particular todo list item to select it.
While selected, the user can edit the text inside the main text field.

### Selecting

The first step is to use a DOM event to identify when we have selected a particular item.

Inside `ItemExtent` add another handler.

{{< highlight javascript "hl_lines=4-6">}}
    this.itemElement.querySelector('.item-delete').addEventListener('click', () => {
      this.list.removeItem.updateWithAction(this);
    });
    this.itemElement.querySelector('.item-text').addEventListener('click', () => {
    	this.list.selectRequest.updateWithAction(this);
    });
{{< / highlight >}}

And inside `ListExtent` we add the related resources and a corresponding behavior.

{{< highlight javascript "hl_lines=3-4">}}
    this.allItems = this.state([]);
    this.removeItem = this.moment();
    this.selectRequest = this.moment();
    this.selected = this.state(null);
{{< / highlight >}}

{{< highlight javascript "hl_lines=1-5">}}
    this.behavior()
      .supplies(this.selected)
      .demands(this.selectRequest)
      .runs(() => {
      	this.selected = this.selectRequest.value;
      });
{{< / highlight >}}

### Selected

Now our items should visually reflect if it is selected.
We can do this by demanding this resource in a behavior in each `ItemExtent`.

{{< highlight javascript "hl_lines=1-13">}}
	this.behavior()
      .demands(this.list.selected)
      .runs(() => {
      	let selected = this.list.selected.value === this;
        this.sideEffect(() => {
          let selectedClass = 'selected'
          if (selected) {
          	this.itemElement.classList.add(selectedClass);
          } else {
            this.itemElement.classList.remove(selectedClass);
          }
        });
      });
{{< / highlight >}}

This behavior works similarly to the behavior that updates our UI when we are completed.
When the `selected` state resource inside `ListExtent` updates, we will change the UI of this item.

You can try it out.
Also notice that we can take a list of many items and click on different ones and see it switch.
Behaviors in the `ItemExtent` can effortlessly listen to updates on the same resource in the `ListExtent`.
There's no need to iterate through each one to ensure they all respond to the change.

### Deselect

Its easy enough to introduce deselecting by clicking on the already selected element.

Inside `ListExtent` we modify our selected behavior.

{{< highlight javascript "hl_lines=5-7 9">}}
    this.behavior()
      .supplies(this.selected)
      .demands(this.selectRequest)
      .runs(() => {
      	if (this.selected.value == this.selectRequest.value) {
          this.selected.update(null);
        } else {
        	this.selected.update(this.selectRequest.value);      
        }
      });
{{< / highlight >}}

Updating `selected` to null communicates that nothing should be selected.
Try running now and clicking on an item multiple times.

### Updating The Text Field

Let's try updating the text field when we select an item so we can track when it changes.

{{< highlight javascript "hl_lines=10-18">}}
    this.behavior()
      .supplies(this.selected)
      .demands(this.selectRequest)
      .runs(() => {
      	if (this.selected.value == this.selectRequest.value) {
          this.selected.update(null);
        } else {
        	this.selected.update(this.selectRequest.value);      
        }
        
        if (this.selected.justUpdated) {
          this.sideEffect(() => {
            let textField = document.querySelector('#new-item-text');
            textField.value = this.selected.value === null ? '' : this.selected.value.itemText.value;
            let actionText = document.querySelector('#action');
            actionText.innerText = this.selected.value === null ? 'Add' : 'Edit'
          });
        }
      });
{{< / highlight >}}

Whenever `selected` updates, we run this new side effect.
It copies over the text of the item into the text field.
And it also indicates that we are editing and not adding.
It also puts our state back when we deselect something.

### Preventing Adding New

When we are in editing mode, the save button should cause the text in our item to update.
However right now it will still create a new item.
We can first prevent that from happening when we are in editing mode.

{{< highlight javascript "hl_lines=3 5">}}
    this.behavior()
      .supplies(this.allItems)
      .demands(this.save, this.removeItem)
      .runs(() => {
        if (this.save.justUpdated && this.selected.traceValue === null) {
          let item = new ItemExtent(this.graph, this.save.value, this);
          item.addToGraph();
          this.allItems.value.push(item);
{{< / highlight >}}

At the time we click the __Save__ button which updates `save` we want to know if we are in editing mode or not.
So we want to check `selected.value` to see if it is null (ie not editing).
Here however we use `selected.traceValue` instead.
`.traceValue` is the value of the resource at the beginning of the graph event (the moment the action started).
So if `selected` updates, `.traceValue` will still return what it was before it changed.
This lets us get a value from `selected` without adding it as a demand.

In this behavior we only care if anything is selected or not, not that something was "just selected".
So we don't need it as a demand.
Then we filter out the `save` click when there's something selected inside our if check.

### Making Changes

Now we can add a new behavior inside `ListExtent` that responds to our save and updates the correct item.

{{< highlight javascript "hl_lines=4-14">}}
        }
      });
      
    this.behavior()
      .dynamicSupplies([this.allItems], () => {
        return this.allItems.value.map(item => item.itemText);
      })
      .demands(this.save)
      .runs(() => {
      	if (this.save.justUpdated && this.selected.traceValue !== null) {
          this.selected.traceValue.itemText.update(this.save.value);
        }
      });
      
    this.behavior()
      .demands(this.allItems, this.addedToGraph)
{{< / highlight >}}

This new behavior uses `.dyanmicSupplies()`.
This is a clause we haven't seen before but it does work similarly to `.dynamicDemands()`.
In this behavior, we update our supplies to be the `itemText` resource from each of the `ItemExtent` instances in `allItems`.
Whenever we add our remove an item, this behavior will update its supplies.

We will supply all of them because any one of them could be selected.
Then when the user clicks the __Save__ button `save` resource will update.
This behavior will then update the correct `itemText` on the selected item.

Notice that we use `selected.traceValue` again here.
We just need which item was selected at the time `save` was updated.
And we don't need this behavior to run when `selected` updates.

Also notice that all we do is update `itemText`.
We already have a behavior that knows how to change that UI when we change the text.
It is common to make these kinds of changes and see everything work as expected.

## Challenge

After saving our changes, the item remains selected.
It might be a better user experience to exit editing mode after saving.
Can you implement this?

Try your best before looking at the answer.

Hints:
1. You can do this by modifying a single behavior.
2. Which behavior is responsible for `selected`.
3. Which resource updates when we click the __Save__ button?

### Answer: Clearing Post Save

We can modify our `selected` behavior inside `ListExtent`.

{{< highlight javascript "hl_lines=3 5 11-13">}}
    this.behavior()
      .supplies(this.selected)
      .demands(this.selectRequest, this.save)
      .runs(() => {
      	if (this.selectRequest.justUpdated) {
      	  if (this.selected.value == this.selectRequest.value) {
            this.selected.update(null);
          } else {
          	this.selected.update(this.selectRequest.value);      
          }        
        } else if (this.save.justUpdated) {
          this.selected.update(null);
        }
{{< / highlight >}}

Now our `selected` behavior also runs and deselects the current item when the __Save__ button is pressed.
Here see again we follow a pattern of checking various resources' `.justUpdated` property.

Just before adding this feature we used `selected.traceValue` in a few behaviors.
Here we see an additional reason.
If we demanded `selected` in those behaviors it means they would depend on this behavior here.
Which means they would run _after_ this behavior.
Which means by they time they ran, `selected.value` would be null.
We don't want what `selected` changes to, we want what it was at the start.
This is what `traceValue` provides.
