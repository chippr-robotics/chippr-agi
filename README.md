![You are a designer tasked with creating a simple, line art mascot for the Chippr-AGI open-source framework. The mascot should be a small robotic chipmunk with a single round eye. The chipmunk should have a rectangular body with rounded edges, and its limbs should be thin, straight lines. The tail should be a thin curved line, and the whole design should be in a single color of your choice. The mascot should convey the intelligence and efficiency of the software, while still being approachable and friendly. Once you have created the mascot, submit it as a PNG file with a transparent background.
](docs/chipprAGI.png )

# Chippr-AGI

Chippr-AGI is an open-source event-driven ECS framework that uses AI models to automate task creation and prioritization. This system is designed to run solo or as a swarm of containers. It combines the power of GPT-4 with actor-critic reinforcement learning to optimize the order and allocation of tasks for a given objective.  

## This repo is under active development, clone often or use the docker image

## Getting Started
### Github
- Clone the repository:` git clone https://github.com/chippr-robotics/chippr-agi.git`
- Install the dependencies: `npm install`
- Create a `.env` file with your OpenAI API key and Redis credentials.
- Update the OBJECTIVE
- start redis
- Start the application: `npm start`


### Docker( Easier )
#### Pull the Image

First, pull the Chippr-AGI Docker image from Docker Hub:
```
docker pull chipprbots/chippr-agi:latest
```

#### Run the Container

To run the Chippr-AGI container, you'll need to set up environment variables for your OpenAI API key and Redis credentials. Create a `.env` file with the following variables:
```
#redis setup
AGENT_ID="SOMETHING_CLEVER"
INDEX_NAME='vectorDB'
REDIS_URL="redis://REDISIP:6379"

# Language model setup
OPENAI_API_KEY="YOURKEY"
MODEL="text-davinci-003"
DEFAULT_TEMP=0.5
MAX_TOKEN_LENGTH=100
MATCH_LENGTH=3

# update this if needed....
OBJECTIVE="Write a best selling novel about a robot detective."
```


Replace `your_api_key`, `your_redis_host`, `your_redis_port`, and `your_redis_password` with your actual values.

Now, run the container with the following command:

```
docker run -d --name chippr-agi --env-file .env  chipprbots/chippr-agi:latest
```

This will start the Chippr-AGI container in detached mode and load the environment variables from the `.env` file.

### Docker-compose (Best)
#### Update the docker-compose.yml

Use the Docker compose file in the `docker` folder 


--- 

**Dev Updates**
moved to docs

---

## Basic Flow
Chippr-AGI uses a combination of GPT-4 for generating task descriptions and actor-critic reinforcement learning to prioritize the tasks based on their estimated rewards. The framework is built using Node.js and Redis to store embeddings for quick query and update.

Tasks are generated based on the current context and objective, which are passed into a customizable prompt template. The prompts are stored in a YAML file and can be easily edited to fit specific needs. Once a task is generated, its dependencies are added to the task list and prioritized based on their estimated reward.

After a task is completed, the system checks if any new tasks need to be generated based on the success of the previous task. The prioritization process is repeated until all tasks are completed and the objective is achieved.

```mermaid
graph TD
  A(Objective) --> B(Get Next Task)
  B --> C[Get Context Embedding]
  C --> D(Fill Prompt with Context)
  D --> E[Execute Task]
  E --> N(Save Task Embedding in Redis)
  N --> F{Task Completed?}
  F -- Yes --> G(Mark Task as Done)
  F -- No --> H(Fill Prompt with context)
  H --> M(Generate New Tasks)
  M --> J{All Tasks Complete?}
  G --> J
  J -- Yes --> K(Objective Complete)
  J -- No --> L(Prioritize Tasks)
  L --> B
```

## ECS task lifecycle

```mermaid
graph TB
  A[Objective]
  A --> B[Generate Initial Tasks]
  B --> C[Store Tasks as Entities with Components]
  C --> D[Emit Event to Prioritize Tasks]
  D -->|Event| E[System: Task Prioritization]
  E --> F[Update Task Priorities]
  F --> G[Emit Event to Execute Next Task]
  G -->|Event| H[System: Task Execution]
  H --> I[Execute Task based on Components]
  I --> J[Store Task Result]
  J --> K[Mark Task as Done]
  K --> L[Check if Objective is Complete]
  L -->|No| M[Emit Event to Generate New Tasks]
  M -->|Event| N[System: Task Generation]
  N --> O[Generate New Tasks based on Components]
  O --> P[Store New Tasks as Entities with Components]
  P --> D
  L -->|Yes| Q[Objective Complete]

```

In this flowchart:

The objective is used to generate the initial tasks.
Tasks are stored as entities with associated components.
An event is emitted to prioritize tasks, which is handled by the Task Prioritization system.
Task priorities are updated based on the system's logic.
An event is emitted to execute the next task, which is handled by the Task Execution system.
The task is executed based on the relevant components.
The result of the task is stored, and the task is marked as done.
The system checks if the objective is complete.
If the objective is not complete, an event is emitted to generate new tasks, which is handled by the Task Generation system.
New tasks are generated based on the components and the previous task's result.
The new tasks are stored as entities with components, and the process repeats from step 3.

## ECS events
The ChipprAGI class emits an event using the EventEmitter.
The EventEmitter distributes the event to all registered systems.
Each system handles the event if it's relevant to that system.
The system performs its specific action based on the event and updates the relevant components.
This diagram shows a high-level overview of how events are propagated through the ChipprAGI system and how systems handle and react to events.

```mermaid
graph TD
  A(ChipprAGI) -->|Emit event| B(EventEmitter)
  B -->|Distribute event| C(System 1)
  B -->|Distribute event| D(System 2)
  B -->|Distribute event| E(System N)
  C -->|Handle event| F(Perform System 1 specific action)
  D -->|Handle event| G(Perform System 2 specific action)
  E -->|Handle event| H(Perform System N specific action)
  F --> I(Update relevant components)
  G --> J(Update relevant components)
  H --> K(Update relevant components)

```






## Contributing
We welcome contributions from the community. If you'd like to contribute to Chippr-AGI, please fork the repository and submit a pull request. We recommend discussing your ideas with the community in the issues section before starting any major work.

## License
This project is licensed under the APACHE-2.0 License. See the LICENSE file for more details.