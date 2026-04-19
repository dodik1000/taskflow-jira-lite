import './index.scss'

type LoaderProps = {
  text?: string
}

// simple loader
export default function Loader({ text = 'Loading...' }: LoaderProps) {
  return (
    <div className='loader'>
      <div className='loader__spinner' />
      <span className='loader__text'>{text}</span>
    </div>
  )
}
