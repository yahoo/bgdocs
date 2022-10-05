---
title: "Getting Started"
weight: 10
---

Using Behavior Graph is as simple as downloading it via your preferred format and importing it into your source.

## Downloading

### Maven Central

Behavior Graph is available on Maven Central @ [com.yahoo.behaviorgraph/bgjvm](https://search.maven.org/artifact/com.yahoo.behaviorgraph/bgjvm).

You may download the jar directly from there or you can include it as part of your Gradle or Maven project.

### Maven

Add a dependency in your pom.xml.

```xml
    <dependency>  
      <groupId>com.yahoo.behaviorgraph</groupId>  
      <artifactId>bgjvm</artifactId>  
      <version>0.7.0</version>  
    </dependency>  
```

### Gradle

You may add it as a dependency in your Gradle build.gradle file

```groovy
dependencies {
    implementation 'com.yahoo.behaviorgraph:bgjvm:0.7.0'
}
```

### GitHub
Behavior Graph is available in source form via Github @ [yahoo/bgkotlin](https://github.com/yahoo/bgkotlin).

## Importing

You can import the Behavior Graph classes using normal Java import syntax

```java
import behaviorgraph.*;
```

## Kotlin

Behavior Graph is written in Kotlin but the API has been designed to be usable with both Java and Kotlin.

## Tutorials

It is unlikely you will get very far with Behavior Graph without working through a [tutorial]({{< ref "tutorial-1" >}}).
Please spend some time with them to practice writing Behavior Graph code.
They don't take very long. We promise you will be mentally stimulated and spiritually rewarded for your time.
