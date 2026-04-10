import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './Home'
import LvlOne from './LvlOne'
import Second from './Second'
import Final from './Final'
import Win from './Win'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/LvlOne" element={<LvlOne />} />
        <Route path="/Second" element={<Second />} />
        <Route path="/Final" element={<Final />} />
        <Route path="/Win" element={<Win />} />
      </Routes>
    </Router>
  )
}