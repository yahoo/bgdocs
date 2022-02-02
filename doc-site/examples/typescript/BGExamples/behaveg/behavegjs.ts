import { BufferedPriorityQueue } from "./bufferedqueue";
import { Behavior } from "./behavior";
import { Extent } from "./extent";
import { Resource } from "./resource";

export enum OrderingState {
    Unordered,
    Ordering,
    Ordered
}

export enum ValuePersistence {
    Persistent,
    Transient,
    TransientTrace
}

interface SideEffect {
    debugName: string | null;
    block: (extent: Extent) => void;
    extent: Extent;
}

interface Action {
    impulse: string | null;
    block: () => void;
}

export interface BehaviorGraphDateProvider {
    now() : Date
}

const DefaultDateProvider = {
    now: () => { return new Date(); }
}

export class Graph {
    dateProvider: BehaviorGraphDateProvider;
    currentEvent: GraphEvent | null = null;
    lastEvent: GraphEvent;
    activatedBehaviors: BufferedPriorityQueue<Behavior> = new BufferedPriorityQueue();
    currentBehavior: Behavior | null = null;
    effects: SideEffect[] = [];
    actions: Action[] = [];
    untrackedBehaviors: Behavior[] = [];
    modifiedDemandBehaviors: Behavior[] = [];
    modifiedSupplyBehaviors: Behavior[] = [];
    updatedTransients: Transient[] = [];
    needsOrdering: Behavior[] = [];

    constructor(timeProvider = DefaultDateProvider) {
        this.lastEvent = InitialEvent;
        this.dateProvider = timeProvider;
    }

    actionAsync(impulse: string, block: () => void) {
        this.actions.push({impulse: impulse, block: block});
        if (this.currentEvent == null) {
            this.eventLoop();
        }
    }

    action(impulse: string, block: () => void) {
        this.actions.push({impulse: impulse, block: block});
        this.eventLoop();
    }

    eventLoop() {

        while(true) {

            try {
                if (this.activatedBehaviors.length > 0 ||
                    this.untrackedBehaviors.length > 0 ||
                    this.modifiedDemandBehaviors.length > 0 ||
                    this.modifiedSupplyBehaviors.length > 0 ||
                    this.needsOrdering.length > 0) {

                    let sequence = this.currentEvent!.sequence;
                    this.addUntrackedBehaviors(sequence);
                    this.addUntrackedSupplies(sequence);
                    this.addUntrackedDemands(sequence);
                    this.orderBehaviors();
                    this.runNextBehavior(sequence);

                    continue;
                }

                let effect = this.effects.shift();
                if (effect) {
                    effect.block(effect.extent);
                    continue;
                }

                if (this.currentEvent) {
                    this.clearTransients();
                    this.lastEvent = this.currentEvent!;
                    this.currentEvent = null;
                    this.currentBehavior = null;
                }

                let action = this.actions.shift();
                if (action) {
                    let newEvent = new GraphEvent(this.lastEvent.sequence + 1, this.dateProvider.now(), action.impulse);
                    this.currentEvent = newEvent;
                    action.block();
                    continue;
                }

            } catch (error) {
                this.currentEvent = null;
                this.actions.length = 0;
                this.effects.length = 0;
                this.currentBehavior = null;
                this.activatedBehaviors.clear();
                this.clearTransients();
                this.modifiedDemandBehaviors.length = 0;
                this.modifiedSupplyBehaviors.length = 0;
                this.untrackedBehaviors.length = 0;
                throw(error);
            }
            // no more tasks so we can exit the event loop
            break;
        }
    }

    clearTransients() {
        if (this.updatedTransients.length > 0) {
            for (let transient of this.updatedTransients) {
                transient.clear();
            }
            this.updatedTransients.length = 0;
        }
    }
    trackTransient(resource: Transient) {
        this.updatedTransients.push(resource);
    }

    resourceTouched(resource: Resource) {
        if (this.currentEvent != null) {
            for (let subsequent of resource.subsequents) {
                this.activateBehavior(subsequent, this.currentEvent.sequence);
            }
        }
    }

    activateBehavior(behavior: Behavior, sequence: number) {
        if (behavior.enqueuedWhen == null || behavior.enqueuedWhen < sequence) {
            behavior.enqueuedWhen = sequence;
            this.activatedBehaviors.push(behavior);
        }
    }

    runNextBehavior(sequence: number) {
        // need to sort the behaviors
        // but a buffered heap would be nicer

        let behavior = this.activatedBehaviors.pop();
        if (behavior != undefined && behavior.removedWhen != sequence) {
            this.currentBehavior = behavior;
            behavior.block(behavior.extent);
            this.currentBehavior = null;
        }
    }

    sideEffect(extent: Extent, name: string | null, block: (extent: Extent) => void) {
        if (this.currentEvent == null) {
            let err: any = new Error("Effects can only be added during an event loop.");
            throw err;
        } else {
            this.effects.push({ debugName: name, block: block, extent: extent });
        }
    }

    addUntrackedBehaviors(sequence: number) {
        if (this.untrackedBehaviors.length > 0) {
            for (let behavior of this.untrackedBehaviors) {
                this.activateBehavior(behavior, sequence);
                this.modifiedDemandBehaviors.push(behavior);
                this.modifiedSupplyBehaviors.push(behavior);
            }
            this.untrackedBehaviors = [];
        }
    }

    addUntrackedSupplies(sequence: number) {
        if (this.modifiedSupplyBehaviors.length > 0) {
            for (let behavior of this.modifiedSupplyBehaviors) {
                if (behavior.untrackedSupplies != null) {
                    if (behavior.supplies != null) {
                        for (let existingSupply of behavior.supplies) {
                            existingSupply.suppliedBy = null;
                        }
                    }
                    behavior.supplies = new Set(behavior.untrackedSupplies);
                    for (let newSupply of behavior.supplies) {
                        if (newSupply.suppliedBy != null && newSupply.suppliedBy != behavior) {
                            let err: any = new Error("Resource cannot be supplied by more than one behavior.");
                            err.alreadySupplied = newSupply;
                            err.desiredSupplier = behavior;
                            throw err;
                        }
                        newSupply.suppliedBy = behavior;
                    }
                    behavior.untrackedSupplies = null;
                    // technically this doesn't need reordering but its subsequents will
                    // setting this to reorder will also adjust its subsequents if necessary
                    // in the sortDFS code
                    this.needsOrdering.push(behavior);
                }
            }
            this.modifiedSupplyBehaviors.length = 0;
        }
    }

    addUntrackedDemands(sequence: number) {
        if (this.modifiedDemandBehaviors.length > 0) {
            for (let behavior of this.modifiedDemandBehaviors) {
                if (behavior.untrackedDemands != null) {

                    let removedDemands: Resource[] | undefined;
                    if (behavior.demands != null) {
                        for (let demand of behavior.demands) {
                            if (!behavior.untrackedDemands.includes(demand)) {
                                if (removedDemands == undefined) {
                                    removedDemands = [];
                                }
                                removedDemands.push(demand);
                            }
                        }
                    }

                    let addedDemands: Resource[] | undefined;
                    for (let untrackedDemand of behavior.untrackedDemands) {
                        if (!untrackedDemand.added) {
                            let err: any = new Error("All demands must be added to the graph.");
                            err.currentBehavior = behavior;
                            err.untrackedDemand = untrackedDemand;
                            throw err;
                        }
                        if (behavior.demands == null || !behavior.demands.has(untrackedDemand)) {
                            if (addedDemands == undefined) {
                                addedDemands = [];
                            }
                            addedDemands.push(untrackedDemand);
                        }
                    }

                    let needsRunning = false;

                    if (removedDemands != undefined) {
                        needsRunning = true;
                        for (let demand of removedDemands) {
                            demand.subsequents.delete(behavior);
                        }
                    }

                    let orderBehavior = behavior.orderingState == OrderingState.Unordered;

                    if (addedDemands != undefined) {
                        needsRunning = true;
                        for (let demand of addedDemands) {
                            demand.subsequents.add(behavior);

                            if (!orderBehavior) {
                                let prior = demand.suppliedBy;
                                if (prior != null && prior.orderingState == OrderingState.Ordered && prior.order >= behavior.order) {
                                    orderBehavior = true;
                                }
                            }
                        }
                    }

                    behavior.demands = new Set(behavior.untrackedDemands);
                    behavior.untrackedDemands = null;

                    if (orderBehavior) {
                        this.needsOrdering.push(behavior);
                    }
                    if (needsRunning) {
                        this.activateBehavior(behavior, sequence);
                    }
                }


            }
            this.modifiedDemandBehaviors.length = 0;
        }
    }

    orderBehaviors() {
        // find all behaviors that need ordering and their
        // subsequents and mark them all as needing ordering

        if (this.needsOrdering.length == 0) { return; }

        let localNeedsOrdering : Behavior[] = [];
        let traversalQueue: Behavior[] = [];

        // first get behaviors that need ordering and mark them as
        // ordered so they will be traversed when first encountered
        for (let behavior of this.needsOrdering) {
            behavior.orderingState = OrderingState.Ordered;
            traversalQueue.push(behavior);
        }
        this.needsOrdering.length = 0;

        // dfs forward on each to find all that need ordering
        while (traversalQueue.length > 0) {
            let behavior = traversalQueue.shift();
            if (behavior != undefined) {
                if (behavior.orderingState == OrderingState.Ordered) {
                    behavior.orderingState = OrderingState.Unordered;
                    localNeedsOrdering.push(behavior);
                    if (behavior.supplies) {
                        for (let supply of behavior.supplies) {
                            for (let subsequent of supply.subsequents) {
                                traversalQueue.push(subsequent);
                            }
                        }
                    }
                }
            }
        }

        let needsReheap = { value: false }; // this allows out parameter
        for (let behavior of localNeedsOrdering) {
            this.sortDFS(behavior, needsReheap);
        }

        if (needsReheap.value) {
            this.activatedBehaviors.unsort()
        }
    }

    sortDFS(behavior: Behavior, needsReheap: { value: boolean }) {
        if (behavior.orderingState == OrderingState.Ordering) {
            let err: any = new Error("Behavior dependency cycle detected.");
            err.currentBehavior = behavior;
            err.cycle = this.cycleForBehavior(behavior);
            throw err;
        }

        if (behavior.orderingState == OrderingState.Unordered) {
            behavior.orderingState = OrderingState.Ordering;

            let order = 0;
            if (behavior.demands != null) {
                for (let demand of behavior.demands) {
                    let prior = demand.suppliedBy;
                    if (prior != null) {
                        if (prior.orderingState != OrderingState.Ordered) {
                            this.sortDFS(prior, needsReheap);
                        }
                        order = Math.max(order, prior.order + 1);
                    }
                }
            }

            behavior.orderingState = OrderingState.Ordered;

            if (order != behavior.order) {
                behavior.order = order;
                needsReheap.value = true;
            }
        }
    }

    cycleForBehavior(behavior: Behavior): Resource[] {
        let stack: Resource[] = [];
        if (this.cycleDFS(behavior, behavior, stack)) {
            let output: Resource[] = [];
            while (stack.length > 0) {
                let rez = stack.pop();
                output.push(rez!);
            }
            return output;
        } else {
            return [];
        }
    }

    cycleDFS(currentBehavior: Behavior, target: Behavior, stack: Resource[]): boolean {
        if (currentBehavior.demands != null) {
            for (let r of currentBehavior.demands) {
                stack.push(r)
                let b = r.suppliedBy;
                if (b != null) {
                    if (b == target) {
                        return true;
                    }
                    if (this.cycleDFS(b, target, stack)) {
                        return true;
                    }
                    stack.pop();
                }
            }
        }
        return false;
    }

    addBehavior(behavior: Behavior) {
        behavior.added = true;
        this.untrackedBehaviors.push(behavior)
    }

    updateDemands(behavior: Behavior, newDemands: Resource[]) {
        if (!behavior.added) {
            let err: any = new Error("Behavior must belong to graph before updating demands.");
            err.behavior = behavior;
            throw err;
        } else if (this.currentEvent == null) {
            let err: any = new Error("Demands can only be updated during an event loop.");
            err.behavior = behavior;
            throw err;
        }
        behavior.untrackedDemands = newDemands;
        this.modifiedDemandBehaviors.push(behavior);
    }

    updateSupplies(behavior: Behavior, newSupplies: Resource[]) {
        if (!behavior.added) {
            let err: any = new Error("Behavior must belong to graph before updating supplies.");
            err.behavior = behavior;
            throw err;
        } else if (this.currentEvent == null) {
            let err: any = new Error("Supplies can only be updated during an event loop.");
            err.behavior = behavior;
            throw err;
        }
        behavior.untrackedSupplies = newSupplies;
        this.modifiedSupplyBehaviors.push(behavior);
    }

    removeBehavior(behavior: Behavior, sequence: number) {
        if (behavior.supplies != null) {
            // remove all behaviors supplies from subsequents demands
            for (let supply of behavior.supplies) {
                for (let subsequent of supply.subsequents) {
                    if (subsequent.demands != null) {
                        subsequent.demands.delete(supply);
                    }
                }
                supply.subsequents.clear();
            }
        }

        if (behavior.demands != null) {
            for (let demand of behavior.demands) {
                if (demand.subsequents != null) {
                    demand.subsequents.delete(behavior);
                }
            }
            behavior.demands.clear();
        }

        behavior.removedWhen = sequence;
        behavior.added = false;
    }

    addResource(resource: Resource) {
        resource.added = true;
    }

    addExtent(extent: Extent) {
        if (extent.addedToGraphWhen != null) {
            let err: any = new Error("Extent already belongs to a graph.");
            err.extent = extent;
            err.graph = this;
            throw err;
        }
        if (this.currentEvent == null) {
            let err: any = new Error("Extents can only be added during an event loop.");
            err.extent = extent;
            throw err;
        } else {
            extent.graph = this;
            extent.addedToGraphWhen = this.currentEvent.sequence;
            for (let resource of extent.resources) {
                this.addResource(resource);
            }
            for (let behavior of extent.behaviors) {
                this.addBehavior(behavior);
            }
        }
    }

    removeExtent(extent: Extent) {
        if (this.currentEvent == null) {
            let err: any = new Error("Extents can only be removed during an event loop.");
            err.extent = extent;
            throw err;
        } else {
            for (let resource of extent.resources) {
                resource.added = false;
            }
            for (let behavior of extent.behaviors) {
                this.removeBehavior(behavior, this.currentEvent.sequence);
            }
            extent.addedToGraphWhen = null;
        }
    }
}

export class GraphEvent {
    sequence: number;
    timestamp: Date;
    impulse: string | null;

    constructor(sequence: number, timestamp: Date, impulse: string | null) {
        this.sequence = sequence;
        this.timestamp = timestamp;
        this.impulse = impulse;
    }
}

export const InitialEvent: GraphEvent = new GraphEvent(0, new Date(0), "InitialEvent");

export interface Transient {
    clear(): void;
}

