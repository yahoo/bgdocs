import {Behavior} from "./behavior";
import {Extent, Named} from "./extent";
import {GraphEvent, Graph, Transient, InitialEvent} from "./behavegjs";

export class Resource implements Named {
    debugName: string | null = null;

    extent: Extent;
    graph: Graph;
    added: boolean = false;
    subsequents: Set<Behavior> = new Set();
    suppliedBy: Behavior | null = null;

    constructor(extent: Extent, name?: string) {
        this.extent = extent;
        this.graph = extent.graph;
        extent.addResource(this);
        if (name !== undefined) {
            this.debugName = name;
        }
    }

    assertValidUpdater() {
        let graph = this.graph;
        let currentBehavior = graph.currentBehavior;
        let currentEvent = graph.currentEvent;
        if (currentBehavior == null && currentEvent == null) {
            let err: any = new Error("Resource must be updated inside a behavior or action");
            err.resource = this;
            throw err;
        }
        if (this.suppliedBy && currentBehavior != this.suppliedBy) {
            let err: any = new Error("Supplied resource can only be updated by its supplying behavior.");
            err.resource = this;
            err.currentBehavior = currentBehavior;
            throw err;
        }
        if (this.suppliedBy == null && currentBehavior != null) {
            let err: any = new Error("Unsupplied resource can only be updated in an action.");
            err.resource = this;
            err.currentBehavior = currentBehavior;
            throw err;
        }
    }
}

export class Moment<T = undefined> extends Resource implements Transient {
    private _happened: boolean = false;
    private _happenedValue: T | undefined = undefined;
    private _happenedWhen: GraphEvent | null = null;

    get justUpdated(): boolean {
        return this._happened;
    }

    get value(): T | undefined {
        return this._happenedValue;
    }

    get event(): GraphEvent | null {
        return this._happenedWhen;
    }

    updateWithAction(value: T | undefined = undefined) {
        this.graph.action(this.debugName ?? ("Impulse From happen(): " + this), () => {
            this.update(value);
        });
        return;
    }

    update(value: T | undefined = undefined) {
        this.assertValidUpdater();
        this._happened = true;
        this._happenedValue = value;
        this._happenedWhen = this.graph.currentEvent;
        this.graph.resourceTouched(this);
        this.graph.trackTransient(this);
    }

    clear(): void {
        this._happened = false;
        this._happenedValue = undefined;
    }

}

export type StateHistory<T> = { value: T, event: GraphEvent };
export class State<T> extends Resource implements Transient {
    private history: StateHistory<T>[]  = [];
    private historyLength: number = 1;

    constructor(initialState: T, extent: Extent, name?: string) {
        super(extent, name);
        this.history.unshift({ value: initialState, event: InitialEvent });
    }

    updateWithAction(newValue: T, changesOnly: boolean) {
        this.graph.action(this.debugName ?? ("Impulse From updateValue(): " + this), () => {
            this.update(newValue, changesOnly);
        });
        return;
    }

    update(newValue: T, changesOnly: boolean) {
        this.assertValidUpdater();

        if (changesOnly) {
            if (this.history[0].value == newValue) {
                return;
            }
        }
        this.history.unshift({ value: newValue, event: this.graph.currentEvent! });
        this.graph.resourceTouched(this);
        this.graph.trackTransient(this);
    }

    clear(): void {
        this.history.length = this.historyLength;
    }

    get value(): T {
        return this.history[0].value;
    }

    get event(): GraphEvent {
        return this.history[0].event;
    }

    get trace(): StateHistory<T> {
        let evt = this.graph?.currentEvent;
        let current = this.history[0];
        if (evt) {
            if (evt.sequence == current.event.sequence) {
                return this.history[1];
            }
        } else {
            let err: any = new Error("Traced state can only be accessed during event loop.");
            err.resource = this;
            throw err;
        }
        return current;
    }

    get traceValue(): T {
        return this.trace.value;
    }

    get traceEvent(): GraphEvent {
        return this.trace.event;
    }

    historyAt(event: GraphEvent): { value: T, event: GraphEvent } | undefined {
        if (event) {
            for (let h of this.history) {
                if (h.event.sequence <= event.sequence) {
                    return h;
                }
            }
            return undefined;
        }
    }

    get justUpdated(): boolean {
        return this.justUpdatedToFrom(undefined, undefined);
    }

    justUpdatedTo(toState: T): boolean {
        return this.justUpdatedToFrom(toState, undefined);
    }

    justUpdatedFrom(fromState: T): boolean {
        return this.justUpdatedToFrom(undefined, fromState);
    }

    justUpdatedToFrom(toState: T | undefined, fromState: T | undefined): boolean {
        let evt = this.graph?.currentEvent;
        if (evt) {
            if (this.history.length > 1) {
                let s = this.history[0];
                let changed = evt.sequence == s.event.sequence;
                if (toState != undefined) {
                    changed = changed && s.value == toState;
                }
                if (fromState != undefined) {
                    let p = this.history[1];
                    changed = changed && p.value == fromState;
                }
                return changed;
            }
        }
        return false;
    }
}

