//
//  LoginExtent.m
//  BGExamples
//
//  Created by Sean Levin on 3/18/20.
//  Copyright © 2020 Verizon Media. All rights reserved.
//

#import "LoginExtent.h"

@implementation LoginExtent

/*
- (instancetype)init {
    self = [super init];
    if (self) {


    }
    return self;
}
*/
    // tag::login_enable_init[]
- (instancetype)initWithGraph:(BGGraph *)graph {
    self = [super initWithGraph:graph];
    
    _email = [self stateWithValue:@""];
    _password = [self stateWithValue:@""];
    
    // tag::login_enable_behavior[]
    [self behaviorWithDemands:@[self.email, self.password]
                     supplies:nil
                     runBlock:^(LoginExtent * _Nonnull extent) {
        // end::login_enable_init[]

        NSString *email = extent.email.value;
        NSString *password = extent.password.value;
        BOOL hasPassword = password.length > 0;
        BOOL loginEnabled = [extent validEmailAddress:email] && hasPassword;
        [extent sideEffect:@"enable login button" runBlock:^(LoginExtent * _Nonnull extent) {
            extent.login.loginButton.enabled = loginEnabled;
        }];
        
    }];
    // end::login_enable_behavior[]

    return self;
}

- (void)initBehaviorGraphComplete {
    
    _loggingIn = [self stateWithValue:@NO];
    
    // tag::login_complete_email[]
    _emailValid = [self stateWithValue:@NO];
    [self behaviorWithDemands:@[self.email]
                     supplies:@[self.emailValid]
                     runBlock:^(LoginExtent * _Nonnull extent) {
        
        NSString *email = extent.email.value;
        BOOL emailValid = [self validEmailAddress:email];
        [extent.emailValid updateValue:@(emailValid)];

    }];
    // end::login_complete_email[]

    _passwordValid = [self stateWithValue:@NO];
    [self behaviorWithDemands:@[self.password]
                     supplies:@[self.passwordValid]
                     runBlock:^(LoginExtent * _Nonnull extent) {
       
        NSString *password = extent.password.value;
        BOOL passwordValid = password.length > 0;
        [extent.passwordValid updateValue:@(passwordValid)];
        
    }];


    // tag::login_complete_enable[]
    _loginEnabled = [self stateWithValue:@NO];
    [self behaviorWithDemands:@[self.emailValid, self.passwordValid, self.loggingIn]
                     supplies:@[self.loginEnabled]
                     runBlock:^(LoginExtent * _Nonnull extent) {
        
        BOOL enabled = (extent.emailValid.value.boolValue &&
                        extent.passwordValid.value.boolValue &&
                        !extent.loggingIn.value.boolValue);
        [extent.loginEnabled updateValue:@(enabled)];
        [extent sideEffect:@"enable login button" runBlock:^(LoginExtent * _Nonnull extent) {
            extent.login.loginButton.enabled = extent.loginEnabled.value.boolValue;
        }];
        
    }];
    // end::login_complete_enable[]

    // tag::login_complete_login[]
    _loginClick = [self moment];
    _returnKey = [self moment];
    _loginComplete = [self moment];
    [self behaviorWithDemands:@[self.loginClick, self.returnKey, self.loginComplete]
                     supplies:@[self.loggingIn]
                     runBlock:^(LoginExtent * _Nonnull extent) {
        
        if ((extent.loginClick.justUpdated || extent.returnKey.justUpdated) &&
            extent.loginEnabled.traceValue.boolValue) {
            // Start login
            [extent.loggingIn updateValue:@YES];
        } else if (extent.loginComplete.justUpdated &&
                   extent.loggingIn.value.boolValue) {
            // Complete login
            [extent.loggingIn updateValue:@NO];
        }

        if ([extent.loggingIn justUpdatedTo:@YES]) {
            [extent sideEffect:@"login api call" runBlock:^(LoginExtent * _Nonnull extent) {
                [extent login:extent.email.value password:extent.password.value complete:^(BOOL success) {
                    [extent action:@"login complete" runBlock:^{
                        [extent.loginComplete updateValue:@(success)];
                    }];
                }];
            }];
        }

    }];
    // end::login_complete_login[]

    /*
     // Dont delete; its used in the documentation
     // this has an example of requireSync
     
    [self behaviorWithDemands:@[self.loginClick, self.returnKey, self.loginComplete]
                     supplies:@[self.loggingIn]
                     runBlock:^(LoginExtent t* _Nonnull extent) {
        
        if ((extent.loginClick.justHappened || extent.returnKey.justHappened) &&
            extent.loginEnabled.traceValue.boolValue) {
            // Start login
            [extent.loggingIn updateValue:@YES];
        } else if (extent.loginComplete.justHappened &&
                   extent.loggingIn.value.boolValue) {
            // Complete login
            [extent.loggingIn updateValue:@NO];
        }

        if ([extent.loggingIn justChangedTo:@YES]) {
            // tag::login_complete_loginalt[]
            [extent sideEffect:@"login api call" block:^(LoginExtent * _Nonnull extent) {
                [extent login:extent.email.value password:extent.password.value complete:^(BOOL success) {
                    [extent.graph action:@"login complete" requireSync:NO runBlock:^{
                        [extent.loginComplete happen:@(success)];
                    }];
                }];
            }];
            // end::login_complete_loginalt[]
        }

    }];
     */
}

- (instancetype)initShortWithGraph:(BGGraph *)graph {
    // tag::login_intro_short1[]
    [self behaviorWithDemands:@[self.email, self.password]
                     supplies:@[self.loginEnabled]
                     runBlock:^(LoginExtent *extent) {
        
        BOOL emailValid = [extent validEmailAddress:extent.email.value];
        BOOL passwordValid = extent.password.value.length > 0;
        BOOL enabled = emailValid && passwordValid;
        [extent.loginEnabled updateValue:@(enabled)];
        
    }];
    // end::login_intro_short1[]

    // tag::login_intro_short2[]
    [self behaviorWithDemands:@[self.loginClick]
                     supplies:@[self.loggingIn]
                     runBlock:^(LoginExtent * _Nonnull extent) {
        if (extent.loginClick.justUpdated && !extent.loggingIn.value.boolValue) {
            [extent.loggingIn updateValue:@YES];
        }
    }];
    
    [self behaviorWithDemands:@[self.email, self.password, self.loggingIn]
                     supplies:@[self.loginEnabled]
                     runBlock:^(LoginExtent *extent) {
        
        BOOL emailValid = [extent validEmailAddress:extent.email.value];
        BOOL passwordValid = extent.password.value.length > 0;
        BOOL enabled = emailValid && passwordValid && !self.loggingIn.value.boolValue;
        [extent.loginEnabled updateValue:@(enabled)];
        
    }];
    // end::login_intro_short2[]


    // tag::login_intro_sideeffect[]
    [self behaviorWithDemands:@[self.email, self.password, self.loggingIn]
                     supplies:@[self.loginEnabled]
                     runBlock:^(LoginExtent *extent) {

        BOOL emailValid = [extent validEmailAddress:extent.email.value];
        BOOL passwordValid = extent.password.value.length > 0;
        BOOL enabled = emailValid && passwordValid && !self.loggingIn.value.boolValue;
        [extent.loginEnabled updateValue:@(enabled)];

        [extent sideEffect:@"enable login button" runBlock:^(LoginExtent * _Nonnull extent) {
            extent.loginButton.enabled = extent.loginEnabled.value.boolValue;
        }];
    }];
    // end::login_intro_sideeffect[]

    return self;
}

// tag::login_intro_action[]
- (void)loginButtonClicked:(id)sender {
    [self.graph action:@"loginButtonClicked" runBlock:^{
        [self.loginClick update];
    }];
}
// end::login_intro_action[]

- (BOOL)validEmailAddress:(NSString *)email {
    return email.length > 0 && [email containsString:@"@"];
}

- (void)login:(NSString *)email password:(NSString *)password complete:(void(^)(BOOL success))complete {
    // some login api
}

// tag::login_sequence_compare[]
- (BOOL)emailChangedSincePassword {
    return self.email.event.sequence > self.password.event.sequence;
}
// end::login_sequence_compare[]

// tag::login_timestamp[]
- (NSDate *)loginCompletedWhen {
    return self.loginComplete.event.timestamp;
}
// end::login_timestamp[]

@end
