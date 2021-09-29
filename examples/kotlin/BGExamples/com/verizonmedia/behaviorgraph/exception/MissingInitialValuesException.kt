package com.verizonmedia.behaviorgraph.exception

import com.verizonmedia.behaviorgraph.Resource

class MissingInitialValuesException(s: String, val resource: Resource) : BehaviorGraphException("$s Resource=$resource")
