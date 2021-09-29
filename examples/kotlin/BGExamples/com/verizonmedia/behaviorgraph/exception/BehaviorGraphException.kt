package com.verizonmedia.behaviorgraph.exception

open class BehaviorGraphException : RuntimeException {
    constructor(message: String, ex: Exception?): super(message, ex)
    constructor(message: String): super(message)
    constructor(ex: Exception): super(ex)
}
