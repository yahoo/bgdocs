package com.verizonmedia.behaviorgraph.exception

import com.verizonmedia.behaviorgraph.Behavior
import com.verizonmedia.behaviorgraph.Resource

class ResourceCannotBeSuppliedByMoreThanOneBehaviorException(s: String, val alreadySupplied: Resource, val desiredSupplier: Behavior) : BehaviorGraphException("$s alreadySupplied=$alreadySupplied desiredSupplier=$desiredSupplier")
