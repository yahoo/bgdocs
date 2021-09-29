import {Graph} from "./behavegjs";
import {Behavior} from "./behavior";
import {Resource} from "./resource";

export interface Named {
    debugName: string | null;
}

function isNamed(arg: any): arg is Named {
    return (arg as Named).debugName !== undefined;
}

export class Extent implements Named {
    debugName: string | null;
    behaviors: Behavior[] = [];
    resources: Resource[] = [];
    graph: Graph;
    addedToGraphWhen: number | null = null;

    constructor(graph: Graph) {
        this.debugName = this.constructor.name;
        this.graph = graph;
    }

    addBehavior(behavior: Behavior) {
        this.behaviors.push(behavior);
    }

    addResource(resource: Resource) {
        this.resources.push(resource);
    }

    addToGraphWithAction() {
        this.graph.action('add extent: ' + this.debugName, () => { this.addToGraph(); });
    }

    addToGraph() {
        if (this.graph.currentEvent != null) {
            this.collectAndNameComponents();
            this.graph.addExtent(this);
        } else {
            let err: any = new Error("addToGraph must be called within an event loop.");
            err.extent = this;
            throw err;
        }
    }

    removeFromGraphWithAction() {
        this.graph.action('remove extent: ' + this.debugName, () => { this.removeFromGraph(); });
    }

    removeFromGraph() {
        let graph = this.graph;
        if (graph.currentEvent != null) {
            if (this.addedToGraphWhen != null) {
                graph.removeExtent(this);
            }
        } else {
            let err: any = new Error("removeFromGraph must be called within an event loop.");
            err.extent = this;
            throw err;
        }
    }

    collectAndNameComponents() {
        // automatically add any behaviors and resources that are contained
        // by this Extent object and name them with corresponding keys
        for (let key in this) {
            let object = this[key];
            if (object == null || object == undefined) { continue; }
            if (isNamed(object)) {
                if (object.debugName == null) {
                    object.debugName = key;
                }
            }

            if (object instanceof Behavior && object.extent == null) {
                this.addBehavior(object);
            } else if (object instanceof Resource && object.extent == null) {
                this.addResource(object);
            }
        }
    }

    makeBehavior(demands: Resource[] | null, supplies: Resource[] | null, block: (extent: this) => void): Behavior {
        let behavior = new Behavior(this, demands, supplies, block as (extent: Extent) => void);
        return behavior;
    }

    sideEffect(name: string | null, block: (extent: this) => void) {
        if (this.addedToGraphWhen != null) {
            this.graph.sideEffect(this, name, block as (extent: Extent) => void);
        }
    }

    actionAsync(impulse: string, action: () => void) {
        if (this.addedToGraphWhen != null) {
            this.graph.actionAsync(impulse, action);
        } else {
            let err: any = new Error("Action on extent requires it be added to the graph.");
            err.extent = this;
            throw err;
        }
    }

    action(impulse: string, action: () => void) {
        if (this.addedToGraphWhen != null) {
            this.graph.action(impulse, action);
        } else {
            let err: any = new Error("Action on extent requires it be added to the graph.");
            err.extent = this;
            throw err;
        }
    }
}
