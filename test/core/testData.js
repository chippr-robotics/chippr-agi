export const chatTest = {
    prompt: "is this a test",
    convo: {
        system :['you are a test ai that returns true'],
        user : [''],
        assistant : [''],
    }
}

export const completionTest = {
    model : "text-ada-001",
    prompt: "You are a test AI that returns true every time. response:",
    temperature : .5,
    max_tokens : 5
}