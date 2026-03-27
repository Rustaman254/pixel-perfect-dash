import { Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import GalleryPage from '@/pages/GalleryPage'
import EditorPage from '@/pages/EditorPage'
import PreviewPage from '@/pages/PreviewPage'
import DashboardPage from '@/pages/DashboardPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/editor/:projectId" element={<EditorPage />} />
      <Route path="/preview/:projectId" element={<PreviewPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  )
}
