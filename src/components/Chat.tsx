'use client'
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from '@tanstack/react-query'
import { useWallet } from '@thirdweb-dev/react'
import clsx from 'clsx'
import { KeyboardEventHandler, useCallback, useEffect, useState } from 'react'

const queryClient = new QueryClient()

function SendIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M7 11L12 6L17 11M12 18V7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  )
}

export function Conversation({
  messages,
  loading,
  onSend,
}: {
  messages: {
    id: string
    text: string
    inbound: boolean
  }[]
  loading: boolean
  onSend: (text: string) => void
}) {
  const [input, setInput] = useState('')

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        onSend(input)
        setInput('')
      }
    },
    [input, onSend],
  )

  return (
    <div className="flex max-h-screen flex-col gap-4 overflow-y-scroll">
      {messages.length === 0 && (
        <div className="flex items-center justify-center gap-4">
          <div className="rounded-2xl p-4 dark:text-zinc-100">
            <p className="text-lg italic">
              I&apos;m an AI trained on Mitch&apos;s resume, perspective, and
              thoughts. Ask me something like &ldquo;what was mitch&apos;s most
              recent experience?&rdquo;
            </p>
          </div>
        </div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className={clsx(
            'flex items-center gap-4',
            message.inbound ? 'justify-start' : 'justify-end',
          )}
        >
          <div
            className={clsx(
              'rounded-2xl p-4 shadow-sm shadow-zinc-800 backdrop-blur',
              message.inbound
                ? 'bg-white dark:bg-zinc-800 dark:ring-white dark:hover:ring-white'
                : 'bg-zinc-800 text-zinc-100 ring-zinc-900 dark:bg-white dark:text-zinc-900',
            )}
          >
            <p className="text-lg">{message.text}</p>
          </div>
        </div>
      ))}
      <div className="relative">
        <input
          value={input}
          onKeyDown={handleKeyDown}
          onChange={(event) => setInput(event.target.value)}
          disabled={loading}
          type="text"
          className="w-full rounded-2xl bg-zinc-800 p-4 text-zinc-100 shadow-sm shadow-zinc-800 ring-zinc-900 backdrop-blur dark:bg-white dark:text-zinc-900"
        />
        <button
          onClick={() => {
            setInput('')
            onSend(input)
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 transform disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading}
        >
          <span className="sr-only">Send</span>

          <SendIcon
            className={clsx(
              'text-white dark:text-black',
              loading ? 'animate-spin' : '',
            )}
          />
        </button>
      </div>
    </div>
  )
}

export function ConversationLoader({
  chainId,
  address,
}: {
  chainId: number
  address: string
}) {
  const {
    isPending,
    error: createThreadError,
    data: createThreadData,
  } = useQuery<{
    threadId: string
  }>({
    queryKey: [`${chainId}:${address}`],
    queryFn: () =>
      fetch('/api/chat/create', { method: 'POST' }).then((res) => res.json()),
  })
  console.log(createThreadData)
  const threadId = createThreadData?.threadId
  const {
    isPending: pendingMessages,
    isLoading: loadingMessages,
    isRefetching: reloadingMessages,
    error,
    data: messages,
    refetch: reloadMessages,
  } = useQuery<
    {
      id: string
      text: string
      inbound: boolean
    }[]
  >({
    enabled: !!threadId,
    queryKey: [threadId],
    queryFn: () =>
      fetch('/api/chat/read?threadId=' + threadId, { method: 'GET' }).then(
        (res) => res.json(),
      ),
  })

  // if (isPending) return 'Loading...'

  // if (error) return 'An error has occurred: ' + error.message
  const { mutate: sendMessage, isPending: sendingMessage } = useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [threadId] })
    },
    mutationFn({ text }: { text: string }) {
      return fetch('/api/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          threadId: threadId,
          text,
        }),
      }).then((res) => res.json())
    },
  })
  return (
    <Conversation
      loading={
        loadingMessages ||
        sendingMessage ||
        pendingMessages ||
        reloadingMessages
      }
      messages={messages ?? []}
      onSend={(text) => sendMessage({ text })}
    />
  )
}

export function Chat() {
  const wallet = useWallet()

  const [chainId, setChainId] = useState<number | undefined>(undefined)
  const [address, setAddress] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (wallet) {
      wallet.getChainId().then(setChainId)
      wallet.getAddress().then(setAddress)
    }
  }, [wallet])

  return (
    <div className="rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
      {chainId && address ? (
        <QueryClientProvider client={queryClient}>
          <ConversationLoader chainId={chainId} address={address} />
        </QueryClientProvider>
      ) : (
        <div>
          <h3>
            Connect your wallet to chat with an AI trained on my resume,
            perspective, and thoughts!
          </h3>
        </div>
      )}
    </div>
  )
}
