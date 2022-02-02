//
//  ParticipantExtent.h
//  BGExamples
//
//  Created by Sean Levin on 5/13/20.
//  Copyright © 2020 Verizon Media. All rights reserved.
//

#import "BGGraph.h"

NS_ASSUME_NONNULL_BEGIN

@class ChatExtent;

// @tag::participant_extent[]
@class ParticipantExtent;
@interface ParticipantExtent : BGExtent<ParticipantExtent*>
// @end::participant_extent[]

@property (nonatomic, weak, readonly) ChatExtent *chatExtent;
// @tag::participant_mute_resources[]
@property (nonatomic, readonly) BGMoment *muteTap;
@property (nonatomic, readonly) BGState<NSNumber *> *muted;
// @end::participant_mute_resources[]

// @tag::participant_pin_resources[]
@property (nonatomic, readonly) BGMoment *pinTap;
// @end::participant_pin_resources[]

@property (nonatomic) BGBehavior *muteBehavior;

@property (nonatomic, readonly) NSString *participantId;

- (instancetype)initWithGraph:(BGGraph *)graph participantId:(NSString *)participantId chat:(ChatExtent *)chatExtent;

@end

NS_ASSUME_NONNULL_END
