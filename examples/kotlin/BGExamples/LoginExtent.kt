import com.yahoo.behaviorgraph.Extent
import com.yahoo.behaviorgraph.Graph
import com.yahoo.behaviorgraph.Moment
import com.yahoo.behaviorgraph.State

// tag::login_enable_extent[]
class LoginExtent(graph: Graph) : Extent<LoginExtent>(graph) {
    val email: State<String>
    val password: State<String>
// end::login_enable_extent[]

    val loggingIn = State<Boolean>(this, false)
    val emailValid =  State(this, false)
    val passwordValid = State(this, false)
    val loginEnabled = State(this, false)
    val loginClick = Moment<Unit>(this)
    val returnKey = Moment<Unit>(this)
    val loginComplete = Moment<Boolean>(this)

    // tag::login_enable_init[]
    init {

        this.email = State(this, "")
        this.password = State(this, "")

        // tag::login_enable_behavior[]
        this.makeBehavior(listOf(email, password), null) { loginExtent ->
            // end::login_enable_init[]
            val email = loginExtent.email.value
            val password2: String = loginExtent.password.value
            val hasPassword = password2.length > 0
            val loginEnabled = loginExtent.validEmailAddress(email) && hasPassword
            loginExtent.sideEffect("enable login button")  {
                loginExtent.enableLoginButton(loginEnabled)
            }
        }
        // end::login_enable_behavior[]
    }


    fun validEmailAddress(email: String) : Boolean {
        return (email.length > 0) && email.includes('@')
    }

    fun doLogin(email: String, password: String, complete: (Boolean) -> Unit) {
       // login api calls
    }

    fun enableLoginButton(enabled: Boolean) {
        // side effect to set the enabled state of the login button
    }

    // tag::login_sequence_compare[]
    fun emailChangedSincePassword() : Boolean {
        return this.email.event.sequence > this.password.event.sequence
    }
    // end::login_sequence_compare[]
    
    // tag::login_timestamp[]
    fun loginCompletedWhen() : Long {
        return this.loginComplete.event!!.timestamp
    }
    // end::login_timestamp[]


}
class LoginCompleteExtent(graph: Graph) : Extent<LoginCompleteExtent>(graph) {
    val email = State(this, "")
    val password = State(this, "")

    val loggingIn = State<Boolean>(this, false)
    val emailValid =  State(this, false)
    val passwordValid = State(this, false)

    //begin complete constructor

    init {

        // tag::login_complete_email[]
       val emailValid =  State(this, false)
        makeBehavior(listOf(email), listOf(emailValid)) { loginExtent ->
            val email = loginExtent.email.value
            val emailValid = loginExtent.validEmailAddress(email)
            loginExtent.emailValid.update(emailValid, true)
        }
        // end::login_complete_email[]

        makeBehavior(listOf(password), listOf(passwordValid)) { loginExtent ->
            val password = loginExtent.password.value
            val passwordValid = password.length > 0
            loginExtent.passwordValid.update(passwordValid, true)
        }

        // tag::login_complete_enable[]
        val loginEnabled = State(this, false)
        makeBehavior(listOf(emailValid, passwordValid, loggingIn), listOf(loginEnabled)) { loginExtent ->
            val enabled = loginExtent.emailValid.value && loginExtent.passwordValid.value && !loginExtent.loggingIn.value;
            loginExtent.loginEnabled.update(enabled, true);
            loginExtent.sideEffect("enable login button") { loginExtent ->
                loginExtent.enableLoginButton(loginExtent.loginEnabled.value);
            }
        }
        // end::login_complete_enable[]

        // tag::login_complete_login[]
        val loginClick = Moment<Unit>(this)
        val returnKey = Moment<Unit>(this)
        val loginComplete = Moment<Boolean>(this)
        makeBehavior(listOf(loginClick, returnKey, loginComplete), listOf(this.loggingIn)) { loginExtent ->
            if ((loginExtent.loginClick.justUpdated || loginExtent.returnKey.justUpdated) &&
                    loginExtent.loginEnabled.traceValue) {
                // Start login
                loginExtent.loggingIn.update(true, true);
            } else if (loginExtent.loginComplete.justUpdated &&
                    !loginExtent.loginComplete.value &&
                    loginExtent.loggingIn.value) {
                // Login failed
                loginExtent.loggingIn.update(false, true);
            }

            if (loginExtent.loggingIn.justUpdatedTo(true)) {
                loginExtent.sideEffect("login api call") {
                    it.doLogin(it.email.value, it.password.value) { success ->
                        it.action("login call returned") {
                            it.loginComplete.update(success);
                        }
                    }
                }
            }
        }
        // end::login_complete_login[]

        // Dont delete; its used in the documentation
        // this has an example of requireSync
        /*
        makeBehavior(listOf(loginClick, returnKey, loginComplete), listOf(loggingIn)) { extent ->
            if ((extent.loginClick.justUpdated || extent.returnKey.justUpdated) &&
                extent.loginEnabled.traced.value) {
                // Start login
                extent.loggingIn.update(true, true)
            } else if (extent.loginComplete.justUpdated &&
                    !extent.loginComplete.value &&
                    extent.loggingIn.value) {
                // Login failed
                extent.loggingIn.update(false, true)
            }

            if (extent.loggingIn.justUpdatedTo(true)) {
                // tag::login_complete_loginalt[]
                extent.sideEffect("login api call") {
                    it.doLogin(extent.email.value, extent.password.value) { success ->
                        it.actionAsync("login call returned") {
                            it.loginComplete.update(success)
                        })
                    })
                })
                // end::login_complete_loginalt[]
            }
        })
        */

    }


    //end complete constructor


    fun validEmailAddress(email: String) : Boolean {
        return (email.length > 0) && email.includes('@')
    }

    fun doLogin(email: String, password: String, complete: (Boolean) -> Unit) {
        // login api calls
    }

    fun enableLoginButton(enabled: Boolean) {
        // side effect to set the enabled state of the login button
    }

}

class LoginShortExtent {
    val email = State(this, "")
    val password = State(this, "")

    val loggingIn = State<Boolean>(this, false)
    val emailValid =  State(this, false)
    val passwordValid = State(this, false)

    init {
        // tag::login_intro_short1[]
        makeBehavior(listOf(email, password), listOf(loginEnabled)) { extent ->

            val emailValid = extent.validEmailAddress(email.value)
            val passwordValid = extent.password.value.length > 0
            val enabled = emailValid && passwordValid
            extent.loginEnabled.update(enabled)

        };
        // end::login_intro_short1[]
        
        
        // tag::login_intro_short2[]
        makeBehavior(listOf(loginClick), listOf(loggingIn)) { extent ->

            if (extent.loginClick.justUpdated && !extent.loggingIn.value) {
                extent.loggingIn.update(true);
            }

        }

        makeBehavior(listOf(email, password, loggingIn), listOf(loginEnabled)) { extent ->

            val emailValid = extent.validEmailAddress(email.value)
            val passwordValid = extent.password.value.length > 0
            val enabled = emailValid && passwordValid && !extent.loggingIn.value
            extent.loginEnabled.update(enabled)

        };
        // end::login_intro_short2[]

        // tag::login_intro_sideeffect[]
        makeBehavior(listOf(email, password, loggingIn), listOf(loginEnabled)) { extent ->

            val emailValid = extent.validEmailAddress(email.value)
            val passwordValid = extent.password.value.length > 0
            val enabled = emailValid && passwordValid && !extent.loggingIn.value
            extent.loginEnabled.update(enabled)

            extent.sideEffect("login button enabled") { extent ->
                extent.loginButton.enabled = extent.loginEnabled.value;
            }
            
        };
        // end::login_intro_sideeffect[]

    }

    // tag::login_intro_action[]
    fun loginButtonClicked() {
        this.graph.action("login button clicked")  {
            this.loginClick.update(Unit)
        }
    }
    // end::login_intro_action[]

}

class LoginPage {

    val graph: Graph
    val loginExtent: LoginExtent

    init {
    // tag::login_enable_setup[]
        this.graph =  Graph()
        this.loginExtent = LoginExtent(graph)
        this.graph.action("new login page") {
            this.loginExtent.addToGraph()
        }
    // end::login_enable_setup[]
    }

    // tag::login_enable_actions[]
    fun didUpdateEmailField(contents: String) {
        this.graph.action("update email field") {
            this.loginExtent.email.update(contents, true)
        }
    }

    fun didUpdatePasswordField(contents: String) {
        this.graph.action("update password field") {
            this.loginExtent.password.update(contents, true)
        }
    }
    // end::login_enable_actions[]
    
    // tag::login_complete_click[]
    fun loginButtonClicked() {
        this.graph.action("login button clicked")  {
            this.loginExtent.loginClick.update(Unit)
        }
    }
    // end::login_complete_click[]
    

}
