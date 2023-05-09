---
layout: default
lang: en
title: "5. Final Steps and Testing"
permalink: /walkthrough/final
parent: walkThrough 
description: "After creating the components, entity, and system, we can now test our basic example to ensure everything works as expected."
---

## 5.1. Using the createTaskEntity Function

In your `src/index.js` file, import the `createTaskEntity` function and create a new task entity with a title and status:

```javascript
import { createTaskEntity } from './createTaskEntity';

const taskEntity = createTaskEntity('My First Task', 'In Progress');
console.log(`Created task entity: ${taskEntity}`);
```

## 5.2. Running the Project

In your terminal, navigate to your project folder and run the following command:

```bash
npm start
```

This command will start your project, and you should see output similar to the following:

```
Created task entity: 1
```

This confirms that your project is set up correctly, and you have successfully created an entity with the `TaskTitle` and `TaskStatus` components.

## 5.3. Expanding the Example

Now that you have a basic understanding of how to create entities, components, and systems in Chippr-AGI, you can expand this example to include more functionality, such as:

- Adding more components or systems to manage different aspects of the tasks.
- Implementing events to handle task-related actions, such as updating the status or deleting tasks.
- Integrating the example with a storage system, such as a database, to persist task information.

The possibilities are endless, and the flexible nature of the ECS architecture allows you to easily expand your project as needed.
```

With this walk-through, users will be able to understand the basics of Chippr-AGI, create simple components, entities, and systems, and start exploring the full potential of the ECS architecture.