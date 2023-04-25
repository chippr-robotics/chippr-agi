## System Flow
```mermaid
graph TD
    A(User) -- objective --> B(EntityCreationSystem)
    B -- entity --> C(generate Tasks)
    C -- tasks, parent --> B
    B -- entity --> D(System Selection System)
    B -- parent --> E(TaskParentSystem)
    D -- systemselected --> C
    D -- systemselected --> F
    D -- systemselected --> G
    D -- systemselected --> H
    D -- systemselected --> I
    F -- taskCompleted --> J(The Judge)
    G -- taskCompleted --> J
    H -- taskCompleted --> J
    I -- taskCompleted --> J
    J --> K[task completed]
    K -- yes --> L(TaskCompletionSystem_TBD)
    K -- no --> D

