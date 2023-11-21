import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI()

const openAIApiKey = process.env.OPENAI_API_KEY
const assistantId = process.env.ASSISTANT_ID

type ResponseData =
  | {
      messageId: string
    }
  | {
      error: string
    }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  console.log('req.body', req.body)
  const body = JSON.parse(req.body)

  const text = body.text as string
  const threadId = body.threadId as string

  if (!text) {
    res.status(400).json({ error: 'text is required' })
    return
  }

  const response = await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: text,
  })

  res.status(200).json({
    messageId: response.id,
  })
}
