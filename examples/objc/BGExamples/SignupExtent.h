//
//  SignupExtent.h
//  BGExamples
//
//  Created by Sean Levin on 3/6/20.
//  Copyright © 2020 Verizon Media. All rights reserved.
//

#import "BGGraph.h"
#import "SigngupPageViewController.h"

NS_ASSUME_NONNULL_BEGIN

@class SignupExtent;
@interface SignupExtent : BGExtent<SignupExtent*>

@property (nonatomic, readonly) BGState<NSString *> *username;
@property (nonatomic, readonly) BGState<NSString *> *password1;
@property (nonatomic, readonly) BGState<NSString *> *password2;
@property (nonatomic, readonly) BGMoment *signupButtonClicked;

@property (nonatomic, readonly) BGState<NSNumber *> *usernameValid;
@property (nonatomic, readonly) BGState<NSNumber *> *passwordsValid;
@property (nonatomic, readonly) BGState<NSNumber *> *signupEnabled;
@property (nonatomic, readonly) BGState<NSNumber *> *signingUp;

@property (nonatomic, readwrite, weak) SigngupPageViewController *signup;

@end

NS_ASSUME_NONNULL_END
