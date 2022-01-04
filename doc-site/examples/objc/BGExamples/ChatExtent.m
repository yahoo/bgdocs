//
//  ChatExtent.m
//  BGExamples
//
//  Created by Sean Levin on 5/13/20.
//  Copyright © 2020 Verizon Media. All rights reserved.
//

#import "ChatExtent.h"
#import "ParticipantExtent.h"

@implementation ChatExtent

- (instancetype)initWithGraph:(BGGraph *)graph {
    self = [super initWithGraph:graph];
    if (self) {


        // tag::participants[]
        _participantJoined = [self moment];
        _participantDisconnected = [self moment];
        _participants = [self stateWithValue:[NSMutableDictionary new]];
        [self behaviorWithDemands:@[_participantJoined, _participantDisconnected] supplies:@[_participants] runBlock:^(ChatExtent * _Nonnull extent) {
           
            if (extent.participantJoined.justUpdated) {
                NSString *participantId = extent.participantJoined.value;
                ParticipantExtent *participant = [[ParticipantExtent alloc] initWithGraph:extent.graph participantId:participantId chat:extent];
                [participant addToGraph];
                extent.participants.value[participantId] = participant;
                [extent.participants updateValueForce:extent.participants.value];
            }
            
            if (extent.participantDisconnected.justUpdated) {
                NSString *participantId = extent.participantDisconnected.value;
                ParticipantExtent *participant = extent.participants.value[participantId];
                [participant removeFromGraph];
                extent.participants.value[participantId] = nil;
                [extent.participants updateValueForce:extent.participants.value];
            }
            
        }];
        // end::participants[]

        // tag::chat_relink_pinned[]
        _participantsRelink = [self resource];
        [self behaviorWithDemands:@[_participants] supplies:@[_participantsRelink] runBlock:^(ChatExtent * _Nonnull extent) {
            NSMutableArray *demands = [NSMutableArray new];
            [demands addObject:extent.participants];
            [demands addObject:extent.participantsRelink];
            for (ParticipantExtent *p in extent.participants.value) {
                [demands addObject:p.pinTap];
            }
            [extent.pinnedBehavior setDemands:demands];
        }];
        // end::chat_relink_pinned[]

        // tag::chat_pinned[]
        _pinnedParticipant = [self stateWithValue:nil];
        _pinnedBehavior = [self behaviorWithDemands:@[_participants, _participantsRelink] supplies:@[_pinnedParticipant] runBlock:^(ChatExtent * _Nonnull extent) {
            
            ParticipantExtent *currentPinned = extent.pinnedParticipant.value;
            ParticipantExtent *newPinned = nil;
            for (ParticipantExtent *participant in extent.participants.value.allValues) {
                if (participant.pinTap.justUpdated) {
                    newPinned = participant;
                    break;
                } else if (participant == currentPinned) {
                    newPinned = currentPinned;
                }
            }
            
            [extent.pinnedParticipant updateValue:newPinned];
            
        }];
        // end::chat_pinned[]
        
    }
    return self;
}

@end
