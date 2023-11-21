import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI()

const openAIApiKey = process.env.OPENAI_API_KEY
const assistantId = process.env.ASSISTANT_ID

type ResponseData =
  | {
      threadId: string
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

  if (!openAIApiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  } else if (!assistantId) {
    throw new Error('ASSISTANT_ID is not set')
  }

  const thread = await openai.beta.threads.create()
  res.status(200).json({ threadId: thread.id })
}
