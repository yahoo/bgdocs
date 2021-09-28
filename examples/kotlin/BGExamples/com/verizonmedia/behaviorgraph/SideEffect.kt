package com.verizonmedia.behaviorgraph

data class SideEffect(val debugName: String?, val block: (extent: Extent<*>) -> Unit, val extent: Extent<*>) //todo contrain Extent more than "*"?
