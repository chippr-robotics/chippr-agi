export const SystemSelectorPrompt = {
  info : {
    "name" : "AI Agent",
    "author" : "",
    "version" : "1.0.0",
    "description" : "",
    "website" : ""
  },
  
  task_prompt : [ 
    "Given the task description \" {{ taskDescription }} \",", 
    "Which of the following systems would be the best to handle it:",
    "{{ systemDescriptions }}",
    "",
    "The best system for this task is: " 
  ]
}