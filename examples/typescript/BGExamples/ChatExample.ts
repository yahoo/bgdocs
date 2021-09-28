import { Graph, InitialEvent, ValuePersistence } from './behaveg/behavegjs';
import { Behavior } from "./behaveg/behavior"
import { State, Moment, Resource } from "./behaveg/resource"
import { Extent } from "./behaveg/extent"

// @tag::chat_extent[]
class ChatExtent extends Extent {
// @end::chat_extent[]

    participantJoined: Moment<string>;
    participantDisconnected: Moment<string>;

    // @tag::chat_participants_resources[]
    participants: State<Map<string, ParticipantExtent>>;
    // @end::chat_participants_resources[]

    pinnedParticipant: State<ParticipantExtent>;

    participantsRelink: Resource;
    pinnedBehavior: Behavior;

    constructor(graph: Graph) {
        super(graph);

                // tag::participants[]
                this.participantJoined = new Moment(this);
                this.participantDisconnected = new Moment(this);
                this.participants = new State(new Map(), this);
                this.makeBehavior([this.participantJoined, this.participantDisconnected], [this.participants], (extent : this) => {
                    if (extent.participantJoined.justUpdated) {
                        const participantId = extent.participantJoined.value;
                        const participant = new ParticipantExtent(extent.graph, participantId, extent);
                        participant.addToGraph();
                        extent.participants.value.set(participantId, participant);
                        extent.participants.update(extent.participants.value, false);
                    }
                    
                    if (extent.participantDisconnected.justUpdated) {
                        const participantId = extent.participantDisconnected.value;
                        const participant = extent.participants.value.get(participantId);
                        participant.removeFromGraph();
                        extent.participants.value.delete(participantId);
                        extent.participants.update(extent.participants.value, false);

                    }

                });
                // end::participants[]
        
                // tag::chat_relink_pinned[]
                this.participantsRelink = new Resource(this);
                this.makeBehavior([this.participants], [this.participantsRelink], (extent: this) => {
                    let demands = [];
                    demands.push(extent.participants);
                    demands.push(extent.participantsRelink);
                    for (let participant of extent.participants.value.values()) {
                        demands.push(participant.pinTap);
                    }
                    extent.pinnedParticipant.suppliedBy.setDemands(demands);
                });
                // end::chat_relink_pinned[]
        
                // tag::chat_pinned[]
                this.pinnedParticipant = new State(null, this);
                this.makeBehavior([this.participants, this.participantsRelink], [this.pinnedParticipant], (extent: this) => {
                    const currentPinned = extent.pinnedParticipant.value;
                    let newPinned: ParticipantExtent = null;
                    for (let participant of extent.participants.value.values()) {
                        if (participant.pinTap.justUpdated) {
                            newPinned = participant;
                            break;
                        } else if (participant === currentPinned) {
                            newPinned = currentPinned;
                        }
                    }

                    extent.pinnedParticipant.update(newPinned, true);
                });
                // end::chat_pinned[]
        

    }
}

// @tag::participant_extent[]
class ParticipantExtent extends Extent {
// @end::participant_extent[]
    
    chatExtent: ChatExtent;
    // @tag::participant_mute_resources[]
    muteTap: Moment;
    muted: State<boolean>;
    // @end::participant_mute_resources[]

    // @tag::participant_pin_resources[]
    pinTap: Moment;
    // @end::participant_pin_resources[]

    muteBehavior: Behavior;
    participantId: string;

    constructor(graph: Graph, participantId: string, chatExtent: ChatExtent) {
        super(graph);

        this.chatExtent = chatExtent;
        this.participantId = participantId;
        this.pinTap = new Moment(this);
        
        // tag::participant_mute[]
        this.muteTap = new Moment(this);
        this.muted = new State(false, this);
        this.makeBehavior([this.muteTap], [this.muted], (extent: this) => {
            if (extent.muteTap.justUpdated) {
                extent.muted.update(!extent.muted.value, true);
                if (extent.muted.justUpdated) {
                    extent.sideEffect('mute toggle', (extent: this) => {
                        extent.muteParticipant(extent.muted.value);
                        extent.updateMuteUI(extent.muted.value);
                    });
                }
            }
        });
        // end::participant_mute[]

        /*
        // tag::participant_mute_alt[]
        this.muteBehavior = this.makeBehavior([this.muteTap], [this.muted], //...
        // end::participant_mute_alt[]
        */  

        // tag::participant_pinned[]
        this.makeBehavior([this.chatExtent.pinnedParticipant], null, (extent: this) => {
            if (extent.chatExtent.pinnedParticipant.justUpdatedTo(extent)) {
                extent.sideEffect('show as pinned', (extent: this) => {
                    extent.updatePinUI(true);
                });
            } else if (extent.chatExtent.pinnedParticipant.justUpdatedFrom(extent)) {
                extent.sideEffect('show as normal', (extent: this) => {
                    extent.updatePinUI(false);
                });
            }
        });
        // end::participant_pinned[]
        
    }

    updatePinUI(pinned: boolean) {
        // update UI
    }
    
    updateMuteUI(mute: boolean) {
        // update UI
    }

    muteParticipant(mute: boolean) {
        // external api call
    }
}