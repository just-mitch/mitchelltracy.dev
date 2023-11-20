import Link from 'next/link'

export function SocialLink({
  icon: Icon,
  size = 'sm',
  ...props
}: React.ComponentPropsWithoutRef<typeof Link> & {
  icon: React.ComponentType<{ className?: string }>
  size?: 'sm' | 'lg'
}) {
  return (
    <Link className="group -m-1 p-1" {...props}>
      <Icon
        className={
          ' fill-zinc-500 transition group-hover:fill-zinc-600 dark:fill-zinc-400 dark:group-hover:fill-zinc-300 ' +
          (size === 'sm' ? 'h-6 w-6' : 'h-8 w-8')
        }
      />
    </Link>
  )
}
