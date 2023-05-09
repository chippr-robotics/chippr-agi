---
layout: default
lang: en
title: "4. Creating an Entity with Components"
permalink: /walkthrough/create
parent: walkThrough 
description: "Now that we have created our components, let's create an entity that uses the `TaskTitle` and `TaskStatus` components. We will also create a system to manage the task entities."
---

## 4.1. Creating a Task Entity

In the `src/` directory, create a new file called `createTaskEntity.js` and add the following code:

```javascript
import { CHIPPRAGI } from 'chippr-agi';

export function createTaskEntity(title, status) {
  // Create a new entity
  const entity = CHIPPRAGI.createEntity();

  // Add the TaskTitle component to the entity
  CHIPPRAGI.addComponent(entity, 'TaskTitle', { title });

  // Add the TaskStatus component to the entity
  CHIPPRAGI.addComponent(entity, 'TaskStatus', { status });

  // Return the created entity
  return entity;
}
```

This function takes a `title` and `status` as arguments and creates a new entity with the `TaskTitle` and `TaskStatus` components.

## 4.2. Creating a Task System

Create a new file called `TaskSystem.js` inside the `src/systems/` directory and add the following code:

```javascript
import { CHIPPRAGI } from 'chippr-agi';

CHIPPRAGI.registerSystem('TaskSystem', {
  info: {
    version: "1.0.0",
    license: "Apache-2.0",
    developer: "Your Name",
    description: "A system to manage task entities",
  },

  init: function() {
    // Initialize the system
  },

  update: function(entityId, componentData) {
    // Handle updates to the entity's components
  },

  remove: function(entityId) {
    // Handle the removal of the entity or its components
  },

  tick: function(entityId, time, timeDelta) {
    // Handle tasks on every tick or frame
  },
});

```

This system will be responsible for managing task entities and their related components.

Now you have a working example of creating an entity with two components and a system to manage them. You can further expand this example to add more functionality, such as updating the task status, deleting tasks, or handling task-related events.
```