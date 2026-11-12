import 'dotenv/config'
import { Anthropic } from '@anthropic-ai/sdk/client.js'

const client = new Anthropic()

const res = await client.messages.create({ 
    model: 'claude-sonnet-5-5',
    max_tokens: 100,
    messages: [{ role: 'user', content: 'Say hello to a chess beginner in one sentence'}],
})

console.log(res.content[0].text)
console.log(res.usage)