import {Orderable} from "./bufferedqueue";
import {Extent, Named} from "./extent";
import {Resource} from "./resource";
import {OrderingState} from "./behavegjs"

export class Behavior implements Named, Orderable {
    demands: Set<Resource> | null;
    supplies: Set<Resource> | null;
    block: (extent: Extent) => void;
    debugName: string | null = null;
    enqueuedWhen: number | null;
    runWhen: number | null;
    removedWhen: number | null = null;
    added: boolean = false;
    extent: Extent;
    orderingState: OrderingState = OrderingState.Unordered;
    order: number = 0;

    untrackedDemands: Resource[] | null;
    untrackedSupplies: Resource[] | null;

    constructor(extent: Extent, demands: Resource[] | null, supplies: Resource[] | null, block: (extent: Extent) => void) {
        this.extent = extent;
        extent.addBehavior(this);
        this.demands = null;
        this.supplies = null;
        this.block = block;
        this.enqueuedWhen = null;
        this.runWhen = null;
        this.untrackedDemands = demands;
        this.untrackedSupplies = supplies;
    }

    setDemands(newDemands: Resource[]) {
        this.extent.graph.setDemands(this, newDemands);
    }

    setSupplies(newSupplies: Resource[]) {
        this.extent.graph.setSupplies(this, newSupplies);
    }
}
