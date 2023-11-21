import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import type { MessageContentText } from 'openai/resources/beta/threads/messages/messages.mjs'

const openai = new OpenAI()

const openAIApiKey = process.env.OPENAI_API_KEY
const assistantId = process.env.ASSISTANT_ID

type ResponseData =
  | {
      id: string
      text: string
      inbound: boolean
    }[]
  | {
      error: string
    }

const getMessages = async (threadId: string) => {
  const threadMessages = await openai.beta.threads.messages.list(threadId, {
    order: 'asc',
  })

  const messages = threadMessages.data
    .filter((message) => message.content[0].type === 'text')
    .map((message) => {
      return {
        id: message.id,
        text: (message.content[0] as MessageContentText).text.value,
        inbound: message.role === 'assistant',
      }
    })

  console.log('messages', messages)
  return messages
}

const waitForRun = async (runId: string, threadId: string) => {
  let runStatus = 'queued'

  do {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId)
    console.log('run', run)
    runStatus = run.status
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, 1000)
    })
  } while (
    ['queued', 'in_progress', 'requires_action', 'cancelling'].includes(
      runStatus,
    )
  )
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const threadId = req.query.threadId as string

  if (!threadId) {
    res.status(400).json({ error: 'threadId is required' })
    return
  }
  if (!assistantId) {
    res.status(500).json({ error: 'ASSISTANT_ID is not set' })
    return
  }

  let messages = await getMessages(threadId)

  // check if the assistant needs to reply to the user
  const lastMessage = messages[messages.length - 1]

  if (lastMessage && !lastMessage.inbound) {
    console.log('assistant needs to reply to the user')

    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    })

    await waitForRun(run.id, threadId)

    messages = await getMessages(threadId)
  }

  res.status(200).json(messages)
}
