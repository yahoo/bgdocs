package com.verizonmedia.behaviorgraph.exception

import com.verizonmedia.behaviorgraph.Extent

class ExtentsCanOnlyBeAddedDuringAnEventException(s: String, val extent: Extent<*>) : BehaviorGraphException("$s Extent=$extent")

