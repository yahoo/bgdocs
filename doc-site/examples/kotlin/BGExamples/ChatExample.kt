import behaviorgraph.*

// @tag::chat_extent[]
class ChatExtent(graph: Graph) : Extent<ChatExtent>(graph) {
// @end::chat_extent[]

    val participantJoined: Moment<String>
    val participantDisconnected: Moment<String>

    // @tag::chat_participants_resources[]
    val participants: State<MutableMap<String, ParticipantExtent>>
    // @end::chat_participants_resources[]

    val pinnedParticipant: State<ParticipantExtent?>

    val participantsRelink: Resource

    init {
        
        // tag::participants[]
        this.participantJoined = Moment(this)
        this.participantDisconnected = Moment(this)
        this.participants = State(this, mutableMapOf())
        this.makeBehavior(listOf(this.participantJoined, this.participantDisconnected), listOf(this.participants)) { extent ->
            if (extent.participantJoined.justUpdated) {
                val participantId = extent.participantJoined.value
                val participant = ParticipantExtent(extent.graph, participantId, extent)
                participant.addToGraph()
                extent.participants.value.set(participantId, participant)
                extent.participants.update(extent.participants.value, false)
            }

            if (extent.participantDisconnected.justUpdated) {
                val participantId = extent.participantDisconnected.value
                val participant = extent.participants.value[participantId]
                participant!!.removeFromGraph()
                extent.participants.value.remove(participantId)
                extent.participants.update(extent.participants.value, false)

            }

        }
        // end::participants[]

        // tag::chat_relink_pinned[]
        participantsRelink = Resource(this)
        makeBehavior(listOf(participants), listOf(participantsRelink)) { extent ->
            val demands = mutableListOf<Resource>()
            demands.add(extent.participants)
            demands.add(extent.participantsRelink)
            extent.participants.value.values.forEach {
                demands.add(it.pinTap)
            }
            extent.pinnedParticipant.suppliedBy!!.setDemands(demands)
        }
        // end::chat_relink_pinned[]

        // tag::chat_pinned[]
        pinnedParticipant = State(this, null)
        makeBehavior(listOf(this.participants, this.participantsRelink), listOf(this.pinnedParticipant)) { chatExtent ->
            val currentPinned = chatExtent.pinnedParticipant.value
            var newPinned: ParticipantExtent? = null
            for (particpantExtent in chatExtent.participants.value.values) {
                if (particpantExtent.pinTap.justUpdated) {
                    newPinned = particpantExtent
                    break
                } else if (particpantExtent == currentPinned) {
                    newPinned = currentPinned
                }
            }

            chatExtent.pinnedParticipant.update(newPinned, true)
        }
        // end::chat_pinned[]


    }
}

// @tag::participant_extent[]
class ParticipantExtent(
        graph: Graph,
        participantId: String,
        chatExtent: ChatExtent

) : Extent<ParticipantExtent>(graph) {
// @end::participant_extent[]
    
    val chatExtent: ChatExtent
    // @tag::participant_mute_resources[]
    val muteTap: Moment<Unit>
    val muted: State<Boolean>
    // @end::participant_mute_resources[]

    // @tag::participant_pin_resources[]
    val pinTap: Moment<Unit>
    // @end::participant_pin_resources[]
    val participantId: String

    init{
        this.participantId = participantId
        this.chatExtent = chatExtent

        this.pinTap = Moment(this)
        
        // tag::participant_mute[]
        this.muteTap = Moment(this)
        this.muted = State(this, false)
        this.makeBehavior(listOf(this.muteTap), listOf(this.muted)){ extent ->
            if (extent.muteTap.justUpdated) {
                extent.muted.update(extent.muted.value, true)
                if (extent.muted.justUpdated) {
                    extent.sideEffect("mute toggle")  { extent ->

                        extent.muteParticipant(extent.muted.value)
                        extent.updateMuteUI(extent.muted.value)
                    }
                }
            }
        }
        // end::participant_mute[]

        /*
        // tag::participant_mute_alt[]
        this.muteBehavior = this.makeBehavior(listOf(this.muteTap), listOf(this.muted), //...
        // end::participant_mute_alt[]
        */  

        // tag::participant_pinned[]
        this.makeBehavior(listOf(this.chatExtent.pinnedParticipant), null)  { participantExtent ->
            if (participantExtent.chatExtent.pinnedParticipant.justUpdatedTo(participantExtent)) {
                participantExtent.sideEffect("show as pinned")  {
                    it.updatePinUI(true)
                }
            } else if (participantExtent.chatExtent.pinnedParticipant.justUpdatedFrom(participantExtent)) {
                participantExtent.sideEffect("show as normal") {
                    it.updatePinUI(false)
                }
            }
        }
        // end::participant_pinned[]
        
    }

    fun updatePinUI(pinned: Boolean) {
        // update UI
    }
    
    fun updateMuteUI(mute: Boolean) {
        // update UI
    }

    fun muteParticipant(mute: Boolean) {
        // external api call
    }
}