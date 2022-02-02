//
//  SigngupPageViewController.m
//  BGExamples
//
//  Created by Sean Levin on 3/6/20.
//  Copyright © 2020 Verizon Media. All rights reserved.
//

#import "SigngupPageViewController.h"
#import "BGGraph.h"
#import "SignupExtent.h"

@interface SigngupPageViewController ()
@property (nonatomic) BGGraph *graph;
@property (nonatomic) SignupExtent *signupExtent;
@end

@implementation SigngupPageViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    _graph = [[BGGraph alloc] init];
    _signupExtent = [[SignupExtent alloc] initWithGraph:_graph];
    _signupExtent.signup = self;
    [_graph action:@"initial setup" runBlock:^{
        [self.signupExtent addToGraph];
    }];
}

- (void)startSignupWithUsername:(NSString *)username password:(NSString *)password {
    NSLog(@"Signup api call sent.");
}

- (IBAction)didTapSubmitButton:(id)sender {
    [self.graph action:_fname runBlock:^{
        [self.signupExtent.signupButtonClicked update];
    }];
}

- (IBAction)didUpdateUsernameField:(id)sender {
    [self.graph action:_fname runBlock:^{
        [self.signupExtent.username updateValue:self.usernameTextField.text];
    }];
}

- (IBAction)didUpdatePasswordField:(id)sender {
    [self.graph action:_fname runBlock:^{
        if (sender == self.password1Field) {
            [self.signupExtent.password1 updateValue:self.password1Field.text];
        } else if (sender == self.password2Field) {
            [self.signupExtent.password2 updateValue:self.password2Field.text];
        }
    }];
}

@end
