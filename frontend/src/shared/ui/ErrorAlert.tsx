export function ErrorAlert({ message }: { message: string }) {
  return <div className="mona-alert mona-alert--danger">{message}</div>
}
