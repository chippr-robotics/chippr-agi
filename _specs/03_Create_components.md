---
layout: default
lang: en
title: "3. Creating the Components"
permalink: /walkthrough/create_components
parent: walkThrough 
description: "In this section, we will create two components for our entity. Let's assume we are creating an entity that represents a simple task with a title and a status."
---

## 3.1. TaskTitle Component

Create a new file called `TaskTitle.js` inside the `src/components/` directory and add the following code:

```javascript
import { CHIPPRAGI } from 'chippr-agi';

CHIPPRAGI.registerComponent('TaskTitle', {
  schema: {
    title: { type: 'string', default: 'Untitled Task' },
  },

  init: function() {
    // Do something when the component is first attached
  },

  update: function() {
    // Do something when the component's data is updated
  },

  remove: function() {
    // Do something when the component or its entity is detached
  },
});
```

This component has a single property called `title` of type `string` with a default value of 'Untitled Task'.

## 3.2. TaskStatus Component

Create a new file called `TaskStatus.js` inside the `src/components/` directory and add the following code:

```javascript
import { CHIPPRAGI } from 'chippr-agi';

CHIPPRAGI.registerComponent('TaskStatus', {
  schema: {
    status: { type: 'string', default: 'Incomplete' },
  },

  init: function() {
    // Do something when the component is first attached
  },

  update: function() {
    // Do something when the component's data is updated
  },

  remove: function() {
    // Do something when the component or its entity is detached
  },
});
```

This component has a single property called `status` of type `string` with a default value of 'Incomplete'.

With both components created, we can now proceed to create an entity that uses these components.
```
