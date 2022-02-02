//
//  LoginExtent.h
//  BGExamples
//
//  Created by Sean Levin on 3/18/20.
//  Copyright © 2020 Verizon Media. All rights reserved.
//

#import "BGGraph.h"
#import "LoginPageViewController.h"

NS_ASSUME_NONNULL_BEGIN

// tag::login_enable_extent[]
@class LoginExtent;
@interface LoginExtent : BGExtent<LoginExtent*>
@property (nonatomic, readonly) BGState<NSString *> *email;
@property (nonatomic, readonly) BGState<NSString *> *password;
// end::login_enable_extent[]

@property (nonatomic, readonly) BGMoment *loginClick;
@property (nonatomic, readonly) BGMoment *returnKey;
@property (nonatomic, readonly) BGState<NSNumber *> *emailValid;
@property (nonatomic, readonly) BGState<NSNumber *> *passwordValid;
@property (nonatomic, readonly) BGState<NSNumber *> *loginEnabled;
@property (nonatomic, readonly) BGState<NSNumber *> *loggingIn;
@property (nonatomic, readonly) BGMoment<NSNumber *> *loginComplete;
@property (nonatomic, readwrite, weak) LoginPageViewController *login;
@end

NS_ASSUME_NONNULL_END
