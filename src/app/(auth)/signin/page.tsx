import { SignInForm } from '@/components/auth/signin-form'

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome to Hornero</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your household finances
          </p>
        </div>
        <SignInForm />
      </div>
    </main>
  )
}
