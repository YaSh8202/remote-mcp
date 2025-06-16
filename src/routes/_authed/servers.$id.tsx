import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/servers/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authed/servers/$id"!</div>
}
