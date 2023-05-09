---
layout: default
lang: en
title: "Chippr-AGI Entity Lifecycle"
permalink: /Start_here/Entities
parent: startHere 
description: "The lifecycle of an entity in Chippr-AGI consists of several stages, including creation, component addition and removal, updating, and deletion. This document will guide you through each stage, describing the processes involved and the interactions between entities, components, and systems in the Chippr-AGI architecture."
---

## 1. Entity Creation

Entities are created as lightweight, unique identifiers representing individual objects in the Chippr-AGI system. An entity can *be* anything(a task, an objective, a thought) since everything is an entity; an entities *components* define what it is. To create a new entity, follow these steps:

1. Instantiate a new entity by assigning a unique identifier (e.g., UUID) using the `ChipprAGI.createEntity()` method.
2. Add the necessary components to define the entity's properties and behaviors (see Component Addition below).

```javascript
const entityId = ChipprAGI.createEntity();
```

## 2. Component Addition

Components store the properties and state of an entity. To add a component to an entity, use the `ChipprAGI.addComponent(entityId, componentName, componentData)` method, passing the entity ID, the name of the component, and an object containing the component's data.

```javascript
ChipprAGI.addComponent(entityId, 'TaskDescription', { task: 'some task description', reward: 5 });
```

When a component is added to an entity, the following actions occur:

1. The component data is attached to the entity.
2. The `init()` method of the component (if defined) is called, allowing for component-specific initialization.
3. An event is emitted to notify relevant systems of the component addition (e.g., `componentAdded:TaskDescription`).

Systems that have registered event listeners for the specific component addition event can react accordingly, updating their internal state or processing the entity as needed.

## 3. Updating Entities

Entities are updated by *systems* that process and modify their *components*. Each *system* operates on a set of *entities* with *specific component requirements*. To update entities, follow these steps:

1. Register systems to the main Chippr-AGI class using the `ChipprAGI.registerSystem(systemName, systemDefinition)` method.
2. Implement the `update()` method in each system, processing entities with the required components.

```javascript
ChipprAGI.registerSystem('TaskExecutionSystem', {
  update: function () {
    // Process entities with the required components
  },
});
```

Systems are executed in the order they are registered, ensuring that dependencies between systems are properly managed.

## 4. Component Removal

Components can be removed from entities using the `ChipprAGI.removeComponent(entityId, componentName)` method, passing the entity ID and the name of the component to remove.

```javascript
ChipprAGI.removeComponent(entityId, 'TaskDescription');
```

When a component is removed from an entity, the following actions occur:

1. The `remove()` method of the component (if defined) is called, allowing for component-specific cleanup.
2. The component data is detached from the entity.
3. An event is emitted to notify relevant systems of the component removal (e.g., `componentRemoved:TaskDescription`).

Systems that have registered event listeners for the specific component removal event can react accordingly, updating their internal state or ceasing to process the entity as needed.

## 5. Entity Deletion

Entities can be deleted using the `ChipprAGI.deleteEntity(entityId)` method, passing the entity ID to delete.

```javascript
ChipprAGI.deleteEntity(entityId);
```

When an entity is deleted, the following actions occur:

1. All components are removed from the entity (see Component Removal above).
2. The entity is removed from the Chippr-AGI system.
3. An event is emitted to3. An event is emitted to notify relevant systems of the entity deletion (e.g., `entityDeleted`).

Systems that have registered event listeners for the specific entity deletion event can react accordingly, updating their internal state or ceasing to process the entity as needed.

## Summary

In Chippr-AGI, entities have a clear lifecycle that involves creation, component addition and removal, updating, and deletion. By understanding and following these stages, you can effectively manage the interactions between entities, components, and systems within the Chippr-AGI architecture.

Remember to always update entities through their components and leverage the event-driven nature of the system to ensure that relevant systems are aware of changes in entities and components. This approach will help maintain a flexible and modular architecture, allowing for easy addition and removal of components and systems as needed.