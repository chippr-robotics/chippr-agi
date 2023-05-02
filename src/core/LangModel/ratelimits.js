export const rateLimitsConfig = {
    openAI_Free: {
        embeddings: 3,
        completion: 3,
        chat: 3,
        codex: 3,
        edit: 3,
        image: 5,
        audio: 3, 
    },
    openAI_Pay: {
        embeddings: 3500,
        completion: 3500,
        chat: 3500,
        codex: 20,
        edit: 20,
        image: 50,
        audio: 50,
    },   
}