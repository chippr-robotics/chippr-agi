# 2. Setting up the Project

Before we start creating our entity and its components, let's set up the project by following the steps below.

## 2.1. Prerequisites

Ensure you have the following installed on your machine:

- Node.js (v14 or higher)
- npm (v6 or higher)
- A code editor (e.g., Visual Studio Code)

## 2.2. Create a New Project

1. Open your terminal and navigate to the directory where you want to create the project.

2. Run the following command to create a new directory called `chippr-agi-tutorial` and navigate to it:

   ```
   mkdir chippr-agi-tutorial && cd chippr-agi-tutorial
   ```

3. Initialize the project by running the following command:

   ```
   npm init -y
   ```

   This will create a `package.json` file in the project directory with default values.

## 2.3. Install Dependencies

We need to install ChipprAGI as a dependency for our project. Run the following command in your terminal:

```
npm install chippr-agi
```

## 2.4. Create Project Structure

Create the following directory structure for the project:

```
chippr-agi-tutorial/
│
├── src/
│   ├── components/
│   ├── entities/
│   └── systems/
│
├── package.json
└── .gitignore
```

You can create these directories and files manually or use the terminal:

```
mkdir src && mkdir src/components src/entities src/systems
touch .gitignore
```

Add the following to your `.gitignore` file:

```
node_modules/
```

## 2.5. ChipprAGI Configuration

In your `src` directory, create a new file called `main.js`. This file will serve as the entry point for our project and will configure ChipprAGI.

Paste the following code into `main.js`:

```javascript
import { ChipprAGI } from 'chippr-agi';

// Initialize ChipprAGI
const chipprAGI = new ChipprAGI();

// Load systems and components
chipprAGI.loadSystems('./systems/');
chipprAGI.loadComponents('./components/');

// Start ChipprAGI
chipprAGI.start();
```

Now that our project is set up, we can proceed to create our entity, components, and systems.
```
