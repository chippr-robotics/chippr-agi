export const TaskExpanderPrompt = {
  info : {
    "name" : "AI Agent",
    "author" : "",
    "version" : "1.0.0",
    "description" : "",
    "website" : ""
  },
  
  task_prompt : [ 
    "Given the task description \" {{ taskDescription }} \",", 
    "provide a narative describing the task in detail. If possible your response should complete the task. ",
    "",
    "Return a properly formated JSON object having the following format:",
   "```",
   "[",
   "  {",
   "      \"taskDescription\": \"string\",",
   "      \"justification\": \"string\",",
   "  },",
   "  ...",
   "]",
   "```",
   "where:",
   "'taskDescription' is the expanded text for the task",
   "'justification' is why the text helps complete the task",
   "",
   " Response:"
  ]
}