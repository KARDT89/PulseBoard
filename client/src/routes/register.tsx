import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { z } from 'zod'
import { authApi } from '@/api/auth.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconArrowRight, IconLoader2 } from '@tabler/icons-react'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

const schema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
})

function RegisterPage() {
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (values: { name: string; email: string; password: string }) =>
      authApi.register(values),
    onSuccess: () => {
      toast.success('Account created. Sign in to continue.')
      navigate({ to: '/login' })
    },
    onError: () => toast.error('Registration failed. Try again.'),
  })

  const form = useForm({
    defaultValues: { name: '', email: '', password: '' },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value)
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message)
        return
      }
      mutation.mutate(value)
    },
  })

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-10">
            <p className="text-xs tracking-[0.3em] text-red-500 uppercase mb-2">Pollify</p>
            <h2 className="text-2xl font-bold text-white">Create account</h2>
            <p className="text-zinc-500 text-sm mt-1">Start collecting feedback today</p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
            className="space-y-5"
          >
            <form.Field name="name">
              {(field) => (
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs tracking-wider uppercase">Full name</Label>
                  <Input
                    placeholder="John Doe"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-red-600 focus-visible:border-red-600"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="email">
              {(field) => (
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs tracking-wider uppercase">Email</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-red-600 focus-visible:border-red-600"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs tracking-wider uppercase">Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-red-600 focus-visible:border-red-600"
                  />
                </div>
              )}
            </form.Field>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium tracking-wide"
            >
              {mutation.isPending ? (
                <IconLoader2 className="animate-spin" size={16} />
              ) : (
                <>Create account <IconArrowRight size={16} className="ml-2" /></>
              )}
            </Button>
          </form>

          <p className="text-zinc-600 text-sm text-center mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-red-500 hover:text-red-400 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
