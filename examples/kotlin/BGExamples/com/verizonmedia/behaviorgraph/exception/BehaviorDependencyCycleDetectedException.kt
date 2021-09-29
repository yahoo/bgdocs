package com.verizonmedia.behaviorgraph.exception

import com.verizonmedia.behaviorgraph.Behavior
import com.verizonmedia.behaviorgraph.Resource

class BehaviorDependencyCycleDetectedException(s: String, val behavior: Behavior, val cycle: List<Resource>) : BehaviorGraphException("$s Behavior=$behavior")

