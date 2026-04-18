import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-black border-b border-red-600/20">
      <Link to="/" className="text-2xl font-bold text-red-600 tracking-widest">
        REDLINE
      </Link>
      <div className="flex gap-8">
        <Link to="/teams" className="text-white/60 hover:text-white text-sm tracking-widest uppercase transition-colors">
          Teams
        </Link>
        <Link to="/drivers" className="text-white/60 hover:text-white text-sm tracking-widest uppercase transition-colors">
          Drivers
        </Link>
      </div>
    </nav>
  )
}

export default Navbar