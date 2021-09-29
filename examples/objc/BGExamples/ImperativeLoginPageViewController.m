//
//  ImperativeLoginPageViewController.m
//  BGExamples
//
//  Created by Sean Levin on 3/18/20.
//  Copyright © 2020 Verizon Media. All rights reserved.
//

#import "ImperativeLoginPageViewController.h"

@interface ImperativeLoginPageViewController ()

@end

@implementation ImperativeLoginPageViewController

- (BOOL)validEmailAddress:(NSString *)email {
    return email.length > 0 && [email containsString:@"@"];
}

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
}

- (IBAction)didUpdateEmailField:(id)sender {
    [self checkEnableLoginButton];
}

- (IBAction)didUpdatePasswordField:(id)sender {
    [self checkEnableLoginButton];
}

- (void)checkEnableLoginButton {
    NSString *email = self.emailField.text;
    NSString *password = self.passwordField.text;
    BOOL hasPassword = password.length > 0;
    self.loginButton.enabled = [self validEmailAddress:email] && hasPassword;
}

@end
