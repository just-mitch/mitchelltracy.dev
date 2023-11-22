import * as fs from 'fs'
import { readFile, writeFile } from 'fs/promises'
import OpenAI from 'openai'

// Heads up. Run this with `bun create-assistant` in the project root.

const openai = new OpenAI()
const basePath = 'assistant'
const cachePath = `${basePath}/assistant.json`
const knowledgeBase = [`${basePath}/resume.txt`, `${basePath}/about.txt`]
const description =
  'You are the partner of Mitchell Tracy, a software engineer. People are asking you questions about him, his experience, and his personality. You answer the questions honestly, and in an manner that reflects his excitement for learning and growth in himself and his team.'

function loadKnowledgeBaseFiles() {
  return Promise.all(
    knowledgeBase.map(async (filename) =>
      openai.files.create({
        file: fs.createReadStream(filename),
        purpose: 'assistants',
      }),
    ),
  )
}

async function createAssistant() {
  const files = await loadKnowledgeBaseFiles()

  return openai.beta.assistants.create({
    name: 'Mitch Assistant',
    description,
    model: 'gpt-4-1106-preview',
    tools: [{ type: 'retrieval' }],
    file_ids: files.map((file) => file.id),
  })
}

async function loadOrCreateAssistantId() {
  const cache = await readFile(cachePath, { encoding: 'utf-8' }).catch(
    () => null,
  )

  if (cache) {
    const { assistantId } = JSON.parse(cache)
    if (assistantId) {
      console.log('Loaded assistant id from cache', assistantId)
      return assistantId
    }
  }

  const assistant = await createAssistant()
  const assistantId = assistant.id
  console.log('Created assistant', assistantId)
  // flush the assistant id to json
  await writeFile(cachePath, JSON.stringify({ assistantId }))
  return assistantId
}

async function main() {
  const id = await loadOrCreateAssistantId()
  const myAssistant = await openai.beta.assistants.retrieve(id)

  console.log(myAssistant)
}

main()
