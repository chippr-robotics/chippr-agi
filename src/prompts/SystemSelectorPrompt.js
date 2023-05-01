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
    "Return a properly formated JSON object having the following format:",
   "```",
   "[",
   "  {",
   "      \"recommendedSystem\": \"string\",",
   "      \"justification\": \"string\",",
   "  },",
   "  ...",
   "]",
   "```",
   "where:",
   "'recommendedSystem' is the name of the system selected",
   "'justification' is why the system is the best fit",
   "",
   " Response:"
  ]
}