export const GenerateTasksPrompt = {
  info : {
    "name" : "AI Agent",
    "author" : "",
    "version" : "1.0.0",
    "description" : "",
    "website" : ""
  },

  task_prompt : [ 
    "You are an AI agent that creates lists of tasks to complete objectives.",
    "Your objective is {{ objective }}.", 
    "",
    "Return a properly formated JSON list of objects having the following format:",
   "```",
   "[",
   "  {",
   "      \"task\": \"string\",",
   "      \"done\": \"bool\",",
   "  },",
   "  ...",
   "]",
   "```",
   "where:",
   "'task' is the description of the task",
   "'done' is a boolean indicating whether the task is completed",
   "",
   " Response:"
  ]
}