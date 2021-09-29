//
//  LoginPageViewController.h
//  BGExamples
//
//  Created by Sean Levin on 3/18/20.
//  Copyright © 2020 Verizon Media. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface LoginPageViewController : UIViewController

@property (nonatomic) IBOutlet UITextField *emailField;
@property (nonatomic) IBOutlet UITextField *passwordField;
@property (nonatomic) IBOutlet UIButton *loginButton;

@property (nonatomic) IBOutlet UILabel *emailFeedback;
@property (nonatomic) IBOutlet UILabel *passwordFeedback;
@end

NS_ASSUME_NONNULL_END
