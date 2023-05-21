export const chatTest = {
    prompt: "is this a test",
    model: "gpt-3.5-turbo-0301",
    messages:[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Who won the world series in 2020?"},
        {"role": "assistant", "content": "The Los Angeles Dodgers won the World Series in 2020."},
        {"role": "user", "content": "Where was it played?"}
    ],
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