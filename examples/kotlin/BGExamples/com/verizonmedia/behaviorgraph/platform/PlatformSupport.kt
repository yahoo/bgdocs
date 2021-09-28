package com.verizonmedia.behaviorgraph.platform

interface PlatformSupport {
    fun isMainThread(): Boolean
    fun getCurrentTimeMillis(): Long
    fun now() = getCurrentTimeMillis()

    companion object {
        lateinit var platformSupport: PlatformSupport
    }
}
