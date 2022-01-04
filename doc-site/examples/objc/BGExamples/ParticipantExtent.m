//
//  ParticipantExtent.m
//  BGExamples
//
//  Created by Sean Levin on 5/13/20.
//  Copyright © 2020 Verizon Media. All rights reserved.
//

#import "ParticipantExtent.h"
#import "ChatExtent.h"

@implementation ParticipantExtent

- (instancetype)initWithGraph:(BGGraph *)graph participantId:(NSString *)participantId chat:(ChatExtent *)chatExtent {
    self = [super initWithGraph:graph];
    if (self) {
        
        _chatExtent = chatExtent;
        _participantId = participantId;
        
        // tag::participant_mute[]
        _muteTap = [self moment];
        _muted = [self stateWithValue:@NO];
        [self behaviorWithDemands:@[_muteTap] supplies:@[_muted] runBlock:^(ParticipantExtent * _Nonnull extent) {
            if (extent.muteTap.justUpdated) {
                [extent.muted updateValue:@(!extent.muted.value.boolValue)];
                if (extent.muted.justUpdated) {
                    [extent sideEffect:@"mute toggle" runBlock:^(ParticipantExtent * _Nonnull extent) {
                        [extent muteParticipant:extent.muted.value.boolValue];
                        [extent updateMuteUI:extent.muted.value.boolValue];
                    }];
                }
            }
        }];
        // end::participant_mute[]
        
        _pinTap = [self moment];
        // tag::participant_pinned[]
        [self behaviorWithDemands:@[_chatExtent.pinnedParticipant] supplies:nil runBlock:^(ParticipantExtent * _Nonnull extent) {
            
            if ([extent.chatExtent.pinnedParticipant justUpdatedTo:extent]) {
                [extent sideEffect:@"show as pinned" runBlock:^(ParticipantExtent * _Nonnull extent) {
                    [extent updatePinUI:YES];
                }];
            } else if ([extent.chatExtent.pinnedParticipant justUpdatedFrom:extent]) {
                [extent sideEffect:@"show as normal" runBlock:^(ParticipantExtent * _Nonnull extent) {
                    [extent updatePinUI:NO];
                }];
            }
        }];
        // end::participant_pinned[]
        
    }
    return self;
}

- (void)alts {
    // tag::participant_mute_alt[]
    _muteBehavior = [self behaviorWithDemands:@[_muteTap] supplies:@[_muted] //...
                     // end::participant_mute_alt[]
                                     runBlock:^(ParticipantExtent * _Nonnull extent) {
        
    }];
    
}

- (void)updatePinUI:(BOOL)pinned {
    
}

- (void)updateMuteUI:(BOOL)mute {
    // update ui
}

- (void)muteParticipant:(BOOL)mute {
    // external api call
}

@end
