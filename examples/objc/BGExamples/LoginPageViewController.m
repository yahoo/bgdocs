//
//  LoginPageViewController.m
//  BGExamples
//
//  Created by Sean Levin on 3/18/20.
//  Copyright © 2020 Verizon Media. All rights reserved.
//

#import "LoginPageViewController.h"
#import "BGGraph.h"
#import "LoginExtent.h"

@interface LoginPageViewController ()
@property (nonatomic) BGGraph *graph;
@property (nonatomic) LoginExtent *loginExtent;

@end

@implementation LoginPageViewController

- (instancetype)initWithCoder:(NSCoder *)coder {
    self = [super initWithCoder:coder];
    if (self) {
        // tag::login_enable_setup[]
        _graph = [[BGGraph alloc] init];
        _loginExtent = [[LoginExtent alloc] initWithGraph:_graph];
        [_graph action:@"new login page" runBlock:^{
            [self.loginExtent addToGraph];
        }];
        // end::login_enable_setup[]
    }
    return self;
}

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
}

// tag::login_enable_actions[]
- (IBAction)didUpdateEmailField:(id)sender {
    [self.graph action:@"update email" runBlock:^{
        [self.loginExtent.email updateValue:self.emailField.text];
    }];
}

- (IBAction)didUpdatePasswordField:(id)sender {
    [self.graph action:@"update password" runBlock:^{
        [self.loginExtent.password updateValue:self.passwordField.text];
    }];
}
// end::login_enable_actions[]

// tag::login_complete_click[]
- (IBAction)loginButtonClicked:(id)sender {
    [self.graph action:@"login button" runBlock:^{
        [self.loginExtent.loginClick update];
    }];
}
// end::login_complete_click[]

@end
