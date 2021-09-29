import { Graph, InitialEvent } from './behaveg/behavegjs';
import { Behavior } from "./behaveg/behavior"
import { State, Moment } from "./behaveg/resource"
import { Extent } from "./behaveg/extent"

// tag::login_enable_extent[]
class LoginExtent extends Extent {
    email: State<string>;
    password: State<string>;
// end::login_enable_extent[]

    loggingIn: State<boolean>
    emailValid: State<boolean>
    passwordValid: State<boolean>
    loginEnabled: State<boolean>
    loginClick: Moment;
    returnKey: Moment;
    loginComplete: Moment<boolean>;

    // tag::login_enable_init[]
    constructor(graph: Graph) {
        super(graph);

        this.email = new State("", this);
        this.password = new State("", this);

    // tag::login_enable_behavior[]
        this.makeBehavior([this.email, this.password], [], (extent: LoginExtent) => {
    // end::login_enable_init[]
            const email = extent.email.value;
            const password = extent.password.value;
            const hasPassword = password.length > 0;
            const loginEnabled = extent.validEmailAddress(email) && hasPassword;
            extent.sideEffect('enable login button', (extent) => {
                extent.enableLoginButton(loginEnabled);
            });
        });
    // end::login_enable_behavior[]
    }

    constructorComplete(graph: Graph) {

        this.loggingIn = new State(false, this);
    
        // tag::login_complete_email[]
        this.emailValid = new State(false, this);
        this.makeBehavior([this.email], [this.emailValid], (extent: this) => {
            const email = extent.email.value;
            const emailValid = extent.validEmailAddress(email);
            extent.emailValid.update(emailValid, true);
        });
        // end::login_complete_email[]

        this.passwordValid = new State(false, this);
        this.makeBehavior([this.password], [this.passwordValid], (extent: this) => {
            const password = extent.password.value;
            const passwordValid = password.length > 0;
            extent.passwordValid.update(passwordValid, true);
        });
        
        // tag::login_complete_enable[]
        this.loginEnabled = new State(false, this);
        this.makeBehavior([this.emailValid, this.passwordValid, this.loggingIn], [this.loginEnabled], (extent: this) => {
            const enabled = extent.emailValid.value && extent.passwordValid.value && !extent.loggingIn.value;
            extent.loginEnabled.update(enabled, true);
            extent.sideEffect('enable login button', (extent: this) => {
                extent.enableLoginButton(extent.loginEnabled.value);
            });
        });
        // end::login_complete_enable[]
    
        // tag::login_complete_login[]
        this.loginClick = new Moment(this);
        this.returnKey = new Moment(this);
        this.loginComplete = new Moment(this);
        this.makeBehavior([this.loginClick, this.returnKey, this.loginComplete], [this.loggingIn], (extent: this) => {
            if ((extent.loginClick.justUpdated || extent.returnKey.justUpdated) &&
                extent.loginEnabled.traceValue) {
                // Start login
                extent.loggingIn.update(true, true);
            } else if (extent.loginComplete.justUpdated &&
                       !extent.loginComplete.value &&
                       extent.loggingIn.value) {
                // Login failed
                extent.loggingIn.update(false, true);
            }
    
            if (extent.loggingIn.justUpdatedTo(true)) {
                extent.sideEffect('login api call', (extent: this) => {
                    extent.doLogin(extent.email.value, extent.password.value, (success: boolean) => {
                        extent.action('login call returned', () => {
                            extent.loginComplete.update(success);
                        });
                    });
                });
            }
        });
        // end::login_complete_login[]

        // Dont delete; its used in the documentation
        // this has an example of requireSync
        /*
        this.makeBehavior([this.loginClick, this.returnKey, this.loginComplete], [this.loggingIn], (extent: this) => {
            if ((extent.loginClick.justUpdated || extent.returnKey.justUpdated) &&
                extent.loginEnabled.traced.value) {
                // Start login
                extent.loggingIn.update(true, true);
            } else if (extent.loginComplete.justUpdated &&
                    !extent.loginComplete.value &&
                    extent.loggingIn.value) {
                // Login failed
                extent.loggingIn.update(false, true);
            }

            if (extent.loggingIn.justUpdatedTo(true)) {
                // tag::login_complete_loginalt[]
                extent.sideEffect('login api call', (extent: this) => {
                    extent.doLogin(extent.email.value, extent.password.value, (success: boolean) => {
                        extent.actionAsync('login call returned', () => {
                            extent.loginComplete.update(success);
                        });
                    });
                });
                // end::login_complete_loginalt[]
            }
        });
        */
 

    }

    constructorShort(graph) {

        // tag::login_intro_short1[]
        makeBehavior([email, password], [loginEnabled], (extent) => {

            const emailValid = validEmailAddress(email.value);
            const passwordValid = password.value.length > 0;
            const enabled = emailValid && passwordValid;
            loginEnabled.update(enabled);

        });
        // end::login_intro_short1[]
        
        
        // tag::login_intro_short2[]
        makeBehavior([loginClick], [loggingIn], (extent) => {
            if (loginClick.justUpdated && !loggingIn.value) {
                loggingIn.update(true);
            }
        });

        makeBehavior([email, password, loggingIn], [loginEnabled], (extent) => {

            const emailValid = validEmailAddress(email.value);
            const passwordValid = password.value.length > 0;
            const enabled = emailValid && passwordValid & !loggingIn.value;
            loginEnabled.update(enabled);

        });
        // end::login_intro_short2[]

        // tag::login_intro_action[]
        loginButton.onClick = () => {
            action("login button clicked", () => {
                loginClick.update();
            });
        };
        // end::login_intro_action[]

        // tag::login_intro_sideeffect[]
        makeBehavior([email, password, loggingIn], [loginEnabled], (extent) => {

            const emailValid = validEmailAddress(email.value);
            const passwordValid = password.value.length > 0;
            const enabled = emailValid && passwordValid & !loggingIn.value;
            loginEnabled.update(enabled);
            
            extent.sideEffect("login button enabled", (extent) => {
                loginButton.enabled = loginEnabled.value;
            });

        });
        // end::login_intro_sideeffect[]
    
    }

    constructorCompleteShort(graph: Graph) {

        // tag::login_complete_short[]
        this.email = new State(this, "");
        this.password = new State(this, "");
        this.loggingIn = new State(this, false);
    
        this.loginEnabled = new State(this, false);
        this.makeBehavior([this.email, this.password, this.loggingIn], 
                          [this.loginEnabled], 
                          (extent: this) => {
            const emailValid = extent.validEmailAddress(this.email.value);
            const passwordValid = extent.password.value.length > 0;
            const enabled = emailValid && passwordValid && !extent.loggingIn.value;
            extent.loginEnabled.update(enabled, true);
            extent.sideEffect('enable login button', (extent: this) => {
                extent.enableLoginButton(extent.loginEnabled.value);
            });
        });
    
        this.loginClick = new Moment(this);
        this.loginComplete = new Moment(this);
        this.makeBehavior([this.loginClick, this.loginComplete], 
                          [this.loggingIn], 
                          (extent: this) => {
            if (extent.loginClick.justUpdated &&
                extent.loginEnabled.traceValue) {
                // Start login
                extent.loggingIn.update(true, true);
            } else if (extent.loginComplete.justUpdated &&
                       !extent.loginComplete.value &&
                       extent.loggingIn.value) {
                // Login failed
                extent.loggingIn.update(false, true);
            }
    
            if (extent.loggingIn.justUpdatedTo(true)) {
                extent.sideEffect('login api call', (extent: this) => {
                    extent.doLogin(extent.email.value, extent.password.value, (success: boolean) => {
                        extent.actionAsync('login call returned', () => {
                            extent.loginComplete.update(success);
                        });
                    });
                });
            }
        });
        // end::login_complete_short[]
    }

    validEmailAddress(email: string) : boolean {
        return email.length > 0 && email.includes('@');
    }

    doLogin(email: string, password: string, complete: (boolean) => void) {
       // login api calls
    };

    enableLoginButton(enabled: boolean) {
        // side effect to set the enabled state of the login button
    }

    // tag::login_sequence_compare[]
    emailChangedSincePassword() : boolean {
        return this.email.event.sequence > this.password.event.sequence;
    }
    // end::login_sequence_compare[]
    
    // tag::login_timestamp[]
    loginCompletedWhen() : Date {
        return this.loginComplete.event.timestamp;
    }
    // end::login_timestamp[]

}

class LoginPage {

    graph: Graph;
    loginExtent: LoginExtent;

    constructor() {
    // tag::login_enable_setup[]
        this.graph = new Graph();
        this.loginExtent = new LoginExtent(this.graph);
        this.graph.action('new login page', () => {
            this.loginExtent.addToGraph();
        });
    // end::login_enable_setup[]
    }
    
    // tag::login_enable_actions[]
    didUpdateEmailField(contents: string) {
        this.graph.action('update email field', () => {
            this.loginExtent.email.update(contents, true);
        });
    }

    didUpdatePasswordField(contents: string) {
        this.graph.action('update password field', () => {
            this.loginExtent.password.update(contents, true);
        });
    }
    // end::login_enable_actions[]
    
    // tag::login_complete_click[]
    loginButtonClicked() {
        this.graph.action('login button clicked', () => {
            this.loginExtent.loginClick.update();
        });
    }
    // end::login_complete_click[]
    

}
