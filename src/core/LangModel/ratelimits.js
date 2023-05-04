export const rateLimitsConfig = {
    huggingface_Free: {
        embeddings: 3000,
        completion: 3000,
        chat: 3000,
        codex: 3000,
        edit: 3000,
        image: 3000,
        audio: 3000, 
    },
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