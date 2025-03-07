import AuthErrorClient from './auth-error-client'

type Props = {
  params: Promise<{}>
  searchParams: Promise<{ error?: string }>
}

export default async function Page({ params, searchParams }: Props) {
  await params; // Await the Promise for params
  const resolvedSearchParams = await searchParams; // Await the Promise for searchParams
  
  return <AuthErrorClient error={resolvedSearchParams.error} />
}
