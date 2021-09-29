//
//  SignupExtent.m
//  BGExamples
//
//  Created by Sean Levin on 3/6/20.
//  Copyright © 2020 Verizon Media. All rights reserved.
//

#import "SignupExtent.h"

@implementation SignupExtent

- (instancetype)initWithGraph:(BGGraph *)graph {
    self = [super initWithGraph:graph];
    if (self) {

        _username = [self stateWithValue:nil];
        _password1 = [self stateWithValue:nil];
        _password2 = [self stateWithValue:nil];
        _signupButtonClicked = [self moment];
        
        _usernameValid = [self stateWithValue:@NO];
        _passwordsValid = [self stateWithValue:@NO];
        _signupEnabled = [self stateWithValue:@NO];
        _signingUp = [self stateWithValue:@NO];
        
        
        [self behaviorWithDemands:@[self.username] supplies:@[self.usernameValid] runBlock:^(SignupExtent * _Nonnull extent) {

            // Validate username and offer feedback
            NSString *username = extent.username.value;
            BOOL valid = [username length] >= 10 && ![username containsString:@" "];
            [extent.usernameValid updateValue:@(valid)];
            [extent sideEffect:@"update username error message" runBlock:^(SignupExtent * _Nonnull extent) {
                if (extent.usernameValid.value.boolValue) {
                    extent.signup.usernameErrorLabel.hidden = YES;
                } else {
                    extent.signup.usernameErrorLabel.hidden = NO;
                    extent.signup.usernameErrorLabel.text = @"Username must be at least 10 characters and contain no empty spaces.";
                    [extent.signup.usernameErrorLabel sizeToFit];
                    
                }
            }];
            
        }];
        
        
        [self behaviorWithDemands:@[self.password1, self.password2] supplies:@[self.passwordsValid] runBlock:^(SignupExtent * _Nonnull extent) {
            
            // Validate passwords and offer feedback
            NSString *password1 = extent.password1.value;
            NSString *password2 = extent.password2.value;
            BOOL valid = [password1 length] >= 10 && [password1 isEqualToString:password2];
            [extent.passwordsValid updateValue:@(valid)];
            [extent sideEffect:@"update password valid error message" runBlock:^(SignupExtent * _Nonnull extent) {
                if (extent.passwordsValid.value.boolValue) {
                    extent.signup.passwordErrorLabel.hidden = YES;
                } else {
                    extent.signup.passwordErrorLabel.hidden = NO;
                    extent.signup.passwordErrorLabel.text = @"Passwords must match and be at least 10 characters long.";
                    [extent.signup.passwordErrorLabel sizeToFit];
                }
            }];
            
        }];
        
        
        [self behaviorWithDemands:@[self.usernameValid, self.passwordsValid, self.signingUp] supplies:@[self.signupEnabled] runBlock:^(SignupExtent * _Nonnull extent) {
        
            // Signup only allowed when username and password fields are valid
            [extent.signupEnabled updateValue:@(extent.usernameValid.value.boolValue && extent.passwordsValid.value.boolValue && !extent.signingUp.value.boolValue)];
            [extent sideEffect:@"enable signup button" runBlock:^(SignupExtent * _Nonnull extent) {
                extent.signup.signupButton.enabled = extent.signupEnabled.value.boolValue;
            }];
            
        }];
        
        
        [self behaviorWithDemands:@[self.signupButtonClicked] supplies:@[self.signingUp] runBlock:^(SignupExtent * _Nonnull extent) {
           
            // On signup switch to signing up mode which will disable more user interaction
            // Note signupEnabled uses trace value to prevent graph cycle with signupEnabled behavior
            if (extent.signupButtonClicked.justUpdated && extent.signupEnabled.traceValue.boolValue) {
                [extent.signingUp updateValue:@YES];
                [extent sideEffect:@"submit signup form" runBlock:^(SignupExtent * _Nonnull extent) {
                    [extent.signup startSignupWithUsername:extent.username.value password:extent.password1.value];
                    extent.signup.usernameTextField.enabled = !extent.signingUp.value.boolValue;
                    extent.signup.password1Field.enabled = !extent.signingUp.value.boolValue;
                    extent.signup.password2Field.enabled = !extent.signingUp.value.boolValue;
                }];
            }
            
        }];
    }
    return self;
}


@end
