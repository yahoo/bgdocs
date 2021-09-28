//
//  ChatExtent.h
//  BGExamples
//
//  Created by Sean Levin on 5/13/20.
//  Copyright © 2020 Verizon Media. All rights reserved.
//

#import "BGGraph.h"

NS_ASSUME_NONNULL_BEGIN

@class ParticipantExtent;

// @tag::chat_extent[]
@class ChatExtent;
@interface ChatExtent : BGExtent<ChatExtent*>
// @end::chat_extent[]

@property (nonatomic, readonly) BGMoment<NSString *> *participantJoined;
@property (nonatomic, readonly) BGMoment<NSString *> *participantDisconnected;

// @tag::chat_participants_resources[]
@property (nonatomic, readonly) BGState<NSMutableDictionary *> *participants;
// @end::chat_participants_resources[]
@property (nonatomic, readonly) BGState<ParticipantExtent *> *pinnedParticipant;

@property (nonatomic, readonly) BGResource *participantsRelink;
@property (nonatomic, readonly) BGBehavior *pinnedBehavior;

@end

NS_ASSUME_NONNULL_END
