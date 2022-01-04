//
//  SigngupPageViewController.h
//  BGExamples
//
//  Created by Sean Levin on 3/6/20.
//  Copyright © 2020 Verizon Media. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface SigngupPageViewController : UIViewController

@property (nonatomic) IBOutlet UILabel *usernameErrorLabel;
@property (nonatomic) IBOutlet UITextField *usernameTextField;
@property (nonatomic) IBOutlet UILabel *passwordErrorLabel;
@property (nonatomic) IBOutlet UITextField *password1Field;
@property (nonatomic) IBOutlet UITextField *password2Field;
@property (nonatomic) IBOutlet UIButton *signupButton;


- (void)startSignupWithUsername:(NSString *)username password:(NSString *)password;

@end

NS_ASSUME_NONNULL_END
