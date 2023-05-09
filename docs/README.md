### Entities: 
Continue using tasks as entities in your system. Each task will have a unique task_id, which you already generate using the first 10 bytes of the SHA256 hash of the task string.

### Components: 
Break down the data related to tasks into components. Based on the provided prompts, you can have components like:

- TaskDescription
- TaskReward
- TaskStatus (done)
- TaskDependencies
- TaskState
- TaskAction
- TaskActionProbability
- TaskNextState
- TaskRewardForAction

### Systems: 
Create systems to handle the logic for your tasks. Based on the current workflow, we can create the following systems:

- TaskExecutionSystem: Handles the execution of the task based on the current state and active task. You can utilize the execution_prompt to generate the AI response and update the task state accordingly.
- TaskCreationSystem: Handles the creation of new tasks using the task_prompt. This system can generate new tasks based on the objective, last completed task, and incomplete tasks. It will also estimate rewards and probabilities for the new tasks.
- TaskDependencySystem: Manages the dependencies between tasks to ensure that they are completed in the correct order.
- TaskPrioritySystem: Prioritizes tasks based on their estimated rewards and other factors, like dependencies.
- Storing Components: You mentioned that you're using Redis to store tasks and their embeddings. You can continue to do so, but you'll need to adapt your storage to accommodate the new component-based structure. Each component should be stored independently in Redis, using a unique key that combines the task_id and the component type, e.g., taskid:TaskDescription. This will allow you to efficiently access and update specific components as needed.

### Updating Prompts: 
Modify the YAML prompts to reflect the changes in the architecture. When you use a prompt, replace the variables with the corresponding components, e.g., {{ activeTask }} should be replaced with the TaskDescription component for the current task.