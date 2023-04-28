## System Flow
```mermaid
graph TD
    A(User) -- objective --> B(EntityCreationSystem)
    C -- tasks, parent --> B
    B -- parent --> C(TaskParentSystem)
    B -- entity --> D(System Selection System)
    D -- systemselected --> F(task creator)
    D -- systemselected --> G(image creator)
    D -- systemselected --> H(internet Search)
    D -- systemselected --> I(task expander)
    F -- tasks --> B
    G -- taskCompleted --> J(The Judge)
    H -- taskCompleted --> J
    I -- taskCompleted --> J
    J --> K[task completed]
    K -- yes --> L(TaskCompletionSystem_TBD)
    K -- no --> D

